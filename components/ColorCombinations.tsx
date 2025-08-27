"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  getColorCombination, 
  ColorCombinationType, 
  hexToHsl, 
  getColorTemperature,
  getShades,
  getTints,
  getTones
} from '@/utils/color-utils';
import { Copy, Palette, Thermometer } from 'lucide-react';
import { toast } from 'sonner';

interface ColorCombinationsProps {
  selectedColor: string;
  onColorSelect?: (color: string) => void;
  className?: string;
}

const combinationTypes: { value: ColorCombinationType; label: string; description: string }[] = [
  { 
    value: 'complementary', 
    label: 'Complementary', 
    description: 'Colors opposite on the color wheel - high contrast and vibrant' 
  },
  { 
    value: 'analogous', 
    label: 'Analogous', 
    description: 'Colors next to each other - harmonious and pleasing' 
  },
  { 
    value: 'triadic', 
    label: 'Triadic', 
    description: 'Three colors evenly spaced - vibrant yet balanced' 
  },
  { 
    value: 'tetradic', 
    label: 'Tetradic', 
    description: 'Four colors forming a rectangle - rich and varied' 
  },
  { 
    value: 'monochromatic', 
    label: 'Monochromatic', 
    description: 'Different shades of the same color - elegant and cohesive' 
  }
];

export function ColorCombinations({ selectedColor, onColorSelect, className = "" }: ColorCombinationsProps) {
  const [selectedCombination, setSelectedCombination] = useState<ColorCombinationType>('analogous');
  
  const colors = getColorCombination(selectedColor, selectedCombination);
  const shades = getShades(selectedColor, 5);
  const tints = getTints(selectedColor, 5);
  const tones = getTones(selectedColor, 5);
  
  const hsl = hexToHsl(selectedColor);
  const temperature = getColorTemperature(selectedColor);

  const copyColor = (color: string) => {
    navigator.clipboard.writeText(color.toUpperCase());
    toast.success(`Copied ${color.toUpperCase()} to clipboard`);
  };

  const copyPalette = (colors: string[]) => {
    const palette = colors.join(', ');
    navigator.clipboard.writeText(palette);
    toast.success('Copied palette to clipboard');
  };

  const ColorSwatch = ({ color, size = "large", showHex = true }: { 
    color: string; 
    size?: "small" | "large"; 
    showHex?: boolean;
  }) => (
    <div className="flex flex-col items-center space-y-1">
      <button
        onClick={() => {
          copyColor(color);
          onColorSelect?.(color);
        }}
        className={`
          ${size === "large" ? "w-16 h-16" : "w-10 h-10"} 
          rounded-lg border-2 border-gray-200 hover:border-gray-400 
          transition-all hover:scale-105 cursor-pointer shadow-sm
        `}
        style={{ backgroundColor: color }}
        title={`Click to copy ${color}`}
      />
      {showHex && (
        <span className="text-xs font-mono text-center">
          {color.toUpperCase()}
        </span>
      )}
    </div>
  );

  const getTemperatureColor = (temp: string) => {
    switch (temp) {
      case 'warm': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'cool': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Color Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Color Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ColorSwatch color={selectedColor} />
                <div>
                  <div className="font-mono text-sm">{selectedColor.toUpperCase()}</div>
                  <div className="text-xs text-muted-foreground">
                    HSL({hsl.h}°, {hsl.s}%, {hsl.l}%)
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Thermometer className="w-4 h-4" />
                <span className="text-sm font-medium">Temperature:</span>
              </div>
              <Badge className={getTemperatureColor(temperature)}>
                {temperature.charAt(0).toUpperCase() + temperature.slice(1)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Color Combinations */}
      <Card>
        <CardHeader>
          <CardTitle>Color Combinations</CardTitle>
          <div className="space-y-2">
            <Select value={selectedCombination} onValueChange={(value: ColorCombinationType) => setSelectedCombination(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {combinationTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {combinationTypes.find(t => t.value === selectedCombination)?.description}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex gap-4">
                {colors.map((color, index) => (
                  <ColorSwatch key={index} color={color} />
                ))}
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => copyPalette(colors)}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Palette
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shades, Tints, and Tones */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Shades */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Shades</CardTitle>
            <p className="text-sm text-muted-foreground">Adding black</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex gap-2">
                {shades.map((color, index) => (
                  <ColorSwatch key={index} color={color} size="small" showHex={false} />
                ))}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => copyPalette(shades)}
              >
                <Copy className="w-3 h-3 mr-2" />
                Copy Shades
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tints */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tints</CardTitle>
            <p className="text-sm text-muted-foreground">Adding white</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex gap-2">
                {tints.map((color, index) => (
                  <ColorSwatch key={index} color={color} size="small" showHex={false} />
                ))}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => copyPalette(tints)}
              >
                <Copy className="w-3 h-3 mr-2" />
                Copy Tints
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tones */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tones</CardTitle>
            <p className="text-sm text-muted-foreground">Adding gray</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex gap-2">
                {tones.map((color, index) => (
                  <ColorSwatch key={index} color={color} size="small" showHex={false} />
                ))}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => copyPalette(tones)}
              >
                <Copy className="w-3 h-3 mr-2" />
                Copy Tones
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
