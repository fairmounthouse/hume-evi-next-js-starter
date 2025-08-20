/**
 * Global Variable Substitution System
 * Inspired by Hume's approach to soft failures and graceful degradation
 * 
 * Features:
 * - Registry-based variable processors
 * - Automatic variable detection
 * - Soft failure handling (like Hume's fallback content)
 * - Extensible and generalizable
 */

export interface VariableProcessor {
  name: string;
  description: string;
  pattern: RegExp;
  processor: (context?: any) => Promise<string> | string;
  fallbackValue?: string;
  cacheTtl?: number; // milliseconds
}

export interface SubstitutionContext {
  sessionId?: string;
  elapsedMs?: number;
  startTime?: Date;
  metadata?: any;
}

export interface SubstitutionResult {
  success: boolean;
  processedText: string;
  substitutions: Array<{
    variable: string;
    value: string;
    processor: string;
    cached?: boolean;
  }>;
  warnings: Array<{
    variable: string;
    message: string;
    code?: string; // Hume-style warning codes
    fallbackUsed?: string;
  }>;
  detectedVariables: string[];
  unprocessedVariables: string[];
}

class VariableSubstitutionRegistry {
  private processors = new Map<string, VariableProcessor>();
  private cache = new Map<string, { value: string; expires: number }>();

  /**
   * Register a new variable processor
   */
  register(processor: VariableProcessor): void {
    this.processors.set(processor.name, processor);
    console.log(`🔧 Registered variable processor: ${processor.name}`, {
      description: processor.description,
      pattern: processor.pattern.source,
      hasFallback: !!processor.fallbackValue,
      cacheTtl: processor.cacheTtl || 0
    });
  }

  /**
   * Detect all variables in a text template
   */
  detectVariables(template: string): string[] {
    const variablePattern = /\{\{([^}]+)\}\}/g;
    const variables: string[] = [];
    let match;

    while ((match = variablePattern.exec(template)) !== null) {
      const variable = match[1].trim();
      if (!variables.includes(variable)) {
        variables.push(variable);
      }
    }

    return variables;
  }

  /**
   * Find processor for a specific variable
   */
  findProcessor(variableName: string): VariableProcessor | null {
    // Direct name match
    if (this.processors.has(variableName)) {
      return this.processors.get(variableName)!;
    }

    // Pattern-based match
    for (const processor of this.processors.values()) {
      if (processor.pattern.test(variableName)) {
        return processor;
      }
    }

    return null;
  }

  /**
   * Get cached value if available and not expired
   */
  private getCachedValue(key: string): string | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expires) {
      return cached.value;
    }
    
    if (cached) {
      this.cache.delete(key); // Remove expired cache
    }
    
    return null;
  }

  /**
   * Cache a value with TTL
   */
  private setCachedValue(key: string, value: string, ttl: number): void {
    this.cache.set(key, {
      value,
      expires: Date.now() + ttl
    });
  }

  /**
   * Process all variables in a template with Hume-compliant soft failure handling
   */
  async substitute(
    template: string, 
    context: SubstitutionContext = {}
  ): Promise<SubstitutionResult> {
    const variables = this.detectVariables(template);
    const unprocessedVariables: string[] = [];
    
    const result: SubstitutionResult = {
      success: true,
      processedText: template,
      substitutions: [],
      warnings: [],
      detectedVariables: variables,
      unprocessedVariables: []
    };
    
    if (variables.length === 0) {
      console.log("✅ No variables detected in template");
      return result; // No variables to process
    }

    console.log(`🔍 Detected ${variables.length} variables in template:`, {
      variables,
      templateLength: template.length,
      templatePreview: template.substring(0, 200) + "..."
    });

    for (const variable of variables) {
      const processor = this.findProcessor(variable);
      
      if (!processor) {
        // Hume W0106-style warning: Variable referenced but no value provided
        const warning = {
          variable,
          message: `No values have been specified for the variable [${variable}], which can lead to incorrect text formatting. Please assign it a value or register a processor.`,
          code: "W0106" // Following Hume's warning code pattern
        };
        result.warnings.push(warning);
        unprocessedVariables.push(variable);
        console.warn(`⚠️ W0106: ${warning.message}`, {
          variable,
          availableProcessors: Array.from(this.processors.keys()),
          registeredProcessorCount: this.processors.size
        });
        continue;
      }

      try {
        // Check cache first (if processor supports caching)
        const cacheKey = `${processor.name}_${variable}_${JSON.stringify(context)}`;
        let value = processor.cacheTtl ? this.getCachedValue(cacheKey) : null;
        let fromCache = !!value;

        if (!value) {
          // Add current variable to context for pattern processors
          const enhancedContext = {
            ...context,
            metadata: {
              ...context.metadata,
              currentVariable: variable
            }
          };
          
          // Process the variable
          value = await processor.processor(enhancedContext);
          
          // Cache if TTL is specified
          if (processor.cacheTtl && value) {
            this.setCachedValue(cacheKey, value, processor.cacheTtl);
          }
        }

        // Replace the variable in the template
        const pattern = new RegExp(`\\{\\{\\s*${variable}\\s*\\}\\}`, 'g');
        result.processedText = result.processedText.replace(pattern, value);

        result.substitutions.push({
          variable,
          value,
          processor: processor.name,
          cached: fromCache
        });

        console.log(`✅ Variable substituted successfully:`, {
          variable,
          processor: processor.name,
          valueLength: value.length,
          valuePreview: value.substring(0, 100) + (value.length > 100 ? '...' : ''),
          fromCache,
          cacheTtl: processor.cacheTtl || 0
        });

      } catch (error) {
        // Soft failure: Use fallback value if available
        const fallback = processor.fallbackValue || `[${variable}_ERROR]`;
        const pattern = new RegExp(`\\{\\{\\s*${variable}\\s*\\}\\}`, 'g');
        result.processedText = result.processedText.replace(pattern, fallback);

        const warning = {
          variable,
          message: `Error processing variable '${variable}': ${error}`,
          code: "E0001", // Custom error code for processing failures
          fallbackUsed: fallback
        };
        result.warnings.push(warning);
        unprocessedVariables.push(variable);
        result.success = false;
        
        console.error(`❌ E0001: Variable processing failed for ${variable}:`, error);
        console.log(`🔄 Using fallback value: ${fallback}`);
      }
    }

    // Set final unprocessed variables list
    result.unprocessedVariables = unprocessedVariables;

    return result;
  }

  /**
   * Get registry status and available processors
   */
  getStatus(): {
    totalProcessors: number;
    processors: Array<{
      name: string;
      description: string;
      pattern: string;
      hasFallback: boolean;
      cacheable: boolean;
    }>;
  } {
    return {
      totalProcessors: this.processors.size,
      processors: Array.from(this.processors.values()).map(p => ({
        name: p.name,
        description: p.description,
        pattern: p.pattern.source,
        hasFallback: !!p.fallbackValue,
        cacheable: !!p.cacheTtl
      }))
    };
  }

  /**
   * Clear all cached values
   */
  clearCache(): void {
    this.cache.clear();
    console.log("🧹 Variable substitution cache cleared");
  }
}

// Global singleton instance
export const variableRegistry = new VariableSubstitutionRegistry();

// Export types and main function
export { VariableSubstitutionRegistry };
export const substituteVariables = (template: string, context?: SubstitutionContext) => 
  variableRegistry.substitute(template, context);
