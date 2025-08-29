"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/utils';

interface ScrollFadeIndicatorProps {
  children: React.ReactNode;
  className?: string;
  fadeHeight?: number;
  fadeColor?: string;
  threshold?: number;
  topOffset?: number; // For fixed headers
}

/**
 * Smart scroll fade indicator that only shows when content is scrollable
 * and hides at scroll boundaries. Perfect for setup pages with dynamic content.
 */
export default function ScrollFadeIndicator({ 
  children, 
  className = "",
  fadeHeight = 60,
  fadeColor = "white",
  threshold = 5,
  topOffset = 0
}: ScrollFadeIndicatorProps) {
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const checkScrollIndicators = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const { scrollTop, scrollHeight, clientHeight } = container;
    const hasScrollableContent = scrollHeight > clientHeight;
    
    if (!hasScrollableContent) {
      // No scroll needed - hide all indicators
      setShowTopFade(false);
      setShowBottomFade(false);
      return;
    }
    
    // Check if we're at the top (with threshold for float precision)
    const isAtTop = scrollTop < threshold;
    setShowTopFade(!isAtTop);
    
    // Check if we're at the bottom (with threshold)
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - threshold;
    setShowBottomFade(!isAtBottom);
  }, [threshold]);
  
  // Check on mount and when content changes
  useEffect(() => {
    checkScrollIndicators();
    
    // Also check when window resizes
    window.addEventListener('resize', checkScrollIndicators);
    return () => window.removeEventListener('resize', checkScrollIndicators);
  }, [checkScrollIndicators, children]);
  
  // Check on scroll
  const handleScroll = useCallback(() => {
    checkScrollIndicators();
  }, [checkScrollIndicators]);
  
  // Observe content size changes with ResizeObserver
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const resizeObserver = new ResizeObserver(checkScrollIndicators);
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [checkScrollIndicators]);
  
  return (
    <div className={cn("relative", className)}>
      {/* Scrollable Content */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className={cn("h-full overflow-y-auto")}
      >
        {children}
      </div>
      
      {/* Top Fade Indicator */}
      <div
        className={cn(
          "absolute left-0 right-0 pointer-events-none transition-opacity duration-300 z-10",
          showTopFade ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          top: `${topOffset}px`,
          height: `${fadeHeight}px`,
          background: `linear-gradient(to bottom, ${fadeColor} 0%, ${fadeColor} 20%, transparent 100%)`
        }}
      />
      
      {/* Bottom Fade Indicator */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 pointer-events-none transition-opacity duration-300 z-10",
          showBottomFade ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          height: `${fadeHeight}px`,
          background: `linear-gradient(to top, ${fadeColor} 0%, ${fadeColor} 20%, transparent 100%)`
        }}
      />
    </div>
  );
}

/**
 * Custom hook version for more control over the fade logic
 */
export function useScrollFade(ref: React.RefObject<HTMLElement>, threshold: number = 10) {
  const [showTop, setShowTop] = useState(false);
  const [showBottom, setShowBottom] = useState(false);
  
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    const checkScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = element;
      const canScroll = scrollHeight > clientHeight;
      
      if (!canScroll) {
        setShowTop(false);
        setShowBottom(false);
        return;
      }
      
      setShowTop(scrollTop > threshold);
      setShowBottom(scrollTop + clientHeight < scrollHeight - threshold);
    };
    
    checkScroll();
    element.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);
    
    // Observe content changes
    const resizeObserver = new ResizeObserver(checkScroll);
    resizeObserver.observe(element);
    
    return () => {
      element.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
      resizeObserver.disconnect();
    };
  }, [ref, threshold]);
  
  return { showTop, showBottom };
}

/**
 * Specialized version for grid layouts (like in InterviewSetup)
 */
export function ScrollFadeGrid({ 
  children, 
  className = "",
  gridClassName = "",
  fadeHeight = 40,
  fadeColor = "rgb(249 250 251)"
}: {
  children: React.ReactNode;
  className?: string;
  gridClassName?: string;
  fadeHeight?: number;
  fadeColor?: string;
}) {
  return (
    <ScrollFadeIndicator 
      className={cn("pr-4 pt-2 pb-1 px-1", className)}
      fadeHeight={fadeHeight}
      fadeColor={fadeColor}
      threshold={5}
    >
      <div className={gridClassName}>{children}</div>
    </ScrollFadeIndicator>
  );
}
