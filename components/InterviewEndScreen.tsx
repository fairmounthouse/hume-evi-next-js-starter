"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { Timeline, VerticalTimeline } from "./ui/timeline";
import { Star } from "lucide-react";

interface DimensionScore {
  score: number;
  feedback: string;
}

interface DetailedEvaluation {
  structure_problem_architecture: DimensionScore;
  analytical_rigor_quantitative_fluency: DimensionScore;
  insight_generation_business_acumen: DimensionScore;
  communication_precision_dialogue_management: DimensionScore;
  adaptive_thinking_intellectual_courage: DimensionScore;
  
  strengths_and_blockers: {
    biggest_strengths: string[];
    biggest_blockers: string[];
  };
  
  quick_summary: {
    what_helped: string;
    what_hurt: string;
    path_forward: string;
  };
}

interface MBBDetailedReport {
  verdict: string;
  analysis_summary: string;
  next_steps: string;
  unified_moments: Array<{
    timestamp: string;
    category: 'Critical Issues' | 'Warnings' | 'Positive Moments';
    title: string;
    description: string;
    candidate_quote: string;
    interviewer_response: string;
    ai_coach_analysis: string;
    critical_error: string;
    impact: string;
    better_response: string;
  }>;
  primary_pattern: {
    pattern_name: string;
    instance_count: number;
    description: string;
    what_you_did: string[];
    what_winners_do: string[];
  };
  timestamp: number;
}

interface InterviewEndScreenProps {
  sessionId: string;
  duration: string;
  messageCount: number;
  hasRecording: boolean;
  hasTranscript: boolean;
  finalVideoUrl?: string;
  detailedEvaluation?: DetailedEvaluation;
  transcriptText?: string; // Keep for backward compatibility
  transcript?: any[]; // NEW: Structured transcript array (preferred)
  onStartNewInterview: () => void;
  onViewTranscript: () => void;
  onViewDashboard: () => void;
}

const dimensionLabels = {
  structure_problem_architecture: "Structure & Problem Architecture",
  analytical_rigor_quantitative_fluency: "Analytical Rigor & Quantitative Fluency", 
  insight_generation_business_acumen: "Insight Generation & Business Acumen",
  communication_precision_dialogue_management: "Communication Precision & Dialogue Management",
  adaptive_thinking_intellectual_courage: "Adaptive Thinking & Intellectual Courage"
};

export default function InterviewEndScreen({
  sessionId,
  duration,
  messageCount,
  hasRecording,
  hasTranscript,
  finalVideoUrl,
  detailedEvaluation,
  transcriptText,
  transcript, // NEW: Structured transcript array
  onStartNewInterview,
  onViewTranscript,
  onViewDashboard
}: InterviewEndScreenProps) {
  const [activeTab, setActiveTab] = useState<'verdict' | 'analysis' | 'nextsteps'>('verdict');
  const [mbbReport, setMbbReport] = useState<MBBDetailedReport | null>(null);
  const [isLoadingMbbReport, setIsLoadingMbbReport] = useState(false);
  const [mbbReportError, setMbbReportError] = useState<string | null>(null);
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'critical' | 'warning' | 'positive'>('all');
  
  // Ref for video iframe control (same as sessions page)
  const videoPlayerRef = useRef<HTMLIFrameElement>(null);

  const [mbbAssessment, setMbbAssessment] = useState<any | null>(null);
  const [isLoadingMbbAssessment, setIsLoadingMbbAssessment] = useState(false);

  // Check for cached MBB data on component mount and listen for real-time updates
  useEffect(() => {
    // Check for cached MBB Report
    const cachedReport = sessionStorage.getItem(`mbb_report_${sessionId}`);
    if (cachedReport) {
      try {
        const reportData = JSON.parse(cachedReport);
        setMbbReport(reportData);
        console.log("✅ [CACHE] Loaded MBB Report from cache");
      } catch (error) {
        console.warn("⚠️ [CACHE] Failed to parse cached MBB Report");
      }
    } else {
      setIsLoadingMbbReport(true);
    }

    // Check for cached MBB Assessment first, then database
    const cachedAssessment = sessionStorage.getItem(`mbb_assessment_${sessionId}`);
    if (cachedAssessment) {
      try {
        const assessmentData = JSON.parse(cachedAssessment);
        setMbbAssessment(assessmentData);
        console.log("✅ [CACHE] Loaded MBB Assessment from cache");
      } catch (error) {
        console.warn("⚠️ [CACHE] Failed to parse cached MBB Assessment");
      }
    } else {
      // Try loading from database
      loadMbbAssessmentFromDatabase();
    }

    // Listen for real-time MBB Report updates
    const handleMbbReportReady = (event: CustomEvent) => {
      if (event.detail.sessionId === sessionId) {
        console.log("✅ [REALTIME] MBB Report ready, updating UI");
        setMbbReport(event.detail.data);
        setIsLoadingMbbReport(false);
        setMbbReportError(null);
      }
    };

    // Listen for real-time MBB Assessment updates
    const handleMbbAssessmentReady = (event: CustomEvent) => {
      if (event.detail.sessionId === sessionId) {
        console.log("✅ [REALTIME] MBB Assessment ready, updating UI");
        setMbbAssessment(event.detail.data);
        setIsLoadingMbbAssessment(false);
      }
    };

    window.addEventListener('mbb-report-ready', handleMbbReportReady as EventListener);
    window.addEventListener('mbb-assessment-ready', handleMbbAssessmentReady as EventListener);

    return () => {
      window.removeEventListener('mbb-report-ready', handleMbbReportReady as EventListener);
      window.removeEventListener('mbb-assessment-ready', handleMbbAssessmentReady as EventListener);
    };
  }, [sessionId]);

  // Load MBB assessment from database
  const loadMbbAssessmentFromDatabase = async () => {
    setIsLoadingMbbAssessment(true);
    
    try {
      const response = await fetch(`/api/sessions/get-mbb-assessment?sessionId=${sessionId}`);
      const result = await response.json();
      
              if (result.success && result.mbbAssessment) {
          setMbbAssessment(result.mbbAssessment);
          console.log("✅ [DATABASE] Loaded MBB Assessment from database");
          
          // Cache it for future use
          sessionStorage.setItem(`mbb_assessment_${sessionId}`, JSON.stringify(result.mbbAssessment));
        } else {
          console.log("ℹ️ [DATABASE] No MBB Assessment found in database");
        }
        
        // Also load MBB Report from database
        if (result.success && result.mbbReport) {
          setMbbReport(result.mbbReport);
          console.log("✅ [DATABASE] Loaded MBB Report from database");
          
          // Cache it for future use
          sessionStorage.setItem(`mbb_report_${sessionId}`, JSON.stringify(result.mbbReport));
        } else {
          console.log("ℹ️ [DATABASE] No MBB Report found in database");
          
          // Fallback to sessionStorage for backward compatibility
          const cachedReport = sessionStorage.getItem(`mbb_report_${sessionId}`);
          if (cachedReport) {
            try {
              const reportData = JSON.parse(cachedReport);
              setMbbReport(reportData);
              console.log("✅ [CACHE] Loaded MBB Report from sessionStorage fallback");
            } catch (error) {
              console.warn("⚠️ [CACHE] Failed to parse cached MBB Report");
            }
          }
        }
    } catch (error) {
      console.error("❌ [DATABASE] Failed to load MBB Assessment from database:", error);
    } finally {
      setIsLoadingMbbAssessment(false);
    }
  };

  // Load detailed MBB report when Analysis tab is accessed (fallback if not cached)
  useEffect(() => {
    if (activeTab === 'analysis' && !mbbReport && !isLoadingMbbReport && transcriptText && transcriptText.length >= 100) {
      loadMbbReport();
    }
  }, [activeTab, transcriptText, mbbReport, isLoadingMbbReport]);

  const loadMbbReport = async () => {
    if (!transcriptText) return;
    
    setIsLoadingMbbReport(true);
    setMbbReportError(null);
    
    try {
      
      // Check if this is a test page - use mock data for immediate results
      const pathname = window.location.pathname;
      const isTestPage = pathname.includes('test-end-screen') || pathname.includes('test-error-fix');
      
      if (isTestPage) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { mockMBBReport, mockSuccessfulMBBReport } = await import("@/utils/mockData");
        const params = new URLSearchParams(window.location.search);
        const mockParam = params.get('mock');
        // Default to SUCCESS unless explicitly overridden with ?mock=failure
        const useSuccessData = mockParam ? mockParam !== 'failure' : true;
        const mockReport = useSuccessData ? mockSuccessfulMBBReport : mockMBBReport;
        
        setMbbReport(mockReport as MBBDetailedReport);
        return;
      }
      
      // Real API call for production
      const response = await fetch('/api/transcript/mbb_report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript_text: transcriptText })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const report = await response.json();
      setMbbReport(report);
    } catch (error) {
      setMbbReportError(error instanceof Error ? error.message : "Failed to load detailed analysis");
    } finally {
      setIsLoadingMbbReport(false);
    }
  };

  // Calculate overall score from MBB Assessment
  const calculateOverallScore = (): number => {
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
    if (!mbbReport || !mbbReport.unified_moments || !Array.isArray(mbbReport.unified_moments)) return [];
    if (timelineFilter === 'all') return mbbReport.unified_moments;
    
    return mbbReport.unified_moments.filter(moment => {
      const type = getMomentType(moment.category);
      return type === timelineFilter;
    });
  };

  const getMomentCounts = () => {
    const moments = Array.isArray(mbbReport?.unified_moments) ? mbbReport!.unified_moments : [];
    const counts = { all: moments.length, critical: 0, warning: 0, positive: 0 } as Record<'all' | 'critical' | 'warning' | 'positive', number>;
    moments.forEach(moment => {
      const type = getMomentType(moment.category);
      if (type === 'critical' || type === 'warning' || type === 'positive') {
        counts[type]++;
      }
    });
    return counts;
  };

  const overallScore = calculateOverallScore();
  const verdict = getVerdict(overallScore);

  // Add download transcript functionality to the InterviewEndScreen
  const downloadTranscript = async (format: 'txt' | 'json' = 'txt') => {
    if (!transcriptText) {
      console.warn("No transcript available for download");
      return;
    }

    try {
      if (format === 'json') {
        // Create comprehensive JSON format
        const transcriptLines = transcriptText.split('\n').filter(line => line.trim());
        const entries = transcriptLines.map((line, index) => {
          const timeMatch = line.match(/\[([^\]]+)\]/);
          const timestamp = timeMatch ? timeMatch[1] : '00:00';
          const isUser = line.includes('YOU:');
          const speaker = isUser ? 'user' : 'assistant';
          const text = line.replace(/\[[^\]]+\]/, '').replace(/^(YOU:|AI INTERVIEWER:)/, '').trim();
          
          return {
            id: `entry-${index}`,
            speaker,
            text,
            timestamp,
            _originalLine: line
          };
        });

        const jsonData = {
          session_id: sessionId,
          created_at: new Date().toISOString(),
          entries: entries,
          metadata: {
            total_entries: entries.length,
            user_messages: entries.filter(e => e.speaker === 'user').length,
            assistant_messages: entries.filter(e => e.speaker === 'assistant').length,
            format: 'complete_transcript'
          }
        };

        const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `interview-transcript-${sessionId}.json`;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // Create text format - use the full transcript text as-is
        const blob = new Blob([transcriptText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `interview-transcript-${sessionId}.txt`;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      console.log(`✅ Transcript downloaded successfully (${format} format)`);
    } catch (error) {
      console.error("Error downloading transcript:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#0a0a0a] font-sans leading-relaxed">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-[#fafafa] border-b border-[#e4e4e7]">
        <div className="max-w-7xl mx-auto p-4 lg:p-6">
          <div className="bg-white border border-[#e4e4e7] rounded-lg p-4 lg:p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold text-[#0a0a0a]">Interview Complete</h1>
            <span className="text-sm text-[#71717a]">Session ID: {sessionId}</span>
          </div>
          <div className="flex flex-wrap gap-2">

            <Button 
              variant="outline" 
              size="sm"
              onClick={() => downloadTranscript('txt')}
              disabled={!hasTranscript}
              className="flex items-center gap-2"
            >
              📄 Download Transcript
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onViewDashboard}
              className="flex items-center gap-2"
            >
              🏠 Dashboard
            </Button>
            <Button 
              size="sm" 
              onClick={onStartNewInterview}
              className="flex items-center gap-2 bg-[#0a0a0a] hover:bg-[#27272a]"
            >
              Start New Interview
            </Button>
          </div>
          </div>
        </div>
      </div>

      {/* Main Content with top padding for fixed header */}
      {/* On xl screens add left/right padding equal to sidebar widths so the whole *page* can scroll while the sidebars remain fixed. */}
      <div className="pt-32 lg:pt-36 xl:pl-[22rem] xl:pr-[22rem]">
        <div className="max-w-7xl mx-auto p-4 lg:p-6">
          <div className="flex flex-col xl:flex-row gap-4 lg:gap-6">
            {/* Left Panel - Fixed on large screens */}
            <div className="w-full xl:w-96 xl:flex-shrink-0 xl:fixed xl:left-4 xl:top-36 xl:bottom-4 xl:overflow-y-auto">
            <div className="bg-white border border-[#e4e4e7] rounded-lg p-4 mb-4 h-fit">
              <h3 className="text-sm font-semibold text-[#0a0a0a] mb-3 flex items-center gap-2">
                🎥 Interview Recording
              </h3>
              
              <div className="relative rounded-md overflow-hidden bg-black aspect-video mb-3">
                {finalVideoUrl ? (
                  <iframe
                    ref={videoPlayerRef}
                    src={finalVideoUrl.replace('/watch', '/iframe')}
                    className="w-full h-full aspect-video"
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
                    <span className="text-xs">{duration}</span>
                  </div>
                )}
              </div>
              
              <h4 className="text-sm font-semibold text-[#0a0a0a] mb-3 mt-4 flex items-center gap-2">
                👤 Session Summary
              </h4>
              
              <div className="space-y-1">
                <div className="flex justify-between items-center py-1">
                  <span className="text-xs text-[#71717a]">Duration:</span>
                  <span className="text-xs font-medium text-[#0a0a0a]">{duration}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-xs text-[#71717a]">Messages:</span>
                  <span className="text-xs font-medium text-[#0a0a0a]">{messageCount} exchanges</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-xs text-[#71717a]">Recording:</span>
                  <span className={`text-xs font-medium flex items-center gap-1 ${hasRecording ? 'text-[#22c55e]' : 'text-[#f59e0b]'}`}>
                    {hasRecording ? '✅ Available' : '🔄 Processing...'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Panel - Main Content */}
          {/* Remove large margins – the xl padding on the parent already creates the gap. */}
          <div className="flex-1 bg-white border border-[#e4e4e7] rounded-lg max-w-5xl mx-auto max-h-[calc(100vh-10rem)] overflow-y-auto xl:fixed xl:top-36 xl:left-[26rem] xl:right-[26rem]">
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
              {activeTab === 'verdict' && (
                <div>
                  {/* Loading State */}
                  {isLoadingMbbAssessment && !mbbAssessment && (
                    <div className="text-center py-12">
                      <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                      <h3 className="text-lg font-semibold mb-2">Generating Assessment</h3>
                      <p className="text-sm text-muted-foreground">
                        Analyzing your performance across 5 MBB dimensions...
                      </p>
                    </div>
                  )}

                  {/* Assessment Results */}
                  {mbbAssessment && (
                    <div>
                  {/* Overall Score */}
                  <div className="text-center py-8 mb-6 border-b border-[#e4e4e7]">
                    <div className="flex flex-col items-center gap-3">
                      {(() => {
                        const filledStars = Math.round(overallScore);
                        const stars = [];
                        
                        for (let i = 1; i <= 5; i++) {
                          stars.push(
                            <Star
                              key={i}
                              className={`w-8 h-8 ${
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
                    </div>
                  )}
                </div>
              )}

              {/* Analysis Tab */}
              {(activeTab as string) === 'analysis' && (
                <div>
                  {isLoadingMbbReport ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0a0a0a] mx-auto mb-4"></div>
                      <h3 className="text-lg font-semibold text-[#0a0a0a] mb-2">Generating Detailed Analysis</h3>
                      <p className="text-[#71717a] text-sm">
                        This comprehensive analysis takes 30-60 seconds...
                      </p>
                    </div>
                  ) : mbbReportError ? (
                    <div className="text-center py-12">
                      <div className="text-[#dc2626] mb-4 text-2xl">⚠️</div>
                      <h3 className="text-lg font-semibold text-[#dc2626] mb-2">Analysis Failed</h3>
                      <p className="text-[#71717a] text-sm mb-4">{mbbReportError}</p>
                      <Button onClick={loadMbbReport} size="sm">
                        Retry Analysis
                      </Button>
                    </div>
                  ) : mbbReport ? (
                    <div className="space-y-8">
                      {/* Analysis Summary */}
                      <div className="bg-[#fef3c7] border border-[#fbbf24] rounded-md p-4 flex items-start gap-3">
                        <div className="text-xl flex-shrink-0">⚠️</div>
                        <div className="text-sm text-[#92400e] leading-relaxed">
                          <strong>Analysis Summary:</strong> {mbbReport.analysis_summary}
                        </div>
                      </div>

                      {/* Critical Moments Timeline */}
                      <div>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-5">
                          <h2 className="text-lg font-semibold text-[#0a0a0a]">Critical Moments Timeline</h2>
                          <div className="flex items-center gap-2 flex-wrap">
                            {(['all', 'critical', 'warning', 'positive'] as const).map((filter) => {
                              const counts = getMomentCounts();
                              const count = counts[filter];
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
                                  {filter.charAt(0).toUpperCase() + filter.slice(1)} ({count})
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Use Timeline component for desktop, VerticalTimeline for mobile */}
                        <div className="block lg:hidden">
                          <VerticalTimeline 
                            events={getFilteredMoments()
                              .sort((a, b) => {
                                // Parse timestamps (MM:SS format) for proper sorting
                                const parseTime = (timeStr: string) => {
                                  const parts = timeStr.split(':').map(Number);
                                  return parts.length === 2 ? parts[0] * 60 + parts[1] : 0;
                                };
                                return parseTime(a.timestamp) - parseTime(b.timestamp);
                              })
                              .map(moment => ({
                                timestamp: moment.timestamp,
                                title: moment.title,
                                description: moment.description,
                                type: getMomentType(moment.category)
                              }))}
                            transcript={transcript}
                            onSeekVideo={(timestamp) => {
                              console.log("🎯 [VERTICAL TIMELINE] Seeking video to:", timestamp);
                              // Store timestamp for video component to pick up
                              sessionStorage.setItem('seekToTimestamp', timestamp.toString());
                              // Trigger custom event for video components to listen to
                              window.dispatchEvent(new CustomEvent('seekToTimestamp', { 
                                detail: { timestamp } 
                              }));
                            }}
                          />
                        </div>
                        
                        <div className="hidden lg:block">
                          <Timeline 
                            events={getFilteredMoments()
                              .sort((a, b) => {
                                // Parse timestamps (MM:SS format) for proper sorting
                                const parseTime = (timeStr: string) => {
                                  const parts = timeStr.split(':').map(Number);
                                  return parts.length === 2 ? parts[0] * 60 + parts[1] : 0;
                                };
                                return parseTime(a.timestamp) - parseTime(b.timestamp);
                              })
                              .map(moment => ({
                                timestamp: moment.timestamp,
                                title: moment.title,
                                description: moment.description,
                                type: getMomentType(moment.category)
                              }))}
                            transcript={transcript}
                            onSeekVideo={(timestamp) => {
                              console.log("🎯 [TIMELINE] Seeking video to:", timestamp);
                              // Store timestamp for video component to pick up
                              sessionStorage.setItem('seekToTimestamp', timestamp.toString());
                              // Trigger custom event for video components to listen to
                              window.dispatchEvent(new CustomEvent('seekToTimestamp', { 
                                detail: { timestamp } 
                              }));
                            }}
                          />
                        </div>
                      </div>

                      {/* Primary Pattern Analysis */}
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
                                {(mbbReport.primary_pattern.what_you_did || []).map((item, index) => (
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
                                {(mbbReport.primary_pattern.what_winners_do || []).map((item, index) => (
                                  <li key={index} className="text-sm text-[#52525b] leading-relaxed pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-[#71717a]">
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Transcript Moments with AI Coaching */}
                      <div>
                        <h2 className="text-lg font-semibold text-[#0a0a0a] mb-5">
                          Key Transcript Moments with AI Coaching
                        </h2>
                        
                        <div className="space-y-6">
                          {(Array.isArray(mbbReport.unified_moments) ? mbbReport.unified_moments : []).map((moment, index) => (
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
                                
                                console.log("🎯 [END SCREEN MOMENT CARD CLICK] Seeking video:", {originalTimestamp, bufferedTimestamp, bufferMessage, speaker: correspondingEntry?.speaker});
                                
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
                                    console.log("🎯 [END SCREEN MOMENT CARD DIRECT] Updated iframe src for seeking:", seekTime);
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
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-[#71717a] mb-4">
                        📊 Click to generate detailed analysis
                      </div>
                      <Button onClick={loadMbbReport} disabled={!transcriptText || transcriptText.length < 100}>
                        Generate Detailed Analysis
                      </Button>
                      {transcriptText && transcriptText.length < 100 && (
                        <p className="text-sm text-[#71717a] mt-2">
                          Transcript too short for detailed analysis (minimum 100 characters)
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Next Steps Tab */}
              {(activeTab as string) === 'nextsteps' && (
                <div className="p-5">
                  {mbbReport ? (
                    <div>
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

                      <div className="mt-8 pt-8 border-t border-[#e4e4e7]">
                        <h3 className="text-base font-semibold text-[#0a0a0a] mb-4">Recommended Resources</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {[
                            { icon: "📚", name: "Case Interview Basics", desc: "Start with fundamental frameworks" },
                            { icon: "🎯", name: "Data Interpretation", desc: "Practice reading charts and exhibits" },
                            { icon: "💬", name: "Professional Communication", desc: "Learn to accept feedback gracefully" }
                          ].map((resource, index) => (
                            <div key={index} className="bg-white border border-[#e4e4e7] rounded-md p-4 text-center transition-all duration-200 hover:transform hover:-translate-y-1 hover:shadow-lg cursor-pointer">
                              <div className="text-2xl mb-2">{resource.icon}</div>
                              <div className="text-sm font-semibold text-[#0a0a0a] mb-1">{resource.name}</div>
                              <div className="text-xs text-[#71717a]">{resource.desc}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-sm font-semibold text-[#3b82f6] uppercase tracking-wider mb-4">
                        Action Items
                      </div>
                      
                      <div className="space-y-3">
                        {[
                          "Practice basic interview engagement and communication skills",
                          "Study case interview formats and practice responding to case setups", 
                          "Work on managing interview anxiety and building confidence to participate"
                        ].map((action, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-[#fafafa] border border-[#e4e4e7] rounded-md">
                            <div className="w-4 h-4 border-2 border-[#d4d4d8] rounded flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-[#0a0a0a] leading-relaxed">
                              {action}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* No Evaluation State - removed redundant text */}
              {activeTab === 'verdict' && !detailedEvaluation && !mbbAssessment && !isLoadingMbbAssessment && (
                <div className="text-center py-12">
                  <div className="text-[#71717a] mb-4">
                    📊 Assessment will load automatically
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Transcript */}
          {(
            <div className="w-full xl:w-80 xl:flex-shrink-0 xl:fixed xl:right-4 xl:top-36 xl:bottom-4 xl:overflow-y-auto bg-white border border-[#e4e4e7] rounded-lg">
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
                  {(transcript || transcriptText) ? (
                    <div className="space-y-3">
                      {(() => {
                        // Use structured transcript if available, otherwise parse transcriptText
                        const transcriptData = transcript || (transcriptText ? 
                          transcriptText.split('\n').filter(line => line.trim()).map((line, index) => {
                            const isUser = line.includes('YOU:');
                            const timeMatch = line.match(/\[([^\]]+)\]/);
                            const timestamp = timeMatch ? timeMatch[1] : '';
                            const content = line.replace(/\[[^\]]+\]/, '').replace(/^(YOU:|AI INTERVIEWER:)/, '').trim();
                            
                            // Convert MM:SS timestamp to seconds for video seeking
                            const [mins, secs] = timestamp.split(':').map(Number);
                            const timestampSeconds = (mins || 0) * 60 + (secs || 0);
                            
                            return {
                              id: `entry-${index}`,
                              speaker: isUser ? 'user' : 'assistant',
                              text: content,
                              timestamp: timestampSeconds
                            };
                          }) : []);
                        
                        // Group consecutive messages by speaker for cleaner display (same as sessions page)
                        const groups: Array<{speaker: string, entries: any[], startIndex: number}> = [];
                        let currentGroup: {speaker: string, entries: any[], startIndex: number} | null = null;
                        
                        transcriptData.forEach((entry: any, index: number) => {
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
                              
                              {/* Messages in this group - CLICKABLE like sessions page */}
                              {group.entries.map((entry: any, entryIndex: number) => {
                                const timestamp = entry.timestamp !== undefined ? 
                                  `${Math.floor(entry.timestamp / 60).toString().padStart(2, '0')}:${(entry.timestamp % 60).toString().padStart(2, '0')}` : 
                                  '00:00';
                                
                                // Calculate absolute index in the transcript
                                const absoluteIndex = group.startIndex + entryIndex;
                                const isFirstMessage = absoluteIndex === 0;
                                const isUserMessage = entry.speaker === 'user';
                                
                                return (
                                  <div 
                                    key={group.startIndex + entryIndex} 
                                    className={`p-3 rounded-lg cursor-pointer transition-all hover:shadow-sm ${isUser ? 'bg-blue-50 border-l-2 border-blue-300 hover:bg-blue-100' : 'bg-gray-50 border-l-2 border-gray-300 hover:bg-gray-100'}`}
                                    onClick={() => {
                                      if (entry.timestamp !== undefined && finalVideoUrl && videoPlayerRef.current) {
                                        const originalTimestamp = entry.timestamp;
                                        
                                        // Same buffer logic as sessions page: First = no buffer, User = -2s, AI = +2s
                                        let bufferedTimestamp;
                                        let bufferMessage;
                                        
                                        if (isFirstMessage) {
                                          bufferedTimestamp = originalTimestamp; // No buffer for first message
                                          bufferMessage = 'no buffer (first message)';
                                        } else if (isUserMessage) {
                                          bufferedTimestamp = Math.max(0, originalTimestamp - 1); // Go back 1s for context
                                          bufferMessage = '-1s buffer (user message)';
                                        } else {
                                          bufferedTimestamp = originalTimestamp + 1; // Go forward 1s for AI messages
                                          bufferMessage = '+1s buffer (AI message)';
                                        }
                                        
                                        const seekTime = Math.floor(bufferedTimestamp * 10) / 10;
                                        console.log(`🎬 [END_SCREEN] Seeking to ${originalTimestamp}s (${bufferMessage}) = ${seekTime}s using official startTime parameter`);
                                        
                                        // Extract video ID from URL (same logic as sessions page)
                                        const videoId = finalVideoUrl.match(/cloudflarestream\.com\/([^\/]+)\/watch/)?.[1];
                                        if (videoId) {
                                          const newSrc = `https://customer-sm0204x4lu04ck3x.cloudflarestream.com/${videoId}/iframe?preload=metadata&controls=true&startTime=${seekTime}&autoplay=true`;
                                          videoPlayerRef.current.src = newSrc;
                                          console.log(`✅ [END_SCREEN] Auto-playing at ${seekTime}s (${bufferMessage}) with startTime + autoplay`);
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
      </div>
    </div>
  );
}
