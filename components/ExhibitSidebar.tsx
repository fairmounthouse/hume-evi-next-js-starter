"use client";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronRight, 
  ChevronLeft, 
  Image as ImageIcon, 
  Eye, 
  EyeOff,
  Download,
  Maximize2,
  Lock,
  Unlock
} from "lucide-react";
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
  unlocked_at?: Date;
  is_visible?: boolean;
}

interface ExhibitSidebarProps {
  unlockedExhibits: Exhibit[];
  visibleExhibits: string[]; // Array of exhibit IDs that are currently visible
  onToggleExhibitVisibility: (exhibitId: string) => void;
  onExpandExhibit: (exhibitId: string) => void;
  className?: string;
}

export default function ExhibitSidebar({ 
  unlockedExhibits, 
  visibleExhibits,
  onToggleExhibitVisibility,
  onExpandExhibit,
  className = "" 
}: ExhibitSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (unlockedExhibits.length === 0) return null;

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
    <motion.div
      initial={{ x: 300 }}
      animate={{ x: isCollapsed ? 260 : 0 }}
      transition={{ type: "spring", damping: 20, stiffness: 200 }}
      className={cn(
        "fixed top-20 right-4 z-40 w-80 max-h-[calc(100vh-6rem)] flex flex-col",
        className
      )}
    >
      {/* Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -left-10 top-4 w-8 h-8 p-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-lg border"
      >
        {isCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </Button>

      {/* Sidebar Content */}
      <Card className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border shadow-lg flex flex-col max-h-full">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-sm">Case Exhibits</h3>
          </div>
          <Badge variant="secondary" className="text-xs">
            {unlockedExhibits.length} unlocked
          </Badge>
        </div>

        {/* Exhibits List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          <AnimatePresence mode="popLayout">
            {unlockedExhibits.map((exhibit) => {
              const isVisible = visibleExhibits.includes(exhibit.id);
              const isNewlyUnlocked = exhibit.unlocked_at && 
                Date.now() - exhibit.unlocked_at.getTime() < 5000; // Within last 5 seconds
              
              return (
                <motion.div
                  key={exhibit.id}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0, 
                    scale: 1,
                    boxShadow: isNewlyUnlocked ? "0 0 20px rgba(59, 130, 246, 0.5)" : "none"
                  }}
                  exit={{ opacity: 0, y: -20, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    "p-3 rounded-lg border transition-all duration-200",
                    isVisible 
                      ? "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800" 
                      : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                >
                  {/* Exhibit Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className={cn(
                        "w-2 h-2 rounded-full flex-shrink-0",
                        isNewlyUnlocked ? "bg-green-500 animate-pulse" : "bg-blue-500"
                      )} />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-medium truncate">
                          {exhibit.display_name}
                        </h4>
                        {exhibit.unlocked_at && (
                          <p className="text-xs text-muted-foreground">
                            Unlocked {exhibit.unlocked_at.toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Visibility Toggle */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onToggleExhibitVisibility(exhibit.id)}
                      className={cn(
                        "h-6 w-6 p-0 transition-colors",
                        isVisible 
                          ? "text-blue-600 hover:text-blue-700" 
                          : "text-gray-400 hover:text-gray-600"
                      )}
                    >
                      {isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    </Button>
                  </div>

                  {/* Exhibit Preview */}
                  <div className="mb-2 relative group">
                    <img
                      src={exhibit.image_url}
                      alt={exhibit.description || exhibit.display_name}
                      className="w-full h-16 object-cover rounded cursor-pointer transition-transform group-hover:scale-105"
                      loading="lazy"
                      onClick={() => onExpandExhibit(exhibit.id)}
                    />
                    
                    {/* Hover Actions */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex gap-1">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onExpandExhibit(exhibit.id);
                          }}
                          className="h-6 w-6 p-0"
                        >
                          <Maximize2 className="w-2.5 h-2.5" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(exhibit);
                          }}
                          className="h-6 w-6 p-0"
                        >
                          <Download className="w-2.5 h-2.5" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {exhibit.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {exhibit.description}
                    </p>
                  )}

                  {/* Status Indicator */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1">
                      {isVisible ? (
                        <Unlock className="w-3 h-3 text-green-600" />
                      ) : (
                        <Lock className="w-3 h-3 text-gray-400" />
                      )}
                      <span className="text-xs text-muted-foreground">
                        {isVisible ? "Visible" : "Hidden"}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground capitalize">
                      {exhibit.file_type.split('/')[1]}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-3 border-t bg-gray-50/50 dark:bg-gray-800/50 flex-shrink-0">
          <p className="text-xs text-muted-foreground text-center">
            Exhibits unlocked by AI during interview
          </p>
        </div>
      </Card>
    </motion.div>
  );
}
