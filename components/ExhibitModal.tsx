"use client";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
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

interface ExhibitModalProps {
  exhibit: Exhibit | null;
  onClose: () => void;
}

export default function ExhibitModal({ exhibit, onClose }: ExhibitModalProps) {
  const [zoom, setZoom] = useState(1);

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.5));
  const resetZoom = () => setZoom(1);

  // Reset zoom when exhibit changes
  useEffect(() => {
    if (exhibit) {
      setZoom(1);
    }
  }, [exhibit]);

  if (!exhibit) return null;

  return (
    <AnimatePresence>
      {/* Semi-transparent backdrop with blur */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-white/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Clean, minimal modal */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[210] 
                   bg-white rounded-xl shadow-lg w-[90vw] h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Minimal header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">
            {exhibit.display_name}
          </h3>
          
          <div className="flex items-center gap-2">
            {/* Inline zoom controls */}
            <div className="flex items-center bg-gray-50 rounded-md px-1 py-1">
              <button
                onClick={handleZoomOut}
                disabled={zoom <= 0.5}
                className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-white 
                          hover:text-gray-700 rounded text-lg font-light disabled:opacity-40 
                          disabled:cursor-not-allowed transition-colors"
              >
                −
              </button>
              <span className="text-xs text-gray-500 min-w-[40px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                disabled={zoom >= 3}
                className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-white 
                          hover:text-gray-700 rounded text-lg font-light disabled:opacity-40 
                          disabled:cursor-not-allowed transition-colors"
              >
                +
              </button>
            </div>
            
            {/* Ghost close button */}
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center text-gray-400 
                        hover:bg-gray-50 hover:text-gray-600 rounded-md transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Clean content area - centered image */}
        <div className="flex-1 bg-gray-25 flex justify-center items-center relative overflow-hidden">
          <img
            src={exhibit.image_url}
            alt={exhibit.description || exhibit.display_name}
            className="max-w-full max-h-full object-contain rounded-lg bg-white p-6 shadow-sm"
            style={{
              transform: `scale(${zoom})`,
              transition: 'transform 0.2s ease'
            }}
            onDoubleClick={() => zoom === 1 ? handleZoomIn() : resetZoom()}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
