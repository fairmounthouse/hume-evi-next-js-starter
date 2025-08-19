"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { ChevronDown, Clock, User, Video, FileText, RefreshCw } from "lucide-react";
import { cn } from "@/utils";
import { motion, AnimatePresence } from "motion/react";

interface SessionSelectorProps {
  onSelectSession: (sessionId: string) => void;
  currentSessionId?: string;
  className?: string;
}

interface SessionSummary {
  session_id: string;
  created_at: string;
  started_at?: string;
  duration_seconds: number;
  has_detailed_analysis: boolean;
  has_video: boolean;
  status: string;
  transcript_path?: string;
}

export default function SessionSelector({ 
  onSelectSession, 
  currentSessionId, 
  className 
}: SessionSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(false);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/sessions/list?limit=20');
      const data = await response.json();
      
      if (data.success) {
        setSessions(data.sessions);
      } else {
        console.error('Failed to load sessions:', data.error);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && sessions.length === 0) {
      loadSessions();
    }
  }, [isOpen, sessions.length]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn("relative", className)}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
        size="sm"
      >
        <Clock className="w-4 h-4" />
        Load Previous Session
        <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full mt-2 right-0 z-50 w-96 max-h-96 overflow-hidden"
            >
              <Card className="p-4 shadow-lg border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">Recent Sessions</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={loadSessions}
                    disabled={loading}
                  >
                    <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} />
                  </Button>
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {loading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-xs text-muted-foreground">Loading sessions...</p>
                    </div>
                  ) : sessions.length > 0 ? (
                    sessions.map((session) => (
                      <div
                        key={session.session_id}
                        className={cn(
                          "p-3 rounded-lg border cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-800",
                          currentSessionId === session.session_id 
                            ? "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800" 
                            : "border-gray-200 dark:border-gray-700"
                        )}
                        onClick={() => {
                          onSelectSession(session.session_id);
                          setIsOpen(false);
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-mono text-muted-foreground truncate">
                              {session.session_id}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(session.started_at || session.created_at)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            {session.transcript_path && (
                              <div title="Has transcript">
                                <FileText className="w-3 h-3 text-gray-600" />
                              </div>
                            )}
                            {session.has_video && (
                              <div title="Has video">
                                <Video className="w-3 h-3 text-green-600" />
                              </div>
                            )}
                            {session.has_detailed_analysis && (
                              <div title="Has analysis">
                                <FileText className="w-3 h-3 text-blue-600" />
                              </div>
                            )}
                            {session.has_video && session.has_detailed_analysis && session.transcript_path && (
                              <Badge variant="default" className="text-xs px-1 py-0">
                                ✓ Full
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="secondary" 
                              className="text-xs px-1.5 py-0.5"
                            >
                              <Clock className="w-2.5 h-2.5 mr-1" />
                              {formatDuration(session.duration_seconds || 0)}
                            </Badge>
                            <Badge 
                              variant={session.status === 'completed' ? 'default' : 'outline'}
                              className="text-xs px-1.5 py-0.5"
                            >
                              {session.status}
                            </Badge>
                          </div>
                          
                          {currentSessionId === session.session_id && (
                            <Badge variant="default" className="text-xs">
                              Current
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <User className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">No completed sessions found</p>
                    </div>
                  )}
                </div>
                
                {sessions.length > 0 && (
                  <div className="mt-3 pt-3 border-t text-center">
                    <p className="text-xs text-muted-foreground">
                      Click any session to jump directly to its results
                    </p>
                  </div>
                )}
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
