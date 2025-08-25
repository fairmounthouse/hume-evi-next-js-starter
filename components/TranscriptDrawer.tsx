"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, Download, User } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { cn } from "@/utils";

interface TranscriptEntry {
  id: string;
  speaker: "user" | "assistant";
  text: string;
  timestamp: number;
  emotions?: any;
  confidence?: number;
}

interface TranscriptDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  transcript: TranscriptEntry[];
  className?: string;
}

export default function TranscriptDrawer({ 
  isOpen, 
  onClose, 
  transcript,
  className = "" 
}: TranscriptDrawerProps) {
  // Close drawer when clicking backdrop
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const downloadTranscript = () => {
    const transcriptText = transcript.map(entry => 
      `${entry.speaker === 'user' ? 'Interviewee' : 'AI Interviewer'} ${formatTimestamp(entry.timestamp)}\n${entry.text}\n`
    ).join('\n');
    
    const blob = new Blob([transcriptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-transcript-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadJSON = () => {
    const jsonData = JSON.stringify(transcript, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-transcript-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={handleBackdropClick}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={cn(
              "fixed top-0 right-0 h-full bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col",
              "w-[400px] lg:w-[400px] md:w-[50vw] sm:w-[90vw]",
              className
            )}
            style={{ boxShadow: '-2px 0 8px rgba(0,0,0,0.15)' }}
          >
            {/* Header */}
            <div className="border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold">Transcript</h2>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={downloadTranscript}>
                  <Download className="w-4 h-4 mr-1" />
                  TXT
                </Button>
                <Button variant="outline" size="sm" onClick={downloadJSON}>
                  <Download className="w-4 h-4 mr-1" />
                  JSON
                </Button>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {transcript.length === 0 ? (
                <div className="text-center text-muted-foreground mt-8">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No transcript available yet.</p>
                  <p className="text-sm mt-2">Start an interview to see the conversation here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transcript.map((entry, index) => (
                    <motion.div
                      key={entry.id || index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        "p-3 rounded-lg border",
                        entry.speaker === "user" 
                          ? "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 ml-4"
                          : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 mr-4"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                          entry.speaker === "user"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-600 text-white"
                        )}>
                          {entry.speaker === "user" ? <User className="w-3 h-3" /> : "AI"}
                        </div>
                        <span className={cn(
                          "text-sm font-medium",
                          entry.speaker === "user" 
                            ? "text-blue-700 dark:text-blue-300"
                            : "text-gray-700 dark:text-gray-300"
                        )}>
                          {entry.speaker === "user" ? "Interviewee" : "AI Interviewer"}
                        </span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {formatTimestamp(entry.timestamp)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {entry.text}
                      </p>
                      
                      {entry.confidence && (
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs">
                            {Math.round(entry.confidence * 100)}% confidence
                          </Badge>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
