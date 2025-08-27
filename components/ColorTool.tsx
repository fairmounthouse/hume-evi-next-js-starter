"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ColorWheel } from './ColorWheel';
import { LightnessSlider } from './LightnessSlider';
import { ContrastChecker } from './ContrastChecker';
import { ColorCombinations } from './ColorCombinations';
import { ColorExport } from './ColorExport';
import { ColorTheory } from './ColorTheory';
import { hexToRgb, hexToHsl, generateRandomColor, getColorCombination } from '@/utils/color-utils';
import { Shuffle, Palette, Eye, Download, BookOpen, Settings } from 'lucide-react';
import { toast } from 'sonner';

export function ColorTool() {
  const [selectedColor, setSelectedColor] = useState('#52d728');
  const [activeTab, setActiveTab] = useState('picker');

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
  };

  const handleRandomColor = () => {
    const randomColor = generateRandomColor();
    setSelectedColor(randomColor);
    toast.success('Generated random color!');
  };

  const handleHexInput = (value: string) => {
    if (/^#[0-9A-F]{6}$/i.test(value)) {
      setSelectedColor(value);
    }
  };

  const rgb = hexToRgb(selectedColor);
  const hsl = hexToHsl(selectedColor);
  const analogousColors = getColorCombination(selectedColor, 'analogous');

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Color Wheel & Design Tool
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover perfect color combinations, check accessibility, and export palettes for your landing page design.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-3 lg:grid-cols-6 mx-auto">
            <TabsTrigger value="picker" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              <span className="hidden sm:inline">Picker</span>
            </TabsTrigger>
            <TabsTrigger value="combinations" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Combinations</span>
            </TabsTrigger>
            <TabsTrigger value="contrast" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">Contrast</span>
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </TabsTrigger>
            <TabsTrigger value="theory" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Theory</span>
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">Preview</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="picker" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Color Picker */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>1. Pick a color</span>
                    <Button onClick={handleRandomColor} variant="outline" size="sm">
                      <Shuffle className="w-4 h-4 mr-2" />
                      Random
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex justify-center">
                    <ColorWheel
                      selectedColor={selectedColor}
                      onColorChange={handleColorChange}
                      size={300}
                    />
                  </div>
                  
                  <LightnessSlider
                    selectedColor={selectedColor}
                    onColorChange={handleColorChange}
                  />
                </CardContent>
              </Card>

              {/* Color Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Color Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="hex-input">Hex</Label>
                      <Input
                        id="hex-input"
                        value={selectedColor.toUpperCase()}
                        onChange={(e) => handleHexInput(e.target.value)}
                        className="font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <Label className="text-xs">R</Label>
                        <div className="font-mono text-center p-2 bg-muted rounded">
                          {rgb.r}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">G</Label>
                        <div className="font-mono text-center p-2 bg-muted rounded">
                          {rgb.g}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">B</Label>
                        <div className="font-mono text-center p-2 bg-muted rounded">
                          {rgb.b}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <Label className="text-xs">H</Label>
                        <div className="font-mono text-center p-2 bg-muted rounded">
                          {hsl.h}°
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">S</Label>
                        <div className="font-mono text-center p-2 bg-muted rounded">
                          {hsl.s}%
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">L</Label>
                        <div className="font-mono text-center p-2 bg-muted rounded">
                          {hsl.l}%
                        </div>
                      </div>
                    </div>

                    <div 
                      className="w-full h-20 rounded-lg border shadow-sm"
                      style={{ backgroundColor: selectedColor }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="combinations">
            <ColorCombinations
              selectedColor={selectedColor}
              onColorSelect={setSelectedColor}
            />
          </TabsContent>

          <TabsContent value="contrast">
            <ContrastChecker primaryColor={selectedColor} />
          </TabsContent>

          <TabsContent value="export">
            <ColorExport
              colors={analogousColors}
              paletteName="Landing Page Palette"
            />
          </TabsContent>

          <TabsContent value="theory">
            <ColorTheory />
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Landing Page Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Hero Section Preview */}
                  <div 
                    className="p-8 rounded-lg text-white"
                    style={{ backgroundColor: selectedColor }}
                  >
                    <h2 className="text-3xl font-bold mb-4">Your Amazing Product</h2>
                    <p className="text-lg opacity-90 mb-6">
                      Transform your business with our innovative solution that delivers results.
                    </p>
                    <button 
                      className="px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                    >
                      Get Started
                    </button>
                  </div>

                  {/* Content Section Preview */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {analogousColors.map((color, index) => (
                      <div key={index} className="p-6 rounded-lg border" style={{ borderColor: color }}>
                        <div 
                          className="w-12 h-12 rounded-lg mb-4"
                          style={{ backgroundColor: color }}
                        />
                        <h3 className="text-lg font-semibold mb-2">Feature {index + 1}</h3>
                        <p className="text-muted-foreground">
                          Showcase your key features with this beautiful color palette.
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Navigation Preview */}
                  <div className="p-4 bg-white border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-6">
                        <div 
                          className="w-8 h-8 rounded"
                          style={{ backgroundColor: selectedColor }}
                        />
                        <nav className="flex space-x-6">
                          <a href="#" className="text-gray-600 hover:text-gray-900">Home</a>
                          <a href="#" className="text-gray-600 hover:text-gray-900">About</a>
                          <a href="#" className="text-gray-600 hover:text-gray-900">Services</a>
                          <a href="#" className="text-gray-600 hover:text-gray-900">Contact</a>
                        </nav>
                      </div>
                      <button 
                        className="px-4 py-2 rounded text-white font-medium"
                        style={{ backgroundColor: selectedColor }}
                      >
                        Sign Up
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
