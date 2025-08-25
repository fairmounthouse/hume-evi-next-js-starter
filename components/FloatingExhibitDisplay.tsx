"use client";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { useState } from "react";
import { cn } from "@/utils";

interface Exhibit {
  id: string;
  exhibit_name: string;
  display_name: string;
  description?: string;
  image_url: string;
  file_type: string;
  metadata?: any;
}

interface FloatingExhibitDisplayProps {
  visibleExhibits: Exhibit[];
  onHideExhibit: (exhibitId: string) => void;
  onExpandExhibit: (exhibitId: string) => void;
  className?: string;
}

export default function FloatingExhibitDisplay({ 
  visibleExhibits, 
  onHideExhibit,
  onExpandExhibit,
  className = "" 
}: FloatingExhibitDisplayProps) {
  const [minimizedExhibits, setMinimizedExhibits] = useState<Set<string>>(new Set());

  if (visibleExhibits.length === 0) return null;

  const handleDownload = async (exhibit: Exhibit) => {
    try {
      const response = await fetch(exhibit.image_url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${exhibit.exhibit_name}.${exhibit.file_type.split('/')[1]}`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading exhibit:", error);
    }
  };

  const toggleMinimize = (exhibitId: string) => {
    setMinimizedExhibits(prev => {
      const newSet = new Set(prev);
      if (newSet.has(exhibitId)) {
        newSet.delete(exhibitId);
      } else {
        newSet.add(exhibitId);
      }
      return newSet;
    });
  };

  return (
    <div className={cn(
      "fixed bottom-20 left-4 z-40 space-y-3 max-w-sm",
      className
    )}>
      <AnimatePresence mode="popLayout">
        {visibleExhibits.map((exhibit, index) => {
          const isMinimized = minimizedExhibits.has(exhibit.id);
          
          return (
            <motion.div
              key={exhibit.id}
              initial={{ opacity: 0, y: 50, scale: 0.8 }}
              animate={{ 
                opacity: 1, 
                y: 0, 
                scale: 1,
                transition: { delay: index * 0.1 }
              }}
              exit={{ opacity: 0, y: 50, scale: 0.8 }}
              layout
              transition={{ type: "spring", damping: 20, stiffness: 200 }}
            >
              <Card className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
                {/* Header - Always Visible */}
                <div className="p-3 bg-blue-50/50 dark:bg-blue-950/30 border-b flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold truncate">
                        {exhibit.display_name}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Case Exhibit
                      </p>
                    </div>
                  </div>
                  
                  {/* Header Actions */}
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleMinimize(exhibit.id)}
                      className="h-6 w-6 p-0"
                    >
                      {isMinimized ? (
                        <Maximize2 className="w-3 h-3" />
                      ) : (
                        <Minimize2 className="w-3 h-3" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onHideExhibit(exhibit.id)}
                      className="h-6 w-6 p-0 text-gray-500 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Collapsible Content */}
                <AnimatePresence>
                  {!isMinimized && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="p-3">
                        {/* Image */}
                        <div className="mb-3 relative group">
                          <img
                            src={exhibit.image_url}
                            alt={exhibit.description || exhibit.display_name}
                            className="w-full h-32 object-cover rounded cursor-pointer transition-transform group-hover:scale-105"
                            loading="lazy"
                            onClick={() => onExpandExhibit(exhibit.id)}
                          />
                          
                          {/* Overlay Actions */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <div className="flex gap-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onExpandExhibit(exhibit.id);
                                }}
                                className="h-8 w-8 p-0"
                              >
                                <Maximize2 className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownload(exhibit);
                                }}
                                className="h-8 w-8 p-0"
                              >
                                <Download className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Description */}
                        {exhibit.description && (
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-3">
                            {exhibit.description}
                          </p>
                        )}
                        
                        {/* Actions */}
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onExpandExhibit(exhibit.id)}
                            className="flex-1 h-7 text-xs"
                          >
                            <Maximize2 className="w-3 h-3 mr-1" />
                            Expand
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(exhibit)}
                            className="h-7 w-7 p-0"
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
