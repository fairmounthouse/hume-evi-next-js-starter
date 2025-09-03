"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Calendar, Clock, User, FileText, Video, TrendingUp, Building, Star, Target, Brain } from 'lucide-react';
import Link from 'next/link';
import { Protect } from '@clerk/nextjs';

interface SessionData {
  session_id: string;
  created_at: string;
  started_at: string;
  duration_seconds: number;
  has_detailed_analysis: boolean;
  has_video: boolean;
  status: string;
  transcript_path: string;
  user_id: string;
  
  // Rich metadata
  case_title: string;
  case_type: string;
  case_industry: string;
  case_difficulty: string;
  
  interviewer_alias: string;
  interviewer_company: string;
  interviewer_seniority: string;
  
  difficulty_level: string;
  difficulty_code: string;
  
  // Scores  
  overall_score: number | null;
  analysis_summary: string | null;
  
  // Raw data - detailed_analysis removed
  feedback_data: any;
}

export default function SessionsPage() {
  const { user } = useUser();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch('/api/sessions/list?limit=20');
        const data = await response.json();
        
        if (data.success) {
          // Filter to only show sessions for current user (since RLS is disabled)
          const userSessions = data.sessions.filter((session: SessionData) => 
            session.user_id === user?.id
          );
          setSessions(userSessions);
        }
      } catch (error) {
        console.error('Error fetching sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchSessions();
    }
  }, [user]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-5 pt-16 pb-7">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading your sessions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    // Everyone can view session history - no restrictions
    <div>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-5 pt-16 pb-7">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            My Interview Sessions
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Review your past interviews, watch recordings, and track your progress
          </p>
        </motion.div>

        {/* Sessions Grid */}
        {sessions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Sessions Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start your first interview to see your session history here
            </p>
            <Link href="/interview/setup">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Start Your First Interview
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session, index) => (
              <motion.div
                key={session.session_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500 hover:border-l-blue-600">
                  {/* Case Title & Type */}
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 line-clamp-1">
                      {session.case_title}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {session.case_type}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {session.case_industry}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {session.difficulty_level}
                      </Badge>
                    </div>
                  </div>

                  {/* Interviewer Info - Clean with difficulty */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {session.interviewer_alias}
                        </span>
                      </div>
                      <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                        {session.difficulty_level}
                      </Badge>
                    </div>
                  </div>

                  {/* Session Metadata */}
                  <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {formatDate(session.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {formatDuration(session.duration_seconds)}
                      </span>
                    </div>
                  </div>

                  {/* Overall Performance Score */}
                  {session.overall_score && (
                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                          Overall Performance
                        </span>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          {(() => {
                            const filledStars = Math.round(session.overall_score);
                            const stars = [];
                            
                            for (let i = 1; i <= 5; i++) {
                              stars.push(
                                <Star
                                  key={i}
                                  className={`w-5 h-5 ${
                                    i <= filledStars 
                                      ? 'text-yellow-500 fill-yellow-500' 
                                      : 'text-gray-300 fill-gray-300'
                                  }`}
                                />
                              );
                            }
                            
                            return (
                              <div className="flex flex-col items-center gap-1">
                                <div className="flex items-center gap-0.5">
                                  {stars}
                                </div>

                              </div>
                            );
                          })()}
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">MBB Assessment Score</div>
                      </div>
                    </div>
                  )}

                  {/* Session Features */}
                  <div className="flex items-center justify-between mb-4 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Video className={`w-3 h-3 ${session.has_video ? 'text-green-500' : 'text-gray-400'}`} />
                        <span className={session.has_video ? 'text-green-600' : 'text-gray-500'}>
                          Video
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className={`w-3 h-3 ${session.transcript_path ? 'text-green-500' : 'text-gray-400'}`} />
                        <span className={session.transcript_path ? 'text-green-600' : 'text-gray-500'}>
                          Transcript
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className={`w-3 h-3 ${session.has_detailed_analysis ? 'text-green-500' : 'text-gray-400'}`} />
                        <span className={session.has_detailed_analysis ? 'text-green-600' : 'text-gray-500'}>
                          Analysis
                        </span>
                      </div>
                    </div>
                    <Badge 
                      variant={session.status === 'completed' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {session.status}
                    </Badge>
                  </div>

                  {/* Action Button */}
                  <Link href={`/sessions/${session.session_id}`}>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
                      <Play className="w-4 h-4" />
                      Review Session
                    </Button>
                  </Link>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        {sessions.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-12"
          >
            <Link href="/interview/setup">
              <Button variant="outline" className="bg-white/50 dark:bg-gray-800/50">
                Start New Interview
              </Button>
            </Link>
          </motion.div>
        )}
      </div>
          </div>
    </div>
  );
}
