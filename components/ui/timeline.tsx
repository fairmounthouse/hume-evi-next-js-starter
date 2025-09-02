"use client";

import { cn } from "@/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";

interface TimelineEvent {
  timestamp: string;
  title: string;
  description: string;
  type?: 'critical' | 'warning' | 'positive';
}

interface TimelineProps {
  events: TimelineEvent[];
  className?: string;
  onSeekVideo?: (timestamp: number) => void;
  transcript?: any[]; // For determining speaker-based buffer
}

export function Timeline({ events, className, onSeekVideo, transcript }: TimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, scrollLeft: 0 });

  const getEventTypeColors = (type: 'critical' | 'warning' | 'positive' = 'critical') => {
    switch (type) {
      case 'critical':
        return {
          node: 'bg-[#dc2626] border-[#dc2626] shadow-lg shadow-red-200',
          pulse: 'animate-pulse',
          glow: 'ring-2 ring-red-200'
        };
      case 'warning':
        return {
          node: 'bg-[#f59e0b] border-[#f59e0b] shadow-lg shadow-orange-200',
          pulse: '',
          glow: 'ring-2 ring-orange-200'
        };
      case 'positive':
        return {
          node: 'bg-[#22c55e] border-[#22c55e] shadow-lg shadow-green-200',
          pulse: '',
          glow: 'ring-2 ring-green-200'
        };
      default:
        return {
          node: 'bg-[#dc2626] border-[#dc2626] shadow-lg shadow-red-200',
          pulse: 'animate-pulse',
          glow: 'ring-2 ring-red-200'
        };
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    
    const scrollAmount = 300; // Scroll by 300px
    const currentScroll = scrollRef.current.scrollLeft;
    const newScroll = direction === 'left' 
      ? currentScroll - scrollAmount 
      : currentScroll + scrollAmount;
    
    scrollRef.current.scrollTo({
      left: newScroll,
      behavior: 'smooth'
    });
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  // Mouse drag scrolling handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setDragStart({
      x: e.pageX - scrollRef.current.offsetLeft,
      scrollLeft: scrollRef.current.scrollLeft
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - dragStart.x) * 2; // Multiply by 2 for faster scrolling
    scrollRef.current.scrollLeft = dragStart.scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-[#71717a]">
        No timeline events available
      </div>
    );
  }

  // Calculate optimal spacing based on event count - adjusted for expandable cards
  const getNodeSpacing = (eventCount: number) => {
    if (eventCount <= 3) return 'mx-20'; // Extra wide spacing for few events
    if (eventCount <= 6) return 'mx-16'; // Wide spacing
    if (eventCount <= 10) return 'mx-12'; // Medium spacing
    if (eventCount <= 15) return 'mx-10'; // Closer spacing
    return 'mx-8'; // Comfortable spacing even for many events
  };

  const nodeSpacing = getNodeSpacing(events.length);

  return (
    <div className={cn("relative", className)}>
      {/* Timeline Container with Navigation */}
      <div className="bg-white border border-[#e4e4e7] rounded-lg overflow-hidden">
        {/* Navigation Controls */}
        {events.length > 4 && (
          <div className="flex justify-between items-center p-4 border-b border-[#e4e4e7] bg-[#fafafa]">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full border transition-all duration-200",
                canScrollLeft 
                  ? "border-[#0a0a0a] text-[#0a0a0a] hover:bg-[#0a0a0a] hover:text-white cursor-pointer" 
                  : "border-[#e4e4e7] text-[#d4d4d8] cursor-not-allowed"
              )}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="text-sm text-[#71717a] font-medium">
              Timeline: {events.length} events
            </div>
            
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full border transition-all duration-200",
                canScrollRight 
                  ? "border-[#0a0a0a] text-[#0a0a0a] hover:bg-[#0a0a0a] hover:text-white cursor-pointer" 
                  : "border-[#e4e4e7] text-[#d4d4d8] cursor-not-allowed"
              )}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
        
        {/* Timeline Content */}
        <div className="p-8 bg-gradient-to-b from-[#fafafa] to-white">
          <div 
            ref={scrollRef}
            className={cn(
              "overflow-x-auto overflow-y-visible scrollbar-hide select-none",
              isDragging && "cursor-grabbing"
            )}
            style={{ 
              scrollbarWidth: 'none', 
              msOverflowStyle: 'none',
              cursor: isDragging ? 'grabbing' : 'grab'
            }}
            onScroll={handleScroll}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          >
            {/* Timeline Track */}
            <div className="relative flex items-center min-w-fit py-16">
              {/* Main Timeline Line */}
              <div className="absolute top-1/2 left-8 right-8 h-1 bg-gradient-to-r from-[#e4e4e7] via-[#d4d4d8] to-[#e4e4e7] rounded-full transform -translate-y-1/2 z-0" />
              
              {/* Timeline Events */}
              {events.map((event, index) => {
                const colors = getEventTypeColors(event.type);
                const isFirst = index === 0;
                const isLast = index === events.length - 1;
                
                return (
                  <div key={index} className={cn("relative flex flex-col items-center", nodeSpacing, "min-w-[280px]")}>
                    {/* Timestamp - Clickable */}
                    <div 
                      className={cn(
                        "absolute -top-12 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-[#52525b] bg-white px-2 py-1 rounded border border-[#e4e4e7] whitespace-nowrap shadow-sm",
                        onSeekVideo && "cursor-pointer hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600"
                      )}
                      onClick={onSeekVideo ? () => {
                        // Parse timestamp (MM:SS format) to seconds
                        const parts = event.timestamp.split(':').map(Number);
                        const originalTimestamp = parts.length === 2 ? parts[0] * 60 + parts[1] : 0;
                        
                        // Apply speaker-based buffer logic
                        const isFirstMessage = originalTimestamp === 0 || (transcript && transcript.length > 0 && transcript[0]?.timestamp === originalTimestamp);
                        const correspondingEntry = transcript?.find(entry => Math.abs(entry.timestamp - originalTimestamp) < 2);
                        const isUserMessage = correspondingEntry?.speaker === 'user';
                        
                        let bufferedTimestamp;
                        let bufferMessage;
                        
                        if (isFirstMessage) {
                          bufferedTimestamp = originalTimestamp; // No buffer for first message
                          bufferMessage = 'no buffer (first message)';
                        } else if (isUserMessage) {
                          bufferedTimestamp = Math.max(0, originalTimestamp - 1); // Go back 1s for user context
                          bufferMessage = '-1s buffer (user message)';
                        } else {
                          bufferedTimestamp = originalTimestamp + 2; // Go forward 2s for AI messages
                          bufferMessage = '+2s buffer (AI message)';
                        }
                        
                        console.log("🎯 [TIMELINE CLICK] Seeking video:", {originalTimestamp, bufferedTimestamp, bufferMessage, speaker: correspondingEntry?.speaker});
                        
                        // Try multiple seek methods for maximum compatibility
                        onSeekVideo(bufferedTimestamp);
                        
                        // Also store in sessionStorage for video components to pick up
                        sessionStorage.setItem('jumpToTimestamp', bufferedTimestamp.toString());
                        
                        // Try direct iframe manipulation if available
                        const iframe = document.querySelector('iframe[src*="cloudflarestream.com"]') as HTMLIFrameElement;
                        if (iframe && iframe.src.includes('cloudflarestream.com')) {
                          const videoId = iframe.src.match(/cloudflarestream\.com\/([^\/]+)\/iframe/)?.[1];
                          if (videoId) {
                            const seekTime = Math.floor(bufferedTimestamp * 10) / 10;
                            const newSrc = `https://customer-sm0204x4lu04ck3x.cloudflarestream.com/${videoId}/iframe?preload=metadata&controls=true&startTime=${seekTime}&autoplay=true`;
                            iframe.src = newSrc;
                            console.log("🎯 [TIMELINE DIRECT] Updated iframe src for seeking:", seekTime);
                          }
                        }
                      } : undefined}
                      title={onSeekVideo ? "Click to jump to this moment in video" : undefined}
                    >
                      {event.timestamp}
                    </div>
                    
                    {/* Timeline Node - Also Clickable */}
                    <div 
                      className={cn(
                        "relative z-20 group",
                        onSeekVideo && "cursor-pointer"
                      )}
                      onClick={onSeekVideo ? () => {
                        const parts = event.timestamp.split(':').map(Number);
                        const originalTimestamp = parts.length === 2 ? parts[0] * 60 + parts[1] : 0;
                        
                        // Apply same buffer logic as timestamp click
                        const isFirstMessage = originalTimestamp === 0 || (transcript && transcript.length > 0 && transcript[0]?.timestamp === originalTimestamp);
                        const correspondingEntry = transcript?.find(entry => Math.abs(entry.timestamp - originalTimestamp) < 2);
                        const isUserMessage = correspondingEntry?.speaker === 'user';
                        
                        let bufferedTimestamp;
                        if (isFirstMessage) {
                          bufferedTimestamp = originalTimestamp;
                        } else if (isUserMessage) {
                          bufferedTimestamp = Math.max(0, originalTimestamp - 1);
                        } else {
                          bufferedTimestamp = originalTimestamp + 2;
                        }
                        
                        console.log("🎯 [TIMELINE NODE CLICK] Seeking video:", {originalTimestamp, bufferedTimestamp, speaker: correspondingEntry?.speaker});
                        
                        // Try multiple seek methods for maximum compatibility
                        onSeekVideo(bufferedTimestamp);
                        
                        // Also store in sessionStorage for video components to pick up
                        sessionStorage.setItem('jumpToTimestamp', bufferedTimestamp.toString());
                        
                        // Try direct iframe manipulation if available
                        const iframe = document.querySelector('iframe[src*="cloudflarestream.com"]') as HTMLIFrameElement;
                        if (iframe && iframe.src.includes('cloudflarestream.com')) {
                          const videoId = iframe.src.match(/cloudflarestream\.com\/([^\/]+)\/iframe/)?.[1];
                          if (videoId) {
                            const seekTime = Math.floor(bufferedTimestamp * 10) / 10;
                            const newSrc = `https://customer-sm0204x4lu04ck3x.cloudflarestream.com/${videoId}/iframe?preload=metadata&controls=true&startTime=${seekTime}&autoplay=true`;
                            iframe.src = newSrc;
                            console.log("🎯 [TIMELINE NODE DIRECT] Updated iframe src for seeking:", seekTime);
                          }
                        }
                      } : undefined}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded-full border-3 transition-all duration-300 group-hover:scale-125",
                        colors.node,
                        colors.glow,
                        event.type === 'critical' && colors.pulse
                      )}>
                        {/* Inner dot for extra visual emphasis */}
                        <div className="w-full h-full rounded-full bg-white/30" />
                      </div>
                      
                      {/* Node emphasis for first and last */}
                      {(isFirst || isLast) && (
                        <div className="absolute inset-0 w-5 h-5 rounded-full border-2 border-white animate-ping opacity-30" />
                      )}
                    </div>
                    
                    {/* Connector to Card */}
                    <div className="w-px h-8 bg-gradient-to-b from-[#d4d4d8] to-transparent z-10" />
                    
                    {/* Event Card - Expandable & Clickable */}
                    <div 
                      className={cn(
                        "bg-white border border-[#e4e4e7] rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 min-w-[280px] max-w-[400px] group-hover:border-[#d4d4d8]",
                        onSeekVideo && "cursor-pointer hover:border-blue-300"
                      )}
                      onClick={onSeekVideo ? () => {
                        const parts = event.timestamp.split(':').map(Number);
                        const originalTimestamp = parts.length === 2 ? parts[0] * 60 + parts[1] : 0;
                        
                        // Apply speaker-based buffer logic
                        const isFirstMessage = originalTimestamp === 0 || (transcript && transcript.length > 0 && transcript[0]?.timestamp === originalTimestamp);
                        const correspondingEntry = transcript?.find(entry => Math.abs(entry.timestamp - originalTimestamp) < 2);
                        const isUserMessage = correspondingEntry?.speaker === 'user';
                        
                        let bufferedTimestamp;
                        if (isFirstMessage) {
                          bufferedTimestamp = originalTimestamp;
                        } else if (isUserMessage) {
                          bufferedTimestamp = Math.max(0, originalTimestamp - 1);
                        } else {
                          bufferedTimestamp = originalTimestamp + 2;
                        }
                        
                        console.log("🎯 [TIMELINE CARD CLICK] Seeking video:", {originalTimestamp, bufferedTimestamp, speaker: correspondingEntry?.speaker});
                        
                        // Try multiple seek methods for maximum compatibility
                        onSeekVideo(bufferedTimestamp);
                        
                        // Also store in sessionStorage for video components to pick up
                        sessionStorage.setItem('jumpToTimestamp', bufferedTimestamp.toString());
                        
                        // Try direct iframe manipulation if available
                        const iframe = document.querySelector('iframe[src*="cloudflarestream.com"]') as HTMLIFrameElement;
                        if (iframe && iframe.src.includes('cloudflarestream.com')) {
                          const videoId = iframe.src.match(/cloudflarestream\.com\/([^\/]+)\/iframe/)?.[1];
                          if (videoId) {
                            const seekTime = Math.floor(bufferedTimestamp * 10) / 10;
                            const newSrc = `https://customer-sm0204x4lu04ck3x.cloudflarestream.com/${videoId}/iframe?preload=metadata&controls=true&startTime=${seekTime}&autoplay=true`;
                            iframe.src = newSrc;
                            console.log("🎯 [TIMELINE CARD DIRECT] Updated iframe src for seeking:", seekTime);
                          }
                        }
                      } : undefined}
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full flex-shrink-0 mt-1.5",
                          event.type === 'critical' ? 'bg-[#dc2626]' :
                          event.type === 'warning' ? 'bg-[#f59e0b]' :
                          'bg-[#22c55e]'
                        )} />
                        <h4 className="text-sm font-semibold text-[#0a0a0a] leading-tight">
                          {event.title}
                        </h4>
                      </div>
                      <p className="text-xs text-[#71717a] leading-relaxed">
                        {event.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Timeline Legend */}
          <div className="flex justify-center items-center gap-6 mt-6 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#dc2626]" />
              <span className="text-[#71717a]">Critical Issues</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#f59e0b]" />
              <span className="text-[#71717a]">Warnings</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#22c55e]" />
              <span className="text-[#71717a]">Positive Moments</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Custom scrollbar styles */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}

interface VerticalTimelineProps {
  events: TimelineEvent[];
  className?: string;
  onSeekVideo?: (timestamp: number) => void;
  transcript?: any[]; // For determining speaker-based buffer
}

export function VerticalTimeline({ events, className, onSeekVideo, transcript }: VerticalTimelineProps) {
  const getEventTypeColor = (type: 'critical' | 'warning' | 'positive' = 'critical') => {
    switch (type) {
      case 'critical':
        return 'border-[#dc2626] bg-[#dc2626]';
      case 'warning':
        return 'border-[#f59e0b] bg-[#f59e0b]';
      case 'positive':
        return 'border-[#22c55e] bg-[#22c55e]';
      default:
        return 'border-[#dc2626] bg-[#dc2626]';
    }
  };

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-[#71717a]">
        No timeline events available
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <div className="space-y-6">
        {events.map((event, index) => (
          <div key={index} className="flex items-start gap-4">
            {/* Timeline Node - Clickable */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div 
                className={cn(
                  "text-xs font-medium text-[#71717a] mb-2 whitespace-nowrap",
                  onSeekVideo && "cursor-pointer hover:text-blue-600 hover:underline"
                )}
                onClick={onSeekVideo ? () => {
                  const parts = event.timestamp.split(':').map(Number);
                  const originalTimestamp = parts.length === 2 ? parts[0] * 60 + parts[1] : 0;
                  
                  // Apply speaker-based buffer logic
                  const isFirstMessage = originalTimestamp === 0 || (transcript && transcript.length > 0 && transcript[0]?.timestamp === originalTimestamp);
                  const correspondingEntry = transcript?.find(entry => Math.abs(entry.timestamp - originalTimestamp) < 2);
                  const isUserMessage = correspondingEntry?.speaker === 'user';
                  
                  let bufferedTimestamp;
                  if (isFirstMessage) {
                    bufferedTimestamp = originalTimestamp;
                  } else if (isUserMessage) {
                    bufferedTimestamp = Math.max(0, originalTimestamp - 1);
                  } else {
                    bufferedTimestamp = originalTimestamp + 2;
                  }
                  
                  console.log("🎯 [VERTICAL TIMELINE CLICK] Seeking video:", {originalTimestamp, bufferedTimestamp, speaker: correspondingEntry?.speaker});
                  
                  // Try multiple seek methods for maximum compatibility
                  onSeekVideo(bufferedTimestamp);
                  
                  // Also store in sessionStorage for video components to pick up
                  sessionStorage.setItem('jumpToTimestamp', bufferedTimestamp.toString());
                  
                  // Try direct iframe manipulation if available
                  const iframe = document.querySelector('iframe[src*="cloudflarestream.com"]') as HTMLIFrameElement;
                  if (iframe && iframe.src.includes('cloudflarestream.com')) {
                    const videoId = iframe.src.match(/cloudflarestream\.com\/([^\/]+)\/iframe/)?.[1];
                    if (videoId) {
                      const seekTime = Math.floor(bufferedTimestamp * 10) / 10;
                      const newSrc = `https://customer-sm0204x4lu04ck3x.cloudflarestream.com/${videoId}/iframe?preload=metadata&controls=true&startTime=${seekTime}&autoplay=true`;
                      iframe.src = newSrc;
                      console.log("🎯 [VERTICAL TIMELINE DIRECT] Updated iframe src for seeking:", seekTime);
                    }
                  }
                } : undefined}
                title={onSeekVideo ? "Click to jump to this moment in video" : undefined}
              >
                {event.timestamp}
              </div>
              <div 
                className={cn(
                  "w-3 h-3 rounded-full border-2",
                  getEventTypeColor(event.type),
                  onSeekVideo && "cursor-pointer hover:scale-125 transition-transform"
                )}
                onClick={onSeekVideo ? () => {
                  const parts = event.timestamp.split(':').map(Number);
                  const originalTimestamp = parts.length === 2 ? parts[0] * 60 + parts[1] : 0;
                  
                  // Apply same buffer logic
                  const isFirstMessage = originalTimestamp === 0 || (transcript && transcript.length > 0 && transcript[0]?.timestamp === originalTimestamp);
                  const correspondingEntry = transcript?.find(entry => Math.abs(entry.timestamp - originalTimestamp) < 2);
                  const isUserMessage = correspondingEntry?.speaker === 'user';
                  
                  let bufferedTimestamp;
                  if (isFirstMessage) {
                    bufferedTimestamp = originalTimestamp;
                  } else if (isUserMessage) {
                    bufferedTimestamp = Math.max(0, originalTimestamp - 1);
                  } else {
                    bufferedTimestamp = originalTimestamp + 2;
                  }
                  
                  console.log("🎯 [VERTICAL TIMELINE NODE CLICK] Seeking video:", {originalTimestamp, bufferedTimestamp, speaker: correspondingEntry?.speaker});
                  
                  // Try multiple seek methods for maximum compatibility
                  onSeekVideo(bufferedTimestamp);
                  
                  // Also store in sessionStorage for video components to pick up
                  sessionStorage.setItem('jumpToTimestamp', bufferedTimestamp.toString());
                  
                  // Try direct iframe manipulation if available
                  const iframe = document.querySelector('iframe[src*="cloudflarestream.com"]') as HTMLIFrameElement;
                  if (iframe && iframe.src.includes('cloudflarestream.com')) {
                    const videoId = iframe.src.match(/cloudflarestream\.com\/([^\/]+)\/iframe/)?.[1];
                    if (videoId) {
                      const seekTime = Math.floor(bufferedTimestamp * 10) / 10;
                      const newSrc = `https://customer-sm0204x4lu04ck3x.cloudflarestream.com/${videoId}/iframe?preload=metadata&controls=true&startTime=${seekTime}&autoplay=true`;
                      iframe.src = newSrc;
                      console.log("🎯 [VERTICAL TIMELINE NODE DIRECT] Updated iframe src for seeking:", seekTime);
                    }
                  }
                } : undefined}
              />
              {index < events.length - 1 && (
                <div className="w-px h-12 bg-[#e4e4e7] mt-2" />
              )}
            </div>
            
            {/* Event Content - Clickable */}
            <div 
              className={cn(
                "flex-1 bg-white border border-[#e4e4e7] rounded-md p-4",
                onSeekVideo && "cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all"
              )}
              onClick={onSeekVideo ? () => {
                const parts = event.timestamp.split(':').map(Number);
                const originalTimestamp = parts.length === 2 ? parts[0] * 60 + parts[1] : 0;
                
                // Apply speaker-based buffer logic
                const isFirstMessage = originalTimestamp === 0 || (transcript && transcript.length > 0 && transcript[0]?.timestamp === originalTimestamp);
                const correspondingEntry = transcript?.find(entry => Math.abs(entry.timestamp - originalTimestamp) < 2);
                const isUserMessage = correspondingEntry?.speaker === 'user';
                
                let bufferedTimestamp;
                if (isFirstMessage) {
                  bufferedTimestamp = originalTimestamp;
                } else if (isUserMessage) {
                  bufferedTimestamp = Math.max(0, originalTimestamp - 1);
                } else {
                  bufferedTimestamp = originalTimestamp + 2;
                }
                
                console.log("🎯 [VERTICAL TIMELINE CARD CLICK] Seeking video:", {originalTimestamp, bufferedTimestamp, speaker: correspondingEntry?.speaker});
                
                // Try multiple seek methods for maximum compatibility
                onSeekVideo(bufferedTimestamp);
                
                // Also store in sessionStorage for video components to pick up
                sessionStorage.setItem('jumpToTimestamp', bufferedTimestamp.toString());
                
                // Try direct iframe manipulation if available
                const iframe = document.querySelector('iframe[src*="cloudflarestream.com"]') as HTMLIFrameElement;
                if (iframe && iframe.src.includes('cloudflarestream.com')) {
                  const videoId = iframe.src.match(/cloudflarestream\.com\/([^\/]+)\/iframe/)?.[1];
                  if (videoId) {
                    const seekTime = Math.floor(bufferedTimestamp * 10) / 10;
                    const newSrc = `https://customer-sm0204x4lu04ck3x.cloudflarestream.com/${videoId}/iframe?preload=metadata&controls=true&startTime=${seekTime}&autoplay=true`;
                    iframe.src = newSrc;
                    console.log("🎯 [VERTICAL TIMELINE CARD DIRECT] Updated iframe src for seeking:", seekTime);
                  }
                }
              } : undefined}
            >
              <h4 className="text-sm font-semibold text-[#0a0a0a] mb-2">
                {event.title}
              </h4>
              <p className="text-sm text-[#52525b] leading-relaxed">
                {event.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
