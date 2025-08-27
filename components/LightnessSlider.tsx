"use client";

import React from 'react';
import { Slider } from '@/components/ui/slider';
import { hexToHsl, hslToHex } from '@/utils/color-utils';

interface LightnessSliderProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
  className?: string;
}

export function LightnessSlider({ selectedColor, onColorChange, className = "" }: LightnessSliderProps) {
  const hsl = hexToHsl(selectedColor);

  const handleLightnessChange = (values: number[]) => {
    const newLightness = values[0];
    const newColor = hslToHex(hsl.h, hsl.s, newLightness);
    onColorChange(newColor);
  };

  // Create gradient background for the slider
  const gradientStyle = {
    background: `linear-gradient(to right, 
      ${hslToHex(hsl.h, hsl.s, 0)}, 
      ${hslToHex(hsl.h, hsl.s, 25)}, 
      ${hslToHex(hsl.h, hsl.s, 50)}, 
      ${hslToHex(hsl.h, hsl.s, 75)}, 
      ${hslToHex(hsl.h, hsl.s, 100)}
    )`
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-sm font-medium">Lightness</label>
      <div className="relative">
        <div 
          className="absolute inset-0 rounded-full h-1.5 top-1/2 transform -translate-y-1/2"
          style={gradientStyle}
        />
        <Slider
          value={[hsl.l]}
          onValueChange={handleLightnessChange}
          max={100}
          min={0}
          step={1}
          className="relative z-10"
        />
      </div>
      <div className="text-xs text-muted-foreground text-center">
        {hsl.l}%
      </div>
    </div>
  );
}
