"use client";

import { useState } from "react";
import { cn } from "@/utils";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { motion, AnimatePresence } from "motion/react";
import { 
  FileText, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  User,
  Target,
  Lightbulb,
  X,
  Download,
  Loader2
} from "lucide-react";
import { FinalEvaluation } from "@/utils/feedbackTypes";

interface FinalEvaluationReportProps {
  evaluation: FinalEvaluation | null;
  isLoading?: boolean;
  onClose?: () => void;
  className?: string;
}

export default function FinalEvaluationReport({ 
  evaluation, 
  isLoading = false, 
  onClose,
  className 
}: FinalEvaluationReportProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "details">("overview");
  const [expandedFactor, setExpandedFactor] = useState<string | null>(null);

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900";
    if (score >= 6) return "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900";
    return "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900";
  };

  const getTotalScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getRecommendationColor = (recommendation: string) => {
    const lower = recommendation.toLowerCase();
    if (lower.includes("yes") || lower.includes("strong")) {
      return "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900";
    }
    if (lower.includes("maybe") || lower.includes("minor")) {
      return "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900";
    }
    return "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900";
  };

  const exportReport = () => {
    if (!evaluation) return;
    
    const reportText = `
INTERVIEW EVALUATION REPORT
Generated: ${new Date(evaluation.timestamp).toLocaleString()}

OVERALL SCORE: ${evaluation.summary.total_score}/100
CONFIDENCE: ${Math.round(evaluation.confidence * 100)}%
RECOMMENDATION: ${evaluation.summary.hiring_recommendation}

KEY STRENGTHS:
${evaluation.summary.key_strengths.map(s => `• ${s}`).join('\n')}

CRITICAL WEAKNESSES:
${evaluation.summary.critical_weaknesses.map(w => `• ${w}`).join('\n')}

IMMEDIATE ACTION ITEMS:
${evaluation.summary.immediate_action_items.map(a => `• ${a}`).join('\n')}

DETAILED FACTORS:
${evaluation.factors.map(factor => `
${factor.factor_name} (Score: ${factor.score}/10)
Strength: ${factor.strength}
Weaknesses: ${factor.weakness.join(', ')}
Feedback: ${factor.feedback.join(', ')}
`).join('\n')}
    `;

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-evaluation-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          "fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center",
          className
        )}
      >
        <Card className="w-full max-w-md p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <h3 className="text-lg font-semibold mb-2">Generating Final Evaluation</h3>
          <p className="text-sm text-muted-foreground">
            This may take up to 2 minutes. Please wait while we analyze your complete interview performance.
          </p>
        </Card>
      </motion.div>
    );
  }

  if (!evaluation) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4",
        className
      )}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-bold">Final Interview Evaluation</h2>
                <p className="text-sm text-muted-foreground">
                  Generated on {new Date(evaluation.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={exportReport}>
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
              {onClose && (
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex">
            <button
              onClick={() => setActiveTab("overview")}
              className={cn(
                "px-6 py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === "overview"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("details")}
              className={cn(
                "px-6 py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === "details"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Detailed Analysis
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {/* Score Summary */}
                <Card className="p-6">
                  <div className="text-center mb-6">
                    <div className={cn("text-4xl font-bold mb-2", getTotalScoreColor(evaluation.summary.total_score))}>
                      {evaluation.summary.total_score}/100
                    </div>
                    <p className="text-muted-foreground">Overall Interview Score</p>
                    <Badge className={cn("mt-2", getRecommendationColor(evaluation.summary.hiring_recommendation))}>
                      {evaluation.summary.hiring_recommendation}
                    </Badge>
                  </div>

                  {/* Factor Scores */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {evaluation.factors.map((factor, index) => (
                      <div key={index} className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                        <div className={cn("text-lg font-semibold", getScoreColor(factor.score).split(' ')[0])}>
                          {factor.score}/10
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {factor.factor_name}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Key Strengths */}
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg font-semibold">Key Strengths</h3>
                  </div>
                  <ul className="space-y-2">
                    {evaluation.summary.key_strengths.map((strength, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <TrendingUp className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </Card>

                {/* Critical Weaknesses */}
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <h3 className="text-lg font-semibold">Critical Weaknesses</h3>
                  </div>
                  <ul className="space-y-2">
                    {evaluation.summary.critical_weaknesses.map((weakness, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </Card>

                {/* Action Items */}
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold">Immediate Action Items</h3>
                  </div>
                  <ul className="space-y-2">
                    {evaluation.summary.immediate_action_items.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </motion.div>
            )}

            {activeTab === "details" && (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {evaluation.factors.map((factor, index) => (
                  <Card key={index} className="overflow-hidden">
                    <div
                      className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      onClick={() => setExpandedFactor(
                        expandedFactor === factor.factor_name ? null : factor.factor_name
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge className={getScoreColor(factor.score)}>
                            {factor.score}/10
                          </Badge>
                          <h3 className="font-semibold">{factor.factor_name}</h3>
                        </div>
                        <motion.div
                          animate={{ rotate: expandedFactor === factor.factor_name ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </motion.div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {expandedFactor === factor.factor_name && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-t border-gray-200 dark:border-gray-700"
                        >
                          <div className="p-4 space-y-4">
                            {/* Strength */}
                            <div>
                              <h4 className="font-medium text-green-600 mb-1">Strength</h4>
                              <p className="text-sm text-muted-foreground">{factor.strength}</p>
                            </div>

                            {/* Weaknesses */}
                            {factor.weakness.length > 0 && (
                              <div>
                                <h4 className="font-medium text-red-600 mb-1">Weaknesses</h4>
                                <ul className="text-sm text-muted-foreground space-y-1">
                                  {factor.weakness.map((weakness, i) => (
                                    <li key={i}>• {weakness}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Feedback */}
                            {factor.feedback.length > 0 && (
                              <div>
                                <h4 className="font-medium text-blue-600 mb-1">Feedback</h4>
                                <ul className="text-sm text-muted-foreground space-y-1">
                                  {factor.feedback.map((feedback, i) => (
                                    <li key={i}>• {feedback}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Specific Examples */}
                            {factor.specific_example.length > 0 && (
                              <div>
                                <h4 className="font-medium text-purple-600 mb-2">Specific Examples</h4>
                                <div className="space-y-3">
                                  {factor.specific_example.map((example, i) => (
                                    <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Clock className="w-3 h-3 text-muted-foreground" />
                                        <span className="text-xs text-muted-foreground">{example.timestamp}</span>
                                      </div>
                                      <blockquote className="text-sm italic mb-2 pl-3 border-l-2 border-gray-300 dark:border-gray-600">
                                        "{example.quote}"
                                      </blockquote>
                                      <div className="text-xs space-y-1">
                                        <div><span className="font-medium text-red-600">Issue:</span> {example.issue}</div>
                                        <div><span className="font-medium text-green-600">Better approach:</span> {example.better_approach}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
