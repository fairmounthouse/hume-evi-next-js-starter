"use client";

import { useState, useEffect, useRef } from 'react';
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
import SessionDocuments from '@/components/SessionDocuments';
import { Timeline, VerticalTimeline } from '@/components/ui/timeline';
import { Protect } from '@clerk/nextjs';

interface DimensionScore {
  score: number;
  feedback: string;
  dimension_name: string;
}

const dimensionLabels = {
  structure_problem_architecture: "Structure & Problem Architecture",
  analytical_rigor_quantitative_fluency: "Analytical Rigor & Quantitative Fluency", 
  insight_generation_business_acumen: "Insight Generation & Business Acumen",
  communication_precision_dialogue_management: "Communication Precision & Dialogue Management",
  adaptive_thinking_intellectual_courage: "Adaptive Thinking & Intellectual Courage"
};

export default function SessionViewerPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const sessionId = params.sessionId as string;
  
  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'verdict' | 'analysis' | 'nextsteps'>('verdict');
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'critical' | 'warning' | 'positive'>('all');
  
  // Ref for video iframe control
  const videoPlayerRef = useRef<HTMLIFrameElement>(null);

  // Helper functions for timeline filtering (same as end screen)
  const getMomentType = (category: string): 'critical' | 'warning' | 'positive' => {
    switch (category) {
      case 'Critical Issues':
        return 'critical';
      case 'Warnings':
        return 'warning';
      case 'Positive Moments':
        return 'positive';
      default:
        return 'critical';
    }
  };

  const getFilteredMoments = () => {
    const mbbReport = sessionData?.mbbReport;
    if (!mbbReport || !mbbReport.unified_moments || !Array.isArray(mbbReport.unified_moments)) return [];
    if (timelineFilter === 'all') return mbbReport.unified_moments;
    
    return mbbReport.unified_moments.filter((moment: any) => {
      const type = getMomentType(moment.category);
      return type === timelineFilter;
    });
  };

  const getMomentCounts = () => {
    const mbbReport = sessionData?.mbbReport;
    const moments = Array.isArray(mbbReport?.unified_moments) ? mbbReport.unified_moments : [];
    const counts = { all: moments.length, critical: 0, warning: 0, positive: 0 } as Record<'all' | 'critical' | 'warning' | 'positive', number>;
    moments.forEach((moment: any) => {
      const type = getMomentType(moment.category);
      if (type === 'critical' || type === 'warning' || type === 'positive') {
        counts[type]++;
      }
    });
    return counts;
  };


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
        console.log("✅ [SESSIONS] Complete session data loaded:", data);
        
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

  // Calculate overall score from MBB Assessment
  const calculateOverallScore = (): number => {
    const mbbAssessment = sessionData?.mbbAssessment;
    if (!mbbAssessment) return 0;
    
    const scores = [
      mbbAssessment.structure_problem_architecture?.score || 0,
      mbbAssessment.analytical_rigor_quantitative_fluency?.score || 0,
      mbbAssessment.insight_generation_business_acumen?.score || 0,
      mbbAssessment.communication_precision_dialogue_management?.score || 0,
      mbbAssessment.adaptive_thinking_intellectual_courage?.score || 0
    ];
    
    return Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1));
  };

  const getScoreColor = (score: number): string => {
    if (score >= 4) return "high";
    if (score >= 2.5) return "medium";
    return "low";
  };

  // Star rating component
  const renderStarRating = (score: number, showScore: boolean = true) => {
    const filledStars = Math.round(score);
    const stars = [];
    
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-4 h-4 ${
            i <= filledStars 
              ? 'text-yellow-500 fill-yellow-500' 
              : 'text-gray-300 fill-gray-300'
          }`}
        />
      );
    }
    
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5">
          {stars}
        </div>

      </div>
    );
  };

  const getVerdict = (score: number): string => {
    if (score >= 4) return "Recommended";
    if (score >= 3) return "Borderline";
    return "Not Recommended";
  };

  const downloadTranscript = async (format: 'txt' | 'json' = 'txt') => {
    const transcript = sessionData?.transcript;
    if (!transcript) {
      console.warn("No transcript available for download");
      return;
    }

    try {
      if (format === 'json') {
        const blob = new Blob([JSON.stringify(transcript, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `interview-transcript-${sessionId}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // Convert transcript to text format
        const transcriptText = transcript.map((entry: any) => {
          const timestamp = entry.timestamp !== undefined ? `[${Math.floor(entry.timestamp / 60).toString().padStart(2, '0')}:${(entry.timestamp % 60).toString().padStart(2, '0')}]` : '[00:00]';
          const speaker = entry.speaker === 'user' ? 'YOU:' : 'AI INTERVIEWER:';
          return `${timestamp} ${speaker} ${entry.text}`;
        }).join('\n');
        
        const blob = new Blob([transcriptText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `interview-transcript-${sessionId}.txt`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error downloading transcript:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] text-[#0a0a0a] font-sans leading-relaxed">
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
      <div className="min-h-screen bg-[#fafafa] text-[#0a0a0a] font-sans leading-relaxed">
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

  const { transcript, finalEvaluation, videoUrl, mbbAssessment, mbbReport, sessionData: session } = sessionData;
  const overallScore = calculateOverallScore();
  const verdict = getVerdict(overallScore);

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#0a0a0a] font-sans leading-relaxed">
      {/* Header - Not Fixed, Works with Sidebar Layout */}
      <div className="bg-white border-b border-[#e4e4e7] mb-6">
        <div className="max-w-7xl mx-auto p-4 lg:p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-4">
            <Link href="/sessions">
              <Button variant="ghost" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Sessions
              </Button>
            </Link>
              <h1 className="text-2xl font-semibold text-[#0a0a0a]">Session Review</h1>
              <span className="text-sm text-[#71717a]">ID: {sessionId}</span>
            </div>
            <div className="flex flex-wrap gap-2">

              <Button 
                variant="outline" 
                size="sm"
                onClick={() => downloadTranscript('txt')}
                disabled={!transcript}
                className="flex items-center gap-2"
              >
                📄 Download Transcript
              </Button>
              <Link href="/dashboard">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-2"
                >
                  🏠 Dashboard
                </Button>
              </Link>
              <Link href="/interview/setup">
                <Button 
                  size="sm" 
                  className="flex items-center gap-2 bg-[#0a0a0a] hover:bg-[#27272a]"
                >
                  Start New Interview
                </Button>
              </Link>
            </div>
          </div>
              </div>
              </div>

      {/* Main Content - Standard Layout for Sidebar */}
      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Panel - Session Info & Video */}
          <div className="lg:col-span-1">
              {/* Session Metadata - Styled like Interview Setup */}
              <Card className="mb-4">
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Session Details
                  </h3>
                  
                  {/* Case Info */}
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">{session?.case_title}</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs">
                        {session?.case_type}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {session?.case_industry}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {session?.case_difficulty}
                      </Badge>
                    </div>
                  </div>

                  {/* Interviewer Info - Styled like setup cards */}
                  <div className="border-t pt-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-lg font-bold">
                        {(session?.interviewer_name || session?.interviewer_alias || 'U').split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{session?.interviewer_name || 'Unknown'}</h4>
                        <p className="text-sm text-gray-500">{session?.interviewer_alias}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                        <Building className="w-3 h-3 mr-1" />
                        {session?.interviewer_company}
                      </Badge>
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                        <User className="w-3 h-3 mr-1" />
                        {session?.interviewer_role}
                      </Badge>
                      <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                        <Target className="w-3 h-3 mr-1" />
                        {session?.difficulty_level}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>

              <div className="bg-white border border-[#e4e4e7] rounded-lg p-4 mb-4 h-fit">
                <h3 className="text-sm font-semibold text-[#0a0a0a] mb-3 flex items-center gap-2">
                  🎥 Interview Recording
                </h3>
                
                <div className="relative rounded-md overflow-hidden bg-black aspect-video mb-3">
                  {videoUrl ? (
                    <iframe
                      ref={videoPlayerRef}
                      src={videoUrl.replace('/watch', '/iframe')}
                      className="w-full h-full"
                      style={{ border: "none" }}
                      allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                      allowFullScreen
                      title="Interview Recording"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-[#71717a] text-sm gap-2">
                      <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-lg">
                        ▶️
                      </div>
                      <span>Camera Off</span>
                      <span className="text-xs">{formatDuration(session?.duration_seconds || 0)}</span>
                    </div>
                  )}
                </div>
              
                <h4 className="text-sm font-semibold text-[#0a0a0a] mb-3 mt-4 flex items-center gap-2">
                  👤 Session Summary
                </h4>
                
                <div className="space-y-1">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-xs text-[#71717a]">Duration:</span>
                    <span className="text-xs font-medium text-[#0a0a0a]">{formatDuration(session?.duration_seconds || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-xs text-[#71717a]">Messages:</span>
                    <span className="text-xs font-medium text-[#0a0a0a]">{transcript?.length || 0} exchanges</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-xs text-[#71717a]">Recording:</span>
                    <span className={`text-xs font-medium flex items-center gap-1 ${videoUrl ? 'text-[#22c55e]' : 'text-[#f59e0b]'}`}>
                      {videoUrl ? '✅ Available' : '🔄 Processing...'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          {/* Middle Panel - Main Content */}
          <div className="lg:col-span-2 bg-white border border-[#e4e4e7] rounded-lg">
              {/* Tabs */}
              <div className="flex border-b border-[#e4e4e7] sticky top-0 bg-white z-10">
                {[
                  { id: 'verdict', label: '📊 Verdict' },
                  { id: 'analysis', label: '🔍 Analysis' },
                  { id: 'nextsteps', label: '🎯 Next Steps' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-6 py-3 text-sm font-medium transition-all duration-150 relative ${
                      activeTab === tab.id 
                        ? 'text-[#0a0a0a] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#0a0a0a]' 
                        : 'text-[#71717a] hover:text-[#0a0a0a]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {/* Verdict Tab */}
                {activeTab === 'verdict' && mbbAssessment && (
                  <div>
                    {/* Overall Score */}
                    <div className="text-center py-8 mb-6 border-b border-[#e4e4e7]">
                      <div className="flex justify-center">
                        {(() => {
                          const filledStars = Math.round(overallScore);
                          const stars = [];
                          
                          for (let i = 1; i <= 5; i++) {
                            stars.push(
                              <Star
                                key={i}
                                className={`w-12 h-12 ${
                                  i <= filledStars 
                                    ? 'text-yellow-500 fill-yellow-500' 
                                    : 'text-gray-300 fill-gray-300'
                                }`}
                              />
                            );
                          }
                          
                          return (
                            <div className="flex items-center gap-1">
                              {stars}
                            </div>
                          );
                        })()}
                      </div>
                      <div className={`inline-block mt-4 px-4 py-1.5 rounded text-xs font-semibold uppercase tracking-wider ${
                        verdict === 'Recommended' ? 'bg-[#dcfce7] text-[#22c55e]' :
                        verdict === 'Borderline' ? 'bg-[#fef3c7] text-[#f59e0b]' :
                        'bg-[#fee2e2] text-[#dc2626]'
                      }`}>
                        {verdict}
                      </div>
                    </div>

                    {/* Critical Findings */}
                    {mbbAssessment.strengths_and_blockers && (
                      <div className="bg-[#fef2f2] border border-[#fecaca] rounded-lg p-6 mb-8">
                        <div className="flex items-center gap-2 font-semibold text-[#dc2626] mb-5 text-base">
                          ⚠️ Critical Findings
                        </div>
                        
                        <div className="flex flex-col gap-6">
                          {/* Blockers */}
                          <div className="flex flex-col gap-3">
                            <div className="text-sm font-semibold text-[#0a0a0a] flex items-center gap-2">
                              🚫 Biggest Blockers
                            </div>
                            <div className="flex flex-col gap-2.5 pl-6">
                              {(mbbAssessment.strengths_and_blockers?.biggest_blockers || []).slice(0, 3).map((blocker: string, index: number) => (
                                <div key={index} className="relative text-sm text-[#52525b] leading-relaxed pl-4 before:content-[''] before:absolute before:left-0 before:top-2 before:w-1 before:h-1 before:rounded-full before:bg-[#dc2626]">
                                  {blocker}
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          {/* Strengths */}
                          <div className="flex flex-col gap-3">
                            <div className="text-sm font-semibold text-[#0a0a0a] flex items-center gap-2">
                              💪 Biggest Strengths
                            </div>
                            <div className="flex flex-col gap-2.5 pl-6">
                              {(mbbAssessment.strengths_and_blockers?.biggest_strengths || []).slice(0, 3).map((strength: string, index: number) => (
                                <div key={index} className="relative text-sm text-[#52525b] leading-relaxed pl-4 before:content-[''] before:absolute before:left-0 before:top-2 before:w-1 before:h-1 before:rounded-full before:bg-[#22c55e]">
                                  {strength}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Dimensions */}
                    <div className="mb-8">
                      <h2 className="text-lg font-semibold text-[#0a0a0a] mb-5">
                        Performance Across 5 Dimensions
                      </h2>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {Object.entries(mbbAssessment).map(([key, value]) => {
                          if (!dimensionLabels[key as keyof typeof dimensionLabels]) return null;
                          
                          const dimension = value as DimensionScore;
                          const scoreColor = getScoreColor(dimension.score);
                          
                          return (
                            <div key={key} className="bg-[#fafafa] border border-[#e4e4e7] rounded-md p-4">
                              <div className="flex justify-between items-start mb-2">
                                <div className="text-sm font-semibold text-[#0a0a0a] flex-1 leading-tight">
                                  {dimensionLabels[key as keyof typeof dimensionLabels]}
                                </div>
                                <div className="ml-3">
                                  {renderStarRating(dimension.score)}
                                </div>
                              </div>
                              <div className="text-xs text-[#71717a] mb-3 leading-tight">
                                {dimension.feedback}
                              </div>
                              <div className="w-full h-1 bg-[#e4e4e7] rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all duration-300 ${
                                    scoreColor === 'high' ? 'bg-[#22c55e]' :
                                    scoreColor === 'medium' ? 'bg-[#f59e0b]' :
                                    'bg-[#dc2626]'
                                  }`}
                                  style={{ width: `${(dimension.score / 5) * 100}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Summary */}
                    {mbbAssessment.quick_summary && (
                      <div className="bg-[#fafafa] border border-[#e4e4e7] rounded-md p-5">
                        <h3 className="text-base font-semibold text-[#0a0a0a] mb-4">
                          30-Second Summary
              </h3>
              
                        <div className="space-y-4">
                          <div>
                            <div className="text-sm font-semibold text-[#0a0a0a] mb-1 flex items-center gap-1.5">
                              ✅ What could have helped
                            </div>
                            <div className="text-sm text-[#52525b] leading-relaxed">
                              {mbbAssessment?.quick_summary?.what_helped || 'No data available'}
                            </div>
                          </div>

                          <div>
                            <div className="text-sm font-semibold text-[#0a0a0a] mb-1 flex items-center gap-1.5">
                              ❌ What hurt performance
                            </div>
                            <div className="text-sm text-[#52525b] leading-relaxed">
                              {mbbAssessment?.quick_summary?.what_hurt || 'No data available'}
                            </div>
                          </div>

                          <div>
                            <div className="text-sm font-semibold text-[#0a0a0a] mb-1 flex items-center gap-1.5">
                              ➡️ Path forward
                            </div>
                            <div className="text-sm text-[#52525b] leading-relaxed">
                              {mbbAssessment?.quick_summary?.path_forward || 'No data available'}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Analysis Tab */}
                {activeTab === 'analysis' && mbbReport && (
                  <div className="space-y-8">
                    {/* Analysis Summary */}
                    <div className="bg-[#fef3c7] border border-[#fbbf24] rounded-md p-4 flex items-start gap-3">
                      <div className="text-xl flex-shrink-0">⚠️</div>
                      <div className="text-sm text-[#92400e] leading-relaxed">
                        <strong>Analysis Summary:</strong> {mbbReport.analysis_summary}
                      </div>
                    </div>

                    {/* Critical Moments Timeline - Same as End Screen */}
                    {mbbReport.unified_moments && (
                      <div className="mb-8">
                        <div className="flex justify-between items-center mb-6">
                          <h2 className="text-lg font-semibold text-[#0a0a0a]">
                            Critical Moments Timeline
                          </h2>
                          
                          {/* Filter Buttons - Same as End Screen */}
                          <div className="flex gap-2">
                            {(['all', 'critical', 'warning', 'positive'] as const).map(filter => {
                              const counts = getMomentCounts();
                              return (
                                <button
                                  key={filter}
                                  onClick={() => setTimelineFilter(filter)}
                                  className={`px-3 py-1 text-xs font-medium rounded-full transition-all duration-200 ${
                                    timelineFilter === filter
                                      ? 'bg-[#0a0a0a] text-white'
                                      : 'bg-[#f4f4f5] text-[#71717a] hover:bg-[#e4e4e7]'
                                  }`}
                                >
                                  {filter === 'all' ? 'All' : 
                                   filter === 'critical' ? 'Critical' :
                                   filter === 'warning' ? 'Warning' : 'Positive'} ({counts[filter]})
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        
                        {/* Mobile Timeline */}
                        <div className="block lg:hidden">
                                                      <VerticalTimeline 
                              events={getFilteredMoments()
                                .sort((a: any, b: any) => {
                                  // Parse timestamps (MM:SS format) for proper sorting
                                  const parseTime = (timeStr: string) => {
                                    const parts = timeStr.split(':').map(Number);
                                    return parts.length === 2 ? parts[0] * 60 + parts[1] : 0;
                                  };
                                  return parseTime(a.timestamp) - parseTime(b.timestamp);
                                })
                                .map((moment: any) => ({
                                  timestamp: moment.timestamp,
                                  title: moment.title,
                                  description: moment.description,
                                  type: getMomentType(moment.category)
                                }))}
                            transcript={transcript}
                            onSeekVideo={(timestamp) => {
                              console.log("🎯 [SESSIONS VERTICAL TIMELINE] Seeking video to:", timestamp);
                              sessionStorage.setItem('seekToTimestamp', timestamp.toString());
                              window.dispatchEvent(new CustomEvent('seekToTimestamp', { 
                                detail: { timestamp } 
                              }));
                            }}
                          />
                        </div>
                        
                        {/* Desktop Timeline */}
                        <div className="hidden lg:block">
                                                      <Timeline 
                              events={getFilteredMoments()
                                .sort((a: any, b: any) => {
                                  // Parse timestamps (MM:SS format) for proper sorting
                                  const parseTime = (timeStr: string) => {
                                    const parts = timeStr.split(':').map(Number);
                                    return parts.length === 2 ? parts[0] * 60 + parts[1] : 0;
                                  };
                                  return parseTime(a.timestamp) - parseTime(b.timestamp);
                                })
                                .map((moment: any) => ({
                                  timestamp: moment.timestamp,
                                  title: moment.title,
                                  description: moment.description,
                                  type: getMomentType(moment.category)
                                }))}
                            transcript={transcript}
                            onSeekVideo={(timestamp) => {
                              console.log("🎯 [SESSIONS TIMELINE] Seeking video to:", timestamp);
                              sessionStorage.setItem('seekToTimestamp', timestamp.toString());
                              window.dispatchEvent(new CustomEvent('seekToTimestamp', { 
                                detail: { timestamp } 
                              }));
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Primary Pattern Analysis */}
                    {mbbReport.primary_pattern && (
                      <div className="bg-[#fafafa] border border-[#e4e4e7] rounded-lg p-6">
                        <div className="flex justify-between items-center mb-4">
                          <h2 className="text-lg font-semibold text-[#0a0a0a]">Primary Pattern Detected</h2>
                          <Badge variant="destructive" className="bg-[#fee2e2] text-[#dc2626]">
                            {mbbReport.primary_pattern.instance_count} instances
                          </Badge>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-base font-semibold text-[#dc2626] mb-2">
                              {mbbReport.primary_pattern.pattern_name}
                            </h3>
                            <p className="text-sm text-[#52525b] leading-relaxed mb-6">
                              {mbbReport.primary_pattern.description}
                            </p>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white border border-[#e4e4e7] border-l-4 border-l-[#dc2626] rounded-md p-4">
                              <h4 className="text-sm font-semibold text-[#0a0a0a] mb-3 flex items-center gap-2">
                                ❌ What You Did
                              </h4>
                              <ul className="space-y-2">
                                {(mbbReport.primary_pattern.what_you_did || []).map((item: string, index: number) => (
                                  <li key={index} className="text-sm text-[#52525b] leading-relaxed pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-[#71717a]">
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            
                            <div className="bg-white border border-[#e4e4e7] border-l-4 border-l-[#22c55e] rounded-md p-4">
                              <h4 className="text-sm font-semibold text-[#0a0a0a] mb-3 flex items-center gap-2">
                                ✅ What Winners Do
                              </h4>
                              <ul className="space-y-2">
                                {(mbbReport.primary_pattern.what_winners_do || []).map((item: string, index: number) => (
                                  <li key={index} className="text-sm text-[#52525b] leading-relaxed pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-[#71717a]">
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Detailed Timeline Moments */}
                    {mbbReport.unified_moments && (
                      <div>
                        <h2 className="text-lg font-semibold text-[#0a0a0a] mb-5">
                          Key Timeline Moments with AI Coaching
                        </h2>
                        
                        <div className="space-y-6">
                          {getFilteredMoments().map((moment: any, index: number) => (
                            <Card 
                              key={index} 
                              className="p-6 cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all duration-200"
                              onClick={() => {
                                // Parse timestamp (MM:SS format) to seconds
                                const parts = moment.timestamp.split(':').map(Number);
                                const originalTimestamp = parts.length === 2 ? parts[0] * 60 + parts[1] : 0;
                                
                                // Apply speaker-based buffer logic
                                const isFirstMessage = originalTimestamp === 0;
                                const correspondingEntry = transcript?.find((entry: any) => Math.abs(entry.timestamp - originalTimestamp) < 2);
                                const isUserMessage = correspondingEntry?.speaker === 'user';
                                
                                let bufferedTimestamp;
                                let bufferMessage;
                                
                                if (isFirstMessage) {
                                  bufferedTimestamp = originalTimestamp;
                                  bufferMessage = 'no buffer (first message)';
                                } else if (isUserMessage) {
                                  bufferedTimestamp = Math.max(0, originalTimestamp - 1);
                                  bufferMessage = '-1s buffer (user message)';
                                } else {
                                  bufferedTimestamp = originalTimestamp + 2;
                                  bufferMessage = '+2s buffer (AI message)';
                                }
                                
                                console.log("🎯 [MOMENT CARD CLICK] Seeking video:", {originalTimestamp, bufferedTimestamp, bufferMessage, speaker: correspondingEntry?.speaker});
                                
                                // Store timestamp for video component to pick up
                                sessionStorage.setItem('jumpToTimestamp', bufferedTimestamp.toString());
                                
                                // Try direct iframe manipulation if available
                                const iframe = document.querySelector('iframe[src*="cloudflarestream.com"]') as HTMLIFrameElement;
                                if (iframe && iframe.src.includes('cloudflarestream.com')) {
                                  const videoId = iframe.src.match(/cloudflarestream\.com\/([^\/]+)\/iframe/)?.[1];
                                  if (videoId) {
                                    const seekTime = Math.floor(bufferedTimestamp * 10) / 10;
                                    const newSrc = `https://customer-sm0204x4lu04ck3x.cloudflarestream.com/${videoId}/iframe?preload=metadata&controls=true&startTime=${seekTime}&autoplay=true`;
                                    iframe.src = newSrc;
                                    console.log("🎯 [MOMENT CARD DIRECT] Updated iframe src for seeking:", seekTime);
                                  }
                                }
                              }}
                            >
                              <div className="mb-4">
                                <Badge variant="outline" className="text-xs font-medium">
                                  {moment.timestamp}
                                </Badge>
                              </div>
                              
                              {/* Conversation Flow */}
                              <div className="space-y-3 mb-6">
                                <div className="bg-[#f0f9ff] border-l-4 border-l-[#3b82f6] p-3 rounded-r-md">
                                  <div className="text-xs font-semibold text-[#52525b] mb-1">You:</div>
                                  <div className="text-sm text-[#0a0a0a] leading-relaxed">
                                    "{moment.candidate_quote}"
                                  </div>
                                </div>
                                
                                {moment.interviewer_response && (
                                  <div className="bg-[#fafafa] border-l-4 border-l-[#71717a] p-3 rounded-r-md">
                                    <div className="text-xs font-semibold text-[#52525b] mb-1">Interviewer:</div>
                                    <div className="text-sm text-[#0a0a0a] leading-relaxed">
                                      "{moment.interviewer_response}"
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              {/* AI Coaching Analysis */}
                              <div className="bg-gradient-to-r from-[#fef3c7] to-[#fde68a] border border-[#fbbf24] rounded-md p-4">
                                <div className="text-xs font-bold text-[#92400e] tracking-wider mb-3">
                                  AI COACH ANALYSIS
                                </div>
                                <div className="space-y-3 text-sm text-[#451a03] leading-relaxed">
                                  <div>
                                    <strong className="text-[#92400e]">Critical Error:</strong> {moment.critical_error}
                                  </div>
                                  <div>
                                    <strong className="text-[#92400e]">Impact:</strong> {moment.impact}
                                  </div>
                                  <div>
                                    <strong className="text-[#92400e]">Better Response:</strong> "{moment.better_response}"
                                  </div>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Next Steps Tab */}
                {activeTab === 'nextsteps' && mbbReport && (
                  <div className="p-5">
                    <div className="mb-6">
                      <h2 className="text-lg font-semibold text-[#0a0a0a] mb-2">Your Path Forward</h2>
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800 font-medium">
                          📝 This is placeholder content for now. Transcript is available by default in the right panel.
                        </p>
                      </div>
                      <p className="text-sm text-[#71717a] leading-relaxed">
                        {mbbReport.next_steps}
                      </p>
                    </div>
                    
                    <div className="text-sm font-semibold text-[#3b82f6] uppercase tracking-wider mb-4">
                      Immediate Action Items
                    </div>
                    
                    <div className="space-y-3">
                      {[
                        { text: "Practice basic interview engagement and communication skills", priority: "high" },
                        { text: "Study case interview formats and practice responding to case setups", priority: "high" }, 
                        { text: "Work on managing interview anxiety and building confidence to participate", priority: "medium" }
                      ].map((action, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-[#fafafa] border border-[#e4e4e7] rounded-md">
                          <div className="w-4 h-4 border-2 border-[#d4d4d8] rounded flex-shrink-0 mt-0.5 cursor-pointer hover:border-[#22c55e] transition-colors" />
                          <div className="flex-1">
                            <div className="text-sm text-[#0a0a0a] leading-relaxed mb-1">
                              {action.text}
                          </div>
                            <div className={`inline-block text-xs font-medium px-2 py-1 rounded ${
                              action.priority === 'high' 
                                ? 'bg-[#fee2e2] text-[#dc2626]' 
                                : 'bg-[#fef3c7] text-[#d97706]'
                            }`}>
                              {action.priority === 'high' ? 'High Priority' : 'Medium Priority'}
                            </div>
                          </div>
                        </div>
                          ))}
                        </div>
                      </div>
                    )}

                {/* No Assessment Available */}
                {!mbbAssessment && !mbbReport && (
                  <div className="text-center py-12">
                    <div className="text-[#71717a] mb-4">📊 No MBB assessment available</div>
                    <p className="text-sm text-[#71717a]">
                      This session was completed before the MBB assessment system was implemented.
                    </p>
                    </div>
                  )}
                </div>
              </div>
              
          {/* Right Panel - Transcript */}
          {(
            <div className="lg:col-span-1 bg-white border border-[#e4e4e7] rounded-lg max-h-[600px] overflow-y-auto">
                <div className="p-4 border-b border-[#e4e4e7] flex justify-between items-center sticky top-0 bg-white z-10">
                  <h3 className="text-base font-semibold text-[#0a0a0a] flex items-center gap-2">
                    📄 Interview Transcript
                  </h3>
                  <div className="flex gap-2">
                <Button 
                      variant="ghost" 
                  size="sm"
                      onClick={() => downloadTranscript('txt')}
                      className="text-xs"
                    >
                      📄 TXT
                </Button>
                <Button 
                      variant="ghost" 
                  size="sm"
                      onClick={() => downloadTranscript('json')}
                      className="text-xs"
                    >
                      📊 JSON
                </Button>
                  </div>
                </div>
                <div className="flex-1 p-4">
                  {transcript ? (
                    <div className="space-y-3">
                      {(() => {
                        // Group consecutive messages by speaker for cleaner display
                        const groups: Array<{speaker: string, entries: any[], startIndex: number}> = [];
                        let currentGroup: {speaker: string, entries: any[], startIndex: number} | null = null;
                        
                        transcript.forEach((entry: any, index: number) => {
                          if (!currentGroup || currentGroup.speaker !== entry.speaker) {
                            if (currentGroup) groups.push(currentGroup);
                            currentGroup = { speaker: entry.speaker, entries: [entry], startIndex: index };
                          } else {
                            currentGroup.entries.push(entry);
                          }
                        });
                        if (currentGroup) groups.push(currentGroup);
                        
                        return groups.map((group, groupIndex) => {
                          const isUser = group.speaker === "user";
                          const speakerLabel = isUser ? "You" : "AI Interviewer";
                          const speakerIcon = isUser ? "👤" : "🤖";
                          
                          return (
                            <div key={groupIndex} className="space-y-2">
                              {/* Speaker heading */}
                              <div className="flex items-center gap-2 mt-4 first:mt-0">
                                <span className="text-lg">{speakerIcon}</span>
                                <h4 className={`text-sm font-medium ${isUser ? 'text-blue-700' : 'text-gray-700'}`}>
                                  {speakerLabel}
                                </h4>
                                <div className={`flex-1 h-px ${isUser ? 'bg-blue-200' : 'bg-gray-200'}`}></div>
                              </div>
                              
                              {/* Messages in this group */}
                              {group.entries.map((entry: any, entryIndex: number) => {
                                const timestamp = entry.timestamp !== undefined ? 
                                  `${Math.floor(entry.timestamp / 60).toString().padStart(2, '0')}:${(entry.timestamp % 60).toString().padStart(2, '0')}` : 
                                  '00:00';
                                
                                // Calculate absolute index in the transcript
                                const absoluteIndex = group.startIndex + entryIndex;
                                const isFirstMessage = absoluteIndex === 0;
                                
                                return (
                                  <div 
                                    key={group.startIndex + entryIndex} 
                                    className={`p-3 rounded-lg cursor-pointer transition-all hover:shadow-sm ${isUser ? 'bg-blue-50 border-l-2 border-blue-300 hover:bg-blue-100' : 'bg-gray-50 border-l-2 border-gray-300 hover:bg-gray-100'}`}
                                    onClick={() => {
                                      if (entry.timestamp && videoUrl && videoPlayerRef.current) {
                                        const originalTimestamp = entry.timestamp;
                                        const isUserMessage = entry.speaker === 'user';
                                        
                                        // Buffer logic: First message = no buffer, User messages = -2s buffer, AI messages = +2s buffer
                                        let bufferedTimestamp;
                                        let bufferMessage;
                                        
                                        if (isFirstMessage) {
                                          bufferedTimestamp = originalTimestamp; // No buffer for first message
                                          bufferMessage = 'no buffer (first message)';
                                        } else if (isUserMessage) {
                                          bufferedTimestamp = Math.max(0, originalTimestamp - 1); // Go back 2s for context
                                          bufferMessage = '-1s buffer (user message)';
                                        } else {
                                          bufferedTimestamp = originalTimestamp + 1; // Go forward 2s for AI messages
                                          bufferMessage = '+1s buffer (AI message)';
                                        }
                                        
                                        const seekTime = Math.floor(bufferedTimestamp * 10) / 10; // Keep one decimal place for precision
                                        console.log(`🎬 [SESSIONS] Seeking to ${originalTimestamp}s (${bufferMessage}) = ${seekTime}s using official startTime parameter`);
                                        
                                        // Extract video ID from URL
                                        const videoId = videoUrl.match(/cloudflarestream\.com\/([^\/]+)\/watch/)?.[1];
                                        if (videoId) {
                                          // Use official Cloudflare Stream startTime parameter with autoplay
                                          const newSrc = `https://customer-sm0204x4lu04ck3x.cloudflarestream.com/${videoId}/iframe?preload=metadata&controls=true&startTime=${seekTime}&autoplay=true`;
                                          videoPlayerRef.current.src = newSrc;
                                          console.log(`✅ [SESSIONS] Auto-playing at ${seekTime}s (${bufferMessage}) with startTime + autoplay`);
                                        }
                                      }
                                    }}
                                    title={entry.timestamp !== undefined ? `Click to jump to ${timestamp}` : 'Timestamp not available'}
                                  >
                                    <div className={`text-xs mb-1 font-mono ${entry.timestamp !== undefined ? 'text-blue-600 hover:text-blue-800' : 'text-gray-500'}`}>
                                      {timestamp} {entry.timestamp !== undefined && '🎬'}
                                    </div>
                                    <p className="text-sm text-gray-800 leading-relaxed">{entry.text}</p>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-12 text-gray-500">
                      <div className="text-center">
                        <p className="text-sm">No transcript available</p>
                        <p className="text-xs mt-1">Transcript will be generated after the interview</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
        </div>
        </div>

      {/* Session Documents - Full Width Below Main Content */}
      <div className="max-w-7xl mx-auto p-4 lg:p-6 mt-8">
          <SessionDocuments sessionId={sessionId} />
      </div>

      {/* Fallback to Old Analysis if No MBB Data */}
      {!mbbAssessment && !mbbReport && finalEvaluation && (
        <div className="max-w-7xl mx-auto p-4 lg:p-6 mt-8">
            <EnhancedDetailedAnalysis 
              evaluation={finalEvaluation}
              confidence={finalEvaluation?.confidence || 0}
            />
        </div>
      )}
    </div>
  );
}
