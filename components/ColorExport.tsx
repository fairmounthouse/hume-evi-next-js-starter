"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Download, Copy, FileText, Code, Palette } from 'lucide-react';
import { toast } from 'sonner';
import { hexToRgb, hexToHsl } from '@/utils/color-utils';

interface ColorExportProps {
  colors: string[];
  paletteName?: string;
  className?: string;
}

export function ColorExport({ colors, paletteName = "Custom Palette", className = "" }: ColorExportProps) {
  const [activeTab, setActiveTab] = useState("css");

  const generateCSS = () => {
    const cssVars = colors.map((color, index) => {
      const name = `color-${index + 1}`;
      return `  --${name}: ${color};`;
    }).join('\n');

    return `:root {
${cssVars}
}

/* Usage Examples */
.primary { color: var(--color-1); }
.secondary { color: var(--color-2); }
.accent { color: var(--color-3); }`;
  };

  const generateSCSS = () => {
    const scssVars = colors.map((color, index) => {
      const name = `color-${index + 1}`;
      return `$${name}: ${color};`;
    }).join('\n');

    const colorMap = colors.map((color, index) => {
      const name = `color-${index + 1}`;
      return `  "${name}": $${name}`;
    }).join(',\n');

    return `// Color Variables
${scssVars}

// Color Map
$colors: (
${colorMap}
);

// Usage Examples
.primary { color: $color-1; }
.secondary { color: $color-2; }
.accent { color: $color-3; }`;
  };

  const generateTailwind = () => {
    const tailwindColors = colors.reduce((acc, color, index) => {
      const name = `color-${index + 1}`;
      acc[name] = color;
      return acc;
    }, {} as Record<string, string>);

    return `// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: ${JSON.stringify(tailwindColors, null, 8)}
    }
  }
}

// Usage Examples
// <div className="text-color-1 bg-color-2">
// <div className="border-color-3">`;
  };

  const generateJSON = () => {
    const palette = {
      name: paletteName,
      colors: colors.map((color, index) => ({
        name: `color-${index + 1}`,
        hex: color,
        rgb: hexToRgb(color),
        hsl: hexToHsl(color)
      })),
      metadata: {
        created: new Date().toISOString(),
        count: colors.length
      }
    };

    return JSON.stringify(palette, null, 2);
  };

  const generateASE = () => {
    // Adobe Swatch Exchange format (simplified text representation)
    const aseColors = colors.map((color, index) => {
      const rgb = hexToRgb(color);
      return `Color ${index + 1}: RGB(${rgb.r}, ${rgb.g}, ${rgb.b}) - ${color}`;
    }).join('\n');

    return `Adobe Swatch Exchange (ASE) Format
Palette: ${paletteName}
Colors: ${colors.length}

${aseColors}

Note: This is a text representation. For actual ASE files, use Adobe software or specialized tools.`;
  };

  const generateSketch = () => {
    const sketchColors = colors.map((color, index) => {
      const rgb = hexToRgb(color);
      return `{
  "name": "Color ${index + 1}",
  "hex": "${color}",
  "red": ${(rgb.r / 255).toFixed(3)},
  "green": ${(rgb.g / 255).toFixed(3)},
  "blue": ${(rgb.b / 255).toFixed(3)},
  "alpha": 1
}`;
    }).join(',\n');

    return `{
  "compatibleVersion": "3.0",
  "pluginVersion": "1.0",
  "colors": [
${sketchColors}
  ]
}`;
  };

  const formats = [
    { id: 'css', label: 'CSS', icon: Code, generator: generateCSS },
    { id: 'scss', label: 'SCSS', icon: Code, generator: generateSCSS },
    { id: 'tailwind', label: 'Tailwind', icon: Code, generator: generateTailwind },
    { id: 'json', label: 'JSON', icon: FileText, generator: generateJSON },
    { id: 'ase', label: 'ASE', icon: Palette, generator: generateASE },
    { id: 'sketch', label: 'Sketch', icon: Palette, generator: generateSketch }
  ];

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard!');
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}`);
  };

  const getFileExtension = (formatId: string) => {
    switch (formatId) {
      case 'css': return '.css';
      case 'scss': return '.scss';
      case 'tailwind': return '.js';
      case 'json': return '.json';
      case 'ase': return '.txt';
      case 'sketch': return '.json';
      default: return '.txt';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5" />
          Export Palette
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{colors.length} colors</Badge>
          <span className="text-sm text-muted-foreground">{paletteName}</span>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 lg:grid-cols-6">
            {formats.map((format) => {
              const Icon = format.icon;
              return (
                <TabsTrigger key={format.id} value={format.id} className="flex items-center gap-1">
                  <Icon className="w-3 h-3" />
                  <span className="hidden sm:inline">{format.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {formats.map((format) => (
            <TabsContent key={format.id} value={format.id} className="space-y-4">
              <div className="flex gap-2">
                <Button
                  onClick={() => copyToClipboard(format.generator())}
                  variant="outline"
                  size="sm"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
                <Button
                  onClick={() => downloadFile(
                    format.generator(), 
                    `${paletteName.toLowerCase().replace(/\s+/g, '-')}-palette${getFileExtension(format.id)}`
                  )}
                  variant="outline"
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
              
              <Textarea
                value={format.generator()}
                readOnly
                className="font-mono text-sm min-h-[300px]"
                placeholder="Generated code will appear here..."
              />
            </TabsContent>
          ))}
        </Tabs>

        {/* Color Preview */}
        <div className="mt-6 space-y-2">
          <h4 className="font-medium">Palette Preview</h4>
          <div className="flex gap-2 flex-wrap">
            {colors.map((color, index) => (
              <div key={index} className="flex flex-col items-center space-y-1">
                <div
                  className="w-12 h-12 rounded-lg border shadow-sm"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs font-mono">{color}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
