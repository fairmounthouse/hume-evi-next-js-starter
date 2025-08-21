"use client";
import { motion, AnimatePresence } from "motion/react";
import { X, Image as ImageIcon, Download, Maximize2 } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
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
  timestamp: Date;
}

interface ExhibitDisplayProps {
  exhibits: Exhibit[];
  onRemoveExhibit: (id: string) => void;
  className?: string;
}

export default function ExhibitDisplay({ 
  exhibits, 
  onRemoveExhibit, 
  className = "" 
}: ExhibitDisplayProps) {
  const [expandedExhibit, setExpandedExhibit] = useState<string | null>(null);

  if (exhibits.length === 0) return null;

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

  return (
    <>
      {/* Main Exhibit Cards */}
      <div className={cn(
        "fixed top-20 right-4 z-50 max-w-sm space-y-2",
        className
      )}>
        <AnimatePresence mode="popLayout">
          {exhibits.map((exhibit) => (
            <motion.div
              key={exhibit.id}
              initial={{ opacity: 0, x: 100, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.8 }}
              transition={{ duration: 0.3, type: "spring" }}
            >
              <Card className="p-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border shadow-lg hover:shadow-xl transition-shadow">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-1">
                    <ImageIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <Badge variant="outline" className="text-xs font-medium">
                        Exhibit
                      </Badge>
                      <h4 className="text-sm font-semibold mt-1 truncate">
                        {exhibit.display_name}
                      </h4>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveExhibit(exhibit.id)}
                    className="h-6 w-6 p-0 flex-shrink-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
                
                {/* Image Preview */}
                <div className="mb-3 relative group">
                  <img
                    src={exhibit.image_url}
                    alt={exhibit.description || exhibit.display_name}
                    className="w-full h-32 object-cover rounded-md cursor-pointer transition-transform group-hover:scale-105"
                    loading="lazy"
                    onClick={() => setExpandedExhibit(exhibit.id)}
                  />
                  
                  {/* Overlay Actions */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedExhibit(exhibit.id);
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
                
                {/* Description & Metadata */}
                {exhibit.description && (
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                    {exhibit.description}
                  </p>
                )}
                
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>{exhibit.timestamp.toLocaleTimeString()}</span>
                  <span className="capitalize">
                    {exhibit.file_type.split('/')[1]}
                  </span>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Expanded Modal */}
      <AnimatePresence>
        {expandedExhibit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
            onClick={() => setExpandedExhibit(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const exhibit = exhibits.find(e => e.id === expandedExhibit);
                if (!exhibit) return null;
                
                return (
                  <>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold">{exhibit.display_name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {exhibit.description}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(exhibit)}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedExhibit(null)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex justify-center">
                      <img
                        src={exhibit.image_url}
                        alt={exhibit.description || exhibit.display_name}
                        className="max-w-full max-h-[70vh] object-contain rounded-md"
                      />
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
