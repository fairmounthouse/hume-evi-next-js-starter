import { NextRequest, NextResponse } from 'next/server';
import { processVariableSubstitution, getVariableRegistryStatus } from '@/utils/session-context';

/**
 * API endpoint to test Hume-compliant variable substitution system
 * Usage: POST /api/variables/test with { template, sessionId?, elapsedMs?, testType? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { template, sessionId, elapsedMs, testType } = body;

    if (!template || typeof template !== 'string') {
      return NextResponse.json(
        { error: 'Template is required and must be a string' },
        { status: 400 }
      );
    }

    // Process variable substitution with Hume compliance
    const result = await processVariableSubstitution(
      template,
      sessionId,
      elapsedMs || 0,
      new Date(),
      { testMode: true, testType }
    );

    // Format response following Hume's pattern
    const response = {
      success: true,
      original: template,
      processed: result.processedText,
      warnings: result.warnings || [],
      substitutionSuccess: result.success,
      humeCompliance: {
        builtInVariables: ["now"], // Variables handled by Hume automatically
        w0106Warnings: (result.warnings || []).filter(w => w.code === "W0106").length
      },
      registry: getVariableRegistryStatus(),
      note: "detectedVariables and substitutions removed - use registry status for processor info"
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Variable substitution test error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to show available variable processors
 */
export async function GET() {
  try {
    const status = getVariableRegistryStatus();
    
    return NextResponse.json({
      success: true,
      message: "Global Variable Substitution System Status",
      ...status,
      examples: [
        "{{TOTAL_ELAPSED_TIME}} - Elapsed time since start",
        "{{now}} - Current timestamp",
        "{{ELAPSED_TIME_FORMAT_HOURS}} - Time in hours format",
        "{{CURRENT_PHASE}} - Current interview phase",
        "{{UNKNOWN_VAR}} - Will trigger soft failure (graceful degradation)"
      ]
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get registry status', details: String(error) },
      { status: 500 }
    );
  }
}
