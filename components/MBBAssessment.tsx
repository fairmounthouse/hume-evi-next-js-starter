"use client";

import { useState, useEffect } from "react";
import { cn } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Star,
  Loader2,
  Brain,
  Calculator,
  Lightbulb,
  MessageSquare,
  Target,
  Download,
  RefreshCw
} from "lucide-react";

interface MBBDimension {
  dimension_name: string;
  score: number;
  feedback: string;
}

interface MBBAssessmentData {
  structure_problem_architecture: MBBDimension;
  analytical_rigor_quantitative_fluency: MBBDimension;
  insight_generation_business_acumen: MBBDimension;
  communication_precision_dialogue_management: MBBDimension;
  adaptive_thinking_intellectual_courage: MBBDimension;
  strengths_and_blockers: {
    biggest_strengths: string[];
    biggest_blockers: string[];
  };
  quick_summary: {
    what_helped: string;
    what_hurt: string;
    path_forward: string;
  };
  timestamp: number;
}

interface MBBAssessmentProps {
  transcript: any[];
  isLoading?: boolean;
  onRetry?: () => void;
  className?: string;
  mockMode?: boolean; // Add mock mode for testing
}

export default function MBBAssessment({ 
  transcript, 
  isLoading = false,
  onRetry,
  className,
  mockMode = false
}: MBBAssessmentProps) {
  const [assessment, setAssessment] = useState<MBBAssessmentData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Mock assessment data for testing
  const mockAssessmentData: MBBAssessmentData = {
    structure_problem_architecture: {
      dimension_name: "Structure & Problem Architecture",
      score: 4,
      feedback: "Strong MECE framework with clear revenue-cost breakdown and logical hypothesis generation"
    },
    analytical_rigor_quantitative_fluency: {
      dimension_name: "Analytical Rigor & Quantitative Fluency",
      score: 3,
      feedback: "Good quantitative reasoning on load factor impact but missed opportunity to size the full revenue impact"
    },
    insight_generation_business_acumen: {
      dimension_name: "Insight Generation & Business Acumen",
      score: 2,
      feedback: "Limited insights beyond standard framework - missed creative connections between passenger-miles and route strategy"
    },
    communication_precision_dialogue_management: {
      dimension_name: "Communication Precision & Dialogue Management",
      score: 4,
      feedback: "Excellent clarifying questions and clear articulation of hypotheses with logical flow"
    },
    adaptive_thinking_intellectual_courage: {
      dimension_name: "Adaptive Thinking & Intellectual Courage",
      score: 3,
      feedback: "Good adaptation when given load factor data but could have been more creative in hypothesis prioritization"
    },
    strengths_and_blockers: {
      biggest_strengths: [
        "Excellent clarifying questions that showed deep understanding of airline economics",
        "Strong quantitative analysis of load factor impact with clear mathematical reasoning",
        "Well-structured MECE framework covering both revenue and cost drivers systematically"
      ],
      biggest_blockers: [
        "Limited business intuition - missed the strategic implications of route mix changes",
        "Reactive rather than proactive - waited for data rather than driving the analysis direction",
        "Lack of creative insights beyond textbook airline profitability framework"
      ]
    },
    quick_summary: {
      what_helped: "Strong analytical foundation with excellent clarifying questions and systematic MECE framework application",
      what_hurt: "Limited business creativity and strategic thinking - analysis felt mechanical rather than insightful",
      path_forward: "Practice generating counter-intuitive business insights and developing stronger industry intuition through case pattern recognition"
    },
    timestamp: Date.now()
  };

  // Generate assessment when transcript changes
  useEffect(() => {
    if (transcript.length > 0 && !isLoading && !assessment) {
      if (mockMode) {
        // Use mock data in test mode
        setTimeout(() => {
          setAssessment(mockAssessmentData);
        }, 100);
      } else {
        generateAssessment();
      }
    }
  }, [transcript, isLoading, mockMode]);

  const buildTranscriptText = (messages: any[]) => {
    return messages
      .filter(msg => msg.speaker && msg.text)
      .map(msg => {
        const timestamp = msg.timestamp ? `[${msg.timestamp}]` : '';
        const speaker = msg.speaker === 'user' ? 'YOU:' : 'AI INTERVIEWER:';
        return `${timestamp} ${speaker} ${msg.text}`;
      })
      .join('\n');
  };

  const generateAssessment = async () => {
    if (transcript.length === 0) return;

    setIsGenerating(true);
    setError(null);

    try {
      const transcriptText = buildTranscriptText(transcript);
      
      if (transcriptText.trim().length < 50) {
        setError("Transcript too short for assessment");
        return;
      }

      const response = await fetch('/api/transcript/mbb_assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript_text: transcriptText
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Assessment failed');
      }

      const assessmentData = await response.json();
      setAssessment(assessmentData);
      
    } catch (error) {
      console.error('MBB Assessment error:', error);
      setError(error instanceof Error ? error.message : 'Assessment failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRetry = () => {
    setAssessment(null);
    setError(null);
    generateAssessment();
    onRetry?.();
  };

  const calculateAverageScore = (): number => {
    if (!assessment) return 0;
    const scores = [
      assessment.structure_problem_architecture.score,
      assessment.analytical_rigor_quantitative_fluency.score,
      assessment.insight_generation_business_acumen.score,
      assessment.communication_precision_dialogue_management.score,
      assessment.adaptive_thinking_intellectual_courage.score
    ];
    const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    return parseFloat(avg.toFixed(1));
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900";
    if (score >= 3) return "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900";
    return "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900";
  };

  const getAverageScoreColor = (avgScore: number) => {
    if (avgScore >= 4) return "text-green-600 dark:text-green-400";
    if (avgScore >= 3) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getDimensionIcon = (dimensionKey: string) => {
    switch (dimensionKey) {
      case 'structure_problem_architecture': return <Brain className="w-4 h-4" />;
      case 'analytical_rigor_quantitative_fluency': return <Calculator className="w-4 h-4" />;
      case 'insight_generation_business_acumen': return <Lightbulb className="w-4 h-4" />;
      case 'communication_precision_dialogue_management': return <MessageSquare className="w-4 h-4" />;
      case 'adaptive_thinking_intellectual_courage': return <Target className="w-4 h-4" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  const exportAssessment = () => {
    if (!assessment) return;
    
    const avgScore = calculateAverageScore();
    const reportText = `
MBB CASE INTERVIEW ASSESSMENT
Generated: ${new Date(assessment.timestamp).toLocaleString()}

OVERALL SCORE: ${avgScore}/5.0

DIMENSION SCORES:
• Structure & Problem Architecture: ${assessment.structure_problem_architecture.score}/5 - ${assessment.structure_problem_architecture.feedback}
• Analytical Rigor & Quantitative Fluency: ${assessment.analytical_rigor_quantitative_fluency.score}/5 - ${assessment.analytical_rigor_quantitative_fluency.feedback}
• Insight Generation & Business Acumen: ${assessment.insight_generation_business_acumen.score}/5 - ${assessment.insight_generation_business_acumen.feedback}
• Communication Precision & Dialogue Management: ${assessment.communication_precision_dialogue_management.score}/5 - ${assessment.communication_precision_dialogue_management.feedback}
• Adaptive Thinking & Intellectual Courage: ${assessment.adaptive_thinking_intellectual_courage.score}/5 - ${assessment.adaptive_thinking_intellectual_courage.feedback}

KEY STRENGTHS:
${assessment.strengths_and_blockers.biggest_strengths.map(s => `• ${s}`).join('\n')}

CRITICAL BLOCKERS:
${assessment.strengths_and_blockers.biggest_blockers.map(b => `• ${b}`).join('\n')}

SUMMARY:
What Helped: ${assessment.quick_summary.what_helped}
What Hurt: ${assessment.quick_summary.what_hurt}
Path Forward: ${assessment.quick_summary.path_forward}
    `;

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mbb-assessment-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading || isGenerating) {
    return (
      <Card className={cn("h-full flex items-center justify-center", className)}>
        <CardContent className="text-center p-8">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <h3 className="text-lg font-semibold mb-2">Generating MBB Assessment</h3>
          <p className="text-sm text-muted-foreground">
            Analyzing your case interview performance...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("h-full flex items-center justify-center", className)}>
        <CardContent className="text-center p-8">
          <AlertTriangle className="w-8 h-8 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold mb-2 text-red-600">Assessment Failed</h3>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={handleRetry} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry Assessment
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!assessment) {
    return (
      <Card className={cn("h-full flex items-center justify-center", className)}>
        <CardContent className="text-center p-8">
          <Brain className="w-8 h-8 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">MBB Assessment</h3>
          <p className="text-sm text-muted-foreground">
            Complete your interview to receive detailed MBB assessment
          </p>
        </CardContent>
      </Card>
    );
  }

  const avgScore = calculateAverageScore();
  const dimensions = [
    { key: 'structure_problem_architecture', data: assessment.structure_problem_architecture },
    { key: 'analytical_rigor_quantitative_fluency', data: assessment.analytical_rigor_quantitative_fluency },
    { key: 'insight_generation_business_acumen', data: assessment.insight_generation_business_acumen },
    { key: 'communication_precision_dialogue_management', data: assessment.communication_precision_dialogue_management },
    { key: 'adaptive_thinking_intellectual_courage', data: assessment.adaptive_thinking_intellectual_courage }
  ];

  return (
    <div className={cn("h-full flex flex-col", className)}>
      <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-lg font-bold">MBB Assessment</h2>
              <p className="text-xs text-muted-foreground">
                Generated {new Date(assessment.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={exportAssessment}>
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Overall Score */}
        <Card>
          <CardContent className="p-4 text-center">
            <div className={cn("text-3xl font-bold mb-2", getAverageScoreColor(avgScore))}>
              {avgScore}/5.0
            </div>
            <p className="text-sm text-muted-foreground">Overall MBB Readiness</p>
          </CardContent>
        </Card>

        {/* Dimension Scores */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Performance Dimensions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dimensions.map(({ key, data }) => (
              <div key={key} className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getDimensionIcon(key)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium truncate">{data.dimension_name}</h4>
                    <Badge className={cn("ml-2", getScoreColor(data.score))}>
                      {data.score}/5
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {data.feedback}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Strengths */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Key Strengths
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {assessment.strengths_and_blockers.biggest_strengths.map((strength, index) => (
              <div key={index} className="flex items-start gap-2">
                <TrendingUp className="w-3 h-3 text-green-600 mt-1 flex-shrink-0" />
                <span className="text-xs leading-relaxed">{strength}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Blockers */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              Critical Blockers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {assessment.strengths_and_blockers.biggest_blockers.map((blocker, index) => (
              <div key={index} className="flex items-start gap-2">
                <AlertTriangle className="w-3 h-3 text-red-600 mt-1 flex-shrink-0" />
                <span className="text-xs leading-relaxed">{blocker}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Summary & Next Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="text-xs font-semibold text-green-600 mb-1">What Helped</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {assessment.quick_summary.what_helped}
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-red-600 mb-1">What Hurt</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {assessment.quick_summary.what_hurt}
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-blue-600 mb-1">Path Forward</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {assessment.quick_summary.path_forward}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
