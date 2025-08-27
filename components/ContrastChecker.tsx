"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { getContrastRatio, getWCAGLevel, hexToRgb } from '@/utils/color-utils';
import { Eye, Type, AlertTriangle, CheckCircle } from 'lucide-react';

interface ContrastCheckerProps {
  primaryColor: string;
  className?: string;
}

export function ContrastChecker({ primaryColor, className = "" }: ContrastCheckerProps) {
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [textColor, setTextColor] = useState(primaryColor);

  React.useEffect(() => {
    setTextColor(primaryColor);
  }, [primaryColor]);

  const contrastRatio = getContrastRatio(textColor, backgroundColor);
  const normalTextLevel = getWCAGLevel(contrastRatio, false);
  const largeTextLevel = getWCAGLevel(contrastRatio, true);

  const getStatusIcon = (level: string) => {
    switch (level) {
      case 'AAA':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'AA':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'A':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
    }
  };

  const getStatusColor = (level: string) => {
    switch (level) {
      case 'AAA':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'AA':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'A':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="w-5 h-5" />
          Contrast Checker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Color Inputs */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="text-color">Text Color</Label>
            <div className="flex gap-2">
              <Input
                id="text-color"
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="w-12 h-10 p-1 border rounded"
              />
              <Input
                value={textColor.toUpperCase()}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^#[0-9A-F]{6}$/i.test(value)) {
                    setTextColor(value);
                  }
                }}
                placeholder="#000000"
                className="flex-1"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bg-color">Background Color</Label>
            <div className="flex gap-2">
              <Input
                id="bg-color"
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-12 h-10 p-1 border rounded"
              />
              <Input
                value={backgroundColor.toUpperCase()}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^#[0-9A-F]{6}$/i.test(value)) {
                    setBackgroundColor(value);
                  }
                }}
                placeholder="#FFFFFF"
                className="flex-1"
              />
            </div>
          </div>
        </div>

        {/* Contrast Ratio Display */}
        <div className="text-center space-y-2">
          <div className="text-3xl font-bold">
            {contrastRatio.toFixed(2)}:1
          </div>
          <div className="text-sm text-muted-foreground">
            Contrast Ratio
          </div>
        </div>

        {/* WCAG Compliance */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4" />
              <span className="font-medium">Normal Text</span>
              <span className="text-sm text-muted-foreground">(14px+)</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(normalTextLevel.level)}
              <Badge className={getStatusColor(normalTextLevel.level)}>
                {normalTextLevel.level}
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              <Type className="w-5 h-5" />
              <span className="font-medium">Large Text</span>
              <span className="text-sm text-muted-foreground">(18px+)</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(largeTextLevel.level)}
              <Badge className={getStatusColor(largeTextLevel.level)}>
                {largeTextLevel.level}
              </Badge>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-3">
          <Label>Preview</Label>
          <div 
            className="p-4 rounded-lg border"
            style={{ backgroundColor, color: textColor }}
          >
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Sample Heading</h3>
              <p className="text-sm">
                This is sample text to demonstrate the contrast between your selected colors. 
                Make sure it's readable and meets accessibility standards.
              </p>
              <p className="text-xs">
                Small text example for testing readability.
              </p>
            </div>
          </div>
        </div>

        {/* Guidelines */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>WCAG Guidelines:</strong></p>
          <p>• AA: 4.5:1 for normal text, 3:1 for large text</p>
          <p>• AAA: 7:1 for normal text, 4.5:1 for large text</p>
        </div>
      </CardContent>
    </Card>
  );
}
