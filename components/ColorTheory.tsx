"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Lightbulb, Eye, Thermometer, Palette, Zap } from 'lucide-react';

export function ColorTheory({ className = "" }: { className?: string }) {
  const ColorSwatch = ({ color, label }: { color: string; label: string }) => (
    <div className="flex flex-col items-center space-y-1">
      <div
        className="w-12 h-12 rounded-lg border shadow-sm"
        style={{ backgroundColor: color }}
      />
      <span className="text-xs text-center">{label}</span>
    </div>
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Color Theory Guide
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="basics" className="space-y-4">
          <TabsList className="grid grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="basics">Basics</TabsTrigger>
            <TabsTrigger value="combinations">Combinations</TabsTrigger>
            <TabsTrigger value="psychology">Psychology</TabsTrigger>
            <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
          </TabsList>

          <TabsContent value="basics" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                <h3 className="text-lg font-semibold">Color Wheel Basics</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Primary Colors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-center gap-2 mb-3">
                      <ColorSwatch color="#FF0000" label="Red" />
                      <ColorSwatch color="#00FF00" label="Green" />
                      <ColorSwatch color="#0000FF" label="Blue" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Cannot be created by mixing other colors. In RGB, these create pure white light when combined.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Secondary Colors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-center gap-2 mb-3">
                      <ColorSwatch color="#FFFF00" label="Yellow" />
                      <ColorSwatch color="#FF00FF" label="Magenta" />
                      <ColorSwatch color="#00FFFF" label="Cyan" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Created by mixing two primary colors. Yellow (R+G), Magenta (R+B), Cyan (G+B).
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Tertiary Colors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-center gap-2 mb-3">
                      <ColorSwatch color="#FF8000" label="Orange" />
                      <ColorSwatch color="#8000FF" label="Violet" />
                      <ColorSwatch color="#00FF80" label="Spring" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Created by mixing primary and secondary colors. Six tertiary colors total.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <div className="w-4 h-4 bg-black rounded"></div>
                      Shades
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-center gap-1 mb-3">
                      <ColorSwatch color="#FF6B6B" label="" />
                      <ColorSwatch color="#E55555" label="" />
                      <ColorSwatch color="#CC4040" label="" />
                      <ColorSwatch color="#B32A2A" label="" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Adding black to a base color creates shades - deeper, richer versions.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <div className="w-4 h-4 bg-white border rounded"></div>
                      Tints
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-center gap-1 mb-3">
                      <ColorSwatch color="#FF6B6B" label="" />
                      <ColorSwatch color="#FF8888" label="" />
                      <ColorSwatch color="#FFA5A5" label="" />
                      <ColorSwatch color="#FFC2C2" label="" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Adding white to a base color creates tints - lighter, softer versions.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <div className="w-4 h-4 bg-gray-500 rounded"></div>
                      Tones
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-center gap-1 mb-3">
                      <ColorSwatch color="#FF6B6B" label="" />
                      <ColorSwatch color="#E06B6B" label="" />
                      <ColorSwatch color="#C26B6B" label="" />
                      <ColorSwatch color="#A36B6B" label="" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Adding gray to a base color creates tones - muted, sophisticated versions.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="combinations" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                <h3 className="text-lg font-semibold">Color Harmonies</h3>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Complementary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="flex gap-2">
                        <ColorSwatch color="#FF6B6B" label="Red" />
                        <ColorSwatch color="#6BFFFF" label="Cyan" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">
                          Colors opposite on the wheel. High contrast, vibrant, attention-grabbing. 
                          Use sparingly for maximum impact.
                        </p>
                        <Badge className="mt-2" variant="secondary">High Impact</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Analogous</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="flex gap-2">
                        <ColorSwatch color="#FF6B6B" label="Red" />
                        <ColorSwatch color="#FF6BFF" label="Magenta" />
                        <ColorSwatch color="#FF8C6B" label="Orange" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">
                          Colors next to each other. Harmonious, pleasing, natural. 
                          Great for creating serene, comfortable designs.
                        </p>
                        <Badge className="mt-2" variant="secondary">Harmonious</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Triadic</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="flex gap-2">
                        <ColorSwatch color="#FF6B6B" label="Red" />
                        <ColorSwatch color="#6BFF6B" label="Green" />
                        <ColorSwatch color="#6B6BFF" label="Blue" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">
                          Three evenly spaced colors. Vibrant yet balanced. 
                          Use one as dominant, others as accents.
                        </p>
                        <Badge className="mt-2" variant="secondary">Balanced</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Monochromatic</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="flex gap-2">
                        <ColorSwatch color="#FF2222" label="Dark" />
                        <ColorSwatch color="#FF6B6B" label="Base" />
                        <ColorSwatch color="#FFB3B3" label="Light" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">
                          Different shades, tints, and tones of one color. 
                          Elegant, cohesive, easy to work with.
                        </p>
                        <Badge className="mt-2" variant="secondary">Elegant</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="psychology" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                <h3 className="text-lg font-semibold">Color Psychology</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Thermometer className="w-4 h-4 text-orange-500" />
                      Warm Colors
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <ColorSwatch color="#FF4444" label="Red" />
                        <ColorSwatch color="#FF8844" label="Orange" />
                        <ColorSwatch color="#FFDD44" label="Yellow" />
                      </div>
                      <div className="space-y-2 text-sm">
                        <p><strong>Red:</strong> Energy, passion, urgency, power</p>
                        <p><strong>Orange:</strong> Enthusiasm, creativity, warmth</p>
                        <p><strong>Yellow:</strong> Happiness, optimism, attention</p>
                      </div>
                      <Badge variant="outline">Energizing • Advancing • Stimulating</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Thermometer className="w-4 h-4 text-blue-500" />
                      Cool Colors
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <ColorSwatch color="#4444FF" label="Blue" />
                        <ColorSwatch color="#44FF44" label="Green" />
                        <ColorSwatch color="#8844FF" label="Purple" />
                      </div>
                      <div className="space-y-2 text-sm">
                        <p><strong>Blue:</strong> Trust, calm, professionalism</p>
                        <p><strong>Green:</strong> Nature, growth, harmony</p>
                        <p><strong>Purple:</strong> Luxury, creativity, mystery</p>
                      </div>
                      <Badge variant="outline">Calming • Receding • Soothing</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Brand Applications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <h4 className="font-medium mb-2">Technology</h4>
                      <p className="text-muted-foreground">Blue for trust, white for simplicity, gray for sophistication</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Food & Dining</h4>
                      <p className="text-muted-foreground">Red/orange for appetite, green for health, warm tones for comfort</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Finance</h4>
                      <p className="text-muted-foreground">Blue for trust, green for growth, conservative palettes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="accessibility" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                <h3 className="text-lg font-semibold">Accessibility Guidelines</h3>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">WCAG Contrast Standards</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-medium">Normal Text (14px+)</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>AA Standard:</span>
                            <Badge>4.5:1</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>AAA Enhanced:</span>
                            <Badge>7:1</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium">Large Text (18px+)</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>AA Standard:</span>
                            <Badge>3:1</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>AAA Enhanced:</span>
                            <Badge>4.5:1</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Color Blindness Considerations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <h4 className="font-medium mb-2">Protanopia (Red-blind)</h4>
                        <p className="text-muted-foreground">~1% of men. Difficulty distinguishing red from green.</p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Deuteranopia (Green-blind)</h4>
                        <p className="text-muted-foreground">~1% of men. Most common form of color blindness.</p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Tritanopia (Blue-blind)</h4>
                        <p className="text-muted-foreground">Very rare. Difficulty with blue-yellow spectrum.</p>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2">Best Practices</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Don't rely on color alone to convey information</li>
                        <li>• Use patterns, shapes, or text labels as alternatives</li>
                        <li>• Test with color blindness simulators</li>
                        <li>• Ensure sufficient contrast ratios</li>
                        <li>• Use tools like our contrast checker</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
