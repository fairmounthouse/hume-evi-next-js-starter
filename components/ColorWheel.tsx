"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { hslToHex, hexToHsl, rgbToHsl, hslToRgb } from '@/utils/color-utils';

interface ColorWheelProps {
  size?: number;
  selectedColor: string;
  onColorChange: (color: string) => void;
  className?: string;
}

export function ColorWheel({ 
  size = 300, 
  selectedColor, 
  onColorChange,
  className = ""
}: ColorWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedHsl, setSelectedHsl] = useState(() => hexToHsl(selectedColor));

  // Draw the color wheel
  const drawColorWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 10;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Draw color wheel
    for (let angle = 0; angle < 360; angle += 1) {
      const startAngle = (angle - 1) * Math.PI / 180;
      const endAngle = angle * Math.PI / 180;

      for (let r = 0; r < radius; r += 1) {
        const saturation = r / radius * 100;
        const lightness = 50;
        const color = hslToHex(angle, saturation, lightness);

        ctx.beginPath();
        ctx.arc(centerX, centerY, r, startAngle, endAngle);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // Draw lightness gradient in center
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 0.3);
    gradient.addColorStop(0, 'white');
    gradient.addColorStop(1, 'transparent');
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.3, 0, 2 * Math.PI);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw black gradient for darkness
    const darkGradient = ctx.createRadialGradient(centerX, centerY, radius * 0.7, centerX, centerY, radius);
    darkGradient.addColorStop(0, 'transparent');
    darkGradient.addColorStop(1, 'black');
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = darkGradient;
    ctx.fill();

  }, [size]);

  // Draw selection indicator
  const drawSelector = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 10;

    // Calculate position based on HSL values
    const angle = selectedHsl.h * Math.PI / 180;
    const distance = (selectedHsl.s / 100) * radius;
    
    const x = centerX + Math.cos(angle) * distance;
    const y = centerY + Math.sin(angle) * distance;

    // Draw selector circle
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, 2 * Math.PI);
    ctx.strokeStyle = selectedHsl.l > 50 ? '#000' : '#fff';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y, 6, 0, 2 * Math.PI);
    ctx.strokeStyle = selectedHsl.l > 50 ? '#fff' : '#000';
    ctx.lineWidth = 1;
    ctx.stroke();
  }, [selectedHsl, size]);

  // Handle mouse events
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    setIsDragging(true);
    handleMouseMove(event);
  }, []);

  const handleMouseMove = useCallback((event: React.MouseEvent | MouseEvent) => {
    if (!isDragging && event.type !== 'mousedown') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 10;

    const x = event.clientX - rect.left - centerX;
    const y = event.clientY - rect.top - centerY;

    const distance = Math.sqrt(x * x + y * y);
    if (distance > radius) return;

    const angle = Math.atan2(y, x) * 180 / Math.PI;
    const hue = angle < 0 ? angle + 360 : angle;
    const saturation = Math.min(100, (distance / radius) * 100);

    const newHsl = { h: hue, s: saturation, l: selectedHsl.l };
    setSelectedHsl(newHsl);
    onColorChange(hslToHex(newHsl.h, newHsl.s, newHsl.l));
  }, [isDragging, selectedHsl.l, size, onColorChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Update HSL when selectedColor prop changes
  useEffect(() => {
    const newHsl = hexToHsl(selectedColor);
    setSelectedHsl(newHsl);
  }, [selectedColor]);

  // Redraw when component mounts or dependencies change
  useEffect(() => {
    drawColorWheel();
    drawSelector();
  }, [drawColorWheel, drawSelector]);

  // Add global mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        onMouseDown={handleMouseDown}
        className="cursor-crosshair rounded-full"
        style={{ width: size, height: size }}
      />
    </div>
  );
}
