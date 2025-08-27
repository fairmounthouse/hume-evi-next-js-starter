/**
 * Comprehensive color utilities for color wheel functionality
 */

export interface HSL {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

export interface RGB {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

export interface ColorInfo {
  hex: string;
  rgb: RGB;
  hsl: HSL;
  name?: string;
}

/**
 * Convert HSL to RGB
 */
export function hslToRgb(h: number, s: number, l: number): RGB {
  h = h / 360;
  s = s / 100;
  l = l / 100;

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

/**
 * Convert RGB to HSL
 */
export function rgbToHsl(r: number, g: number, b: number): HSL {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
      default: h = 0;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

/**
 * Convert hex to RGB
 */
export function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

/**
 * Convert RGB to hex
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * Convert hex to HSL
 */
export function hexToHsl(hex: string): HSL {
  const rgb = hexToRgb(hex);
  return rgbToHsl(rgb.r, rgb.g, rgb.b);
}

/**
 * Convert HSL to hex
 */
export function hslToHex(h: number, s: number, l: number): string {
  const rgb = hslToRgb(h, s, l);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

/**
 * Get complementary color (180 degrees opposite)
 */
export function getComplementary(hex: string): string {
  const hsl = hexToHsl(hex);
  const complementaryHue = (hsl.h + 180) % 360;
  return hslToHex(complementaryHue, hsl.s, hsl.l);
}

/**
 * Get analogous colors (30 degrees on each side)
 */
export function getAnalogous(hex: string): string[] {
  const hsl = hexToHsl(hex);
  return [
    hslToHex((hsl.h - 30 + 360) % 360, hsl.s, hsl.l),
    hex,
    hslToHex((hsl.h + 30) % 360, hsl.s, hsl.l)
  ];
}

/**
 * Get triadic colors (120 degrees apart)
 */
export function getTriadic(hex: string): string[] {
  const hsl = hexToHsl(hex);
  return [
    hex,
    hslToHex((hsl.h + 120) % 360, hsl.s, hsl.l),
    hslToHex((hsl.h + 240) % 360, hsl.s, hsl.l)
  ];
}

/**
 * Get tetradic colors (90 degrees apart)
 */
export function getTetradic(hex: string): string[] {
  const hsl = hexToHsl(hex);
  return [
    hex,
    hslToHex((hsl.h + 90) % 360, hsl.s, hsl.l),
    hslToHex((hsl.h + 180) % 360, hsl.s, hsl.l),
    hslToHex((hsl.h + 270) % 360, hsl.s, hsl.l)
  ];
}

/**
 * Get monochromatic colors (same hue, different lightness)
 */
export function getMonochromatic(hex: string): string[] {
  const hsl = hexToHsl(hex);
  return [
    hslToHex(hsl.h, hsl.s, Math.max(20, hsl.l - 30)),
    hslToHex(hsl.h, hsl.s, Math.max(10, hsl.l - 15)),
    hex,
    hslToHex(hsl.h, hsl.s, Math.min(90, hsl.l + 15)),
    hslToHex(hsl.h, hsl.s, Math.min(95, hsl.l + 30))
  ];
}

/**
 * Get shades (add black)
 */
export function getShades(hex: string, count: number = 5): string[] {
  const hsl = hexToHsl(hex);
  const shades = [];
  for (let i = 0; i < count; i++) {
    const lightness = hsl.l * (1 - (i / (count - 1)) * 0.8);
    shades.push(hslToHex(hsl.h, hsl.s, Math.max(0, lightness)));
  }
  return shades;
}

/**
 * Get tints (add white)
 */
export function getTints(hex: string, count: number = 5): string[] {
  const hsl = hexToHsl(hex);
  const tints = [];
  for (let i = 0; i < count; i++) {
    const lightness = hsl.l + (100 - hsl.l) * (i / (count - 1));
    tints.push(hslToHex(hsl.h, hsl.s, Math.min(100, lightness)));
  }
  return tints;
}

/**
 * Get tones (add gray)
 */
export function getTones(hex: string, count: number = 5): string[] {
  const hsl = hexToHsl(hex);
  const tones = [];
  for (let i = 0; i < count; i++) {
    const saturation = hsl.s * (1 - (i / (count - 1)) * 0.8);
    tones.push(hslToHex(hsl.h, Math.max(0, saturation), hsl.l));
  }
  return tones;
}

/**
 * Calculate relative luminance for contrast calculations
 */
export function getRelativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  
  const sRGB = [rgb.r, rgb.g, rgb.b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getRelativeLuminance(color1);
  const lum2 = getRelativeLuminance(color2);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Get WCAG compliance level
 */
export function getWCAGLevel(contrastRatio: number, isLargeText: boolean = false): {
  level: 'AAA' | 'AA' | 'A' | 'Fail';
  description: string;
} {
  const threshold = isLargeText ? 3 : 4.5;
  const aaaThreshold = isLargeText ? 4.5 : 7;
  
  if (contrastRatio >= aaaThreshold) {
    return { level: 'AAA', description: 'Enhanced contrast (AAA)' };
  } else if (contrastRatio >= threshold) {
    return { level: 'AA', description: 'Standard contrast (AA)' };
  } else if (contrastRatio >= 3) {
    return { level: 'A', description: 'Minimum contrast (A)' };
  } else {
    return { level: 'Fail', description: 'Insufficient contrast' };
  }
}

/**
 * Check if a color is warm or cool
 */
export function getColorTemperature(hex: string): 'warm' | 'cool' | 'neutral' {
  const hsl = hexToHsl(hex);
  
  if (hsl.s < 10) return 'neutral'; // Low saturation colors are neutral
  
  // Warm colors: red through yellow (0-60, 300-360)
  if ((hsl.h >= 0 && hsl.h <= 60) || (hsl.h >= 300 && hsl.h <= 360)) {
    return 'warm';
  }
  
  // Cool colors: cyan through violet (180-300)
  if (hsl.h >= 180 && hsl.h <= 300) {
    return 'cool';
  }
  
  // Green and yellow-green can be either, depends on exact hue
  if (hsl.h > 60 && hsl.h < 180) {
    return hsl.h < 120 ? 'warm' : 'cool';
  }
  
  return 'neutral';
}

/**
 * Generate a random color
 */
export function generateRandomColor(): string {
  const hue = Math.floor(Math.random() * 360);
  const saturation = Math.floor(Math.random() * 70) + 30; // 30-100%
  const lightness = Math.floor(Math.random() * 60) + 20; // 20-80%
  return hslToHex(hue, saturation, lightness);
}

/**
 * Color combination types
 */
export type ColorCombinationType = 
  | 'complementary'
  | 'analogous'
  | 'triadic'
  | 'tetradic'
  | 'monochromatic';

/**
 * Get color combination based on type
 */
export function getColorCombination(hex: string, type: ColorCombinationType): string[] {
  switch (type) {
    case 'complementary':
      return [hex, getComplementary(hex)];
    case 'analogous':
      return getAnalogous(hex);
    case 'triadic':
      return getTriadic(hex);
    case 'tetradic':
      return getTetradic(hex);
    case 'monochromatic':
      return getMonochromatic(hex);
    default:
      return [hex];
  }
}
