"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Clock, Download, Play, User, FileText, Building, Star, Target, Brain, TrendingUp, Video } from 'lucide-react';
import Link from 'next/link';
import VideoTranscriptPlayer from '@/components/VideoTranscriptPlayer';
import EnhancedDetailedAnalysis from '@/components/EnhancedDetailedAnalysis';
import TranscriptDrawer from '@/components/TranscriptDrawer';
import { Protect } from '@clerk/nextjs';

export default function SessionViewerPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const sessionId = params.sessionId as string;
  
  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        const { getSessionData } = await import('@/utils/supabase-client');
        const data = await getSessionData(sessionId);
        
        if (!data) {
          setError('Session not found');
          return;
        }
        
        // Basic privacy check (since RLS is disabled)
        if (data.sessionData?.user_id && data.sessionData.user_id !== user?.id) {
          setError('Access denied - this session belongs to another user');
          return;
        }
        
        setSessionData(data);
      } catch (error) {
        console.error('Error fetching session data:', error);
        setError('Failed to load session data');
      } finally {
        setLoading(false);
      }
    };

    if (user && sessionId) {
      fetchSessionData();
    }
  }, [user, sessionId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long', 
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes} minutes ${remainingSeconds} seconds`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-5 pt-16 pb-7">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading session...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-5 pt-16 pb-7">
          <div className="text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{error}</h2>
            <Link href="/sessions">
              <Button variant="outline">← Back to Sessions</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { transcript, finalEvaluation, videoUrl, sessionData: session } = sessionData;

  return (
    // Everyone can view their sessions - no restrictions
    <div>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-5 pt-16 pb-7">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <Link href="/sessions">
              <Button variant="ghost" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Sessions
              </Button>
            </Link>
            <Badge variant="outline" className="text-xs">
              Session {sessionId}
            </Badge>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {sessionData.sessionData?.case_title || 'Interview Session Review'}
          </h1>
          
          {/* Rich Session Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Case Info */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">Case Details</span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="font-semibold">{sessionData.sessionData?.case_type || 'Unknown'}</div>
                <div className="text-gray-600 dark:text-gray-400">{sessionData.sessionData?.case_industry || 'Unknown'}</div>
                <Badge variant="secondary" className="text-xs">{sessionData.sessionData?.case_difficulty || 'Unknown'}</Badge>
              </div>
            </Card>

            {/* Interviewer Info */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Building className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">Interviewer</span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="font-semibold">{sessionData.sessionData?.interviewer_name || 'Unknown'}</div>
                <div className="text-gray-600 dark:text-gray-400">{sessionData.sessionData?.interviewer_role || 'Unknown Role'}</div>
                <div className="text-gray-600 dark:text-gray-400">{sessionData.sessionData?.interviewer_company || 'Unknown Company'}</div>
              </div>
            </Card>

            {/* Performance Scores */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium">Performance</span>
              </div>
              <div className="space-y-1 text-xs">
                {sessionData.sessionData?.overall_score ? (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                      {sessionData.sessionData.overall_score}/100
                    </div>
                    <div className="text-purple-600 dark:text-purple-400">Overall Performance</div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    <div className="text-sm">No Score</div>
                    <div className="text-xs">Analysis Pending</div>
                  </div>
                )}
              </div>
            </Card>

            {/* Session Stats */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium">Session Stats</span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span className="font-semibold">{formatDuration(session.duration_seconds)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span className="font-semibold">{new Date(session.created_at).toLocaleDateString()}</span>
                </div>
                <Badge variant={session.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                  {session.status}
                </Badge>
              </div>
            </Card>
          </div>
        </motion.div>

        {/* Main Content - EXACT Same Layout as End Screen */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Video (exact same as end screen) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Card className="p-6 flex flex-col">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Play className="w-5 h-5" />
                Interview Recording
              </h3>
              
              <div className="flex-grow">
                {videoUrl ? (
                  <div className="w-full aspect-video">
                    <iframe
                      src={videoUrl.replace('/watch', '/iframe')}
                      className="w-full aspect-video"
                      style={{ border: "none" }}
                      allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                      allowFullScreen
                      title="Interview Recording"
                    />
                  </div>
                ) : (
                  <div className="w-full aspect-video flex items-center justify-center bg-gray-900">
                    <div className="text-center">
                      <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-white text-sm">No video recording available</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Session Summary (exact same as end screen) */}
              <div className="bg-white dark:bg-gray-900 rounded-lg p-4 space-y-3 mt-4">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Session Summary
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="font-medium">{formatDuration(session.duration_seconds)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Messages:</span>
                    <span className="font-medium">{transcript?.length || 0} exchanges</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Recording:</span>
                    <span className="font-medium">{videoUrl ? '✅ Available' : '❌ Not Available'}</span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Right Column - Transcript (exact same as end screen) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6 flex flex-col h-full">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Interview Transcript
              </h3>
              
              <div className="flex-grow overflow-hidden">
                <div className="h-96 overflow-y-auto border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                  {transcript && transcript.length > 0 ? (
                    <div className="space-y-3">
                      {transcript.map((entry: any, index: number) => (
                        <div key={index} className="flex gap-3">
                          <div className="flex-shrink-0 w-16 text-xs text-gray-500">
                            {new Date(entry.timestamp * 1000).toLocaleTimeString()}
                          </div>
                          <div className="flex-grow">
                            <div className="text-xs font-medium mb-1">
                              {entry.speaker === "user" ? "You" : "Interviewer"}
                            </div>
                            <div className="text-sm">{entry.text}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No transcript available</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Download Buttons (same as end screen) */}
              <div className="flex gap-2 mt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    if (sessionData.sessionData?.transcript_path) {
                      window.open(sessionData.sessionData.transcript_path, '_blank');
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <Download className="w-3 h-3" />
                  TXT
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const jsonData = JSON.stringify(transcript, null, 2);
                    const blob = new Blob([jsonData], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `interview-transcript-${sessionId}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="flex items-center gap-2"
                >
                  <Download className="w-3 h-3" />
                  JSON
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Bottom Section - Detailed Analysis */}
        {finalEvaluation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8"
          >
            <EnhancedDetailedAnalysis 
              evaluation={finalEvaluation}
              confidence={finalEvaluation?.confidence || 0}
            />
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center gap-4 mt-8"
        >
          <Link href="/interview/setup">
            <Button variant="outline">
              Start New Interview
            </Button>
          </Link>
          <Link href="/sessions">
            <Button variant="ghost">
              View All Sessions
            </Button>
          </Link>
        </motion.div>
      </div>
          </div>
    </div>
  );
}
