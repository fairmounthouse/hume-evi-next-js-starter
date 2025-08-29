"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { cn } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertCircle, XCircle, Loader2 } from "lucide-react";
import { InInterviewFeedback } from "@/utils/feedbackTypes";

interface FeedbackDisplayProps {
  className?: string;
}

export interface FeedbackDisplayRef {
  updateFeedback: (feedback: InInterviewFeedback) => void;
  startTimer: () => void;
  stopTimer: () => void;
}

const FeedbackDisplay = forwardRef<FeedbackDisplayRef, FeedbackDisplayProps>(({ className }, ref) => {
  const [feedback, setFeedback] = useState<InInterviewFeedback | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [nextEvaluation, setNextEvaluation] = useState<number>(20);
  const [isEvaluationActive, setIsEvaluationActive] = useState(false);

  // Keep feedback visible until replaced by new feedback
  useEffect(() => {
    if (feedback) {
      setIsVisible(true);
      // Don't auto-hide - keep until next feedback arrives
    }
  }, [feedback]);

  // Timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isEvaluationActive && nextEvaluation > 0 && !isLoading) {
      interval = setInterval(() => {
        setNextEvaluation(prev => {
          if (prev <= 1) {
            // Don't reset - let the evaluation system handle it
            console.log("⏰ [FEEDBACK] Timer reached 0, setting loading state");
            setIsLoading(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isEvaluationActive, nextEvaluation, isLoading]);

  // Reset loading state when evaluation is complete but no feedback received
  useEffect(() => {
    if (isLoading && nextEvaluation === 0) {
      // If we've been loading for more than 30 seconds, reset
      const resetTimer = setTimeout(() => {
        console.log("⚠️ [FEEDBACK] Evaluation timeout, resetting...");
        setIsLoading(false);
        setNextEvaluation(20);
      }, 30000);

      return () => clearTimeout(resetTimer);
    }
  }, [isLoading, nextEvaluation]);

  const updateFeedback = (newFeedback: InInterviewFeedback) => {
    console.log("📝 [FEEDBACK] Updating feedback:", newFeedback);
    setIsLoading(false);
    setFeedback(newFeedback);
    // Reset timer after getting feedback
    setNextEvaluation(20);
  };

  const startTimer = () => {
    setIsEvaluationActive(true);
    setNextEvaluation(20);
  };

  const stopTimer = () => {
    setIsEvaluationActive(false);
    setNextEvaluation(20);
  };

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    updateFeedback,
    startTimer,
    stopTimer,
  }));

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "great":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "good":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case "bad":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "great":
        return "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950";
      case "good":
        return "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950";
      case "bad":
        return "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950";
      default:
        return "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900";
    }
  };

  const getConfidenceText = (confidence: number) => {
    return `${Math.round(confidence * 100)}% confident`;
  };

  return (
    <div className={cn("w-full overflow-y-auto", className)}>
      {/* Auto-fit container */}
      <div>
        {isLoading ? (
          <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
            <Loader2 className="w-3 h-3 text-gray-500 animate-spin" />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Analyzing...
            </span>
          </div>
        ) : feedback && isVisible ? (
          <div
            className={cn(
              "border rounded-lg p-3 relative flex flex-col",
              getStatusColor(feedback.status)
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getStatusIcon(feedback.status)}
                <span className="text-sm font-medium capitalize">
                  {feedback.status}
                </span>
              </div>
              {typeof feedback.confidence === 'number' && (
                <span className="text-xs text-gray-500">
                  {getConfidenceText(feedback.confidence)}
                </span>
              )}
            </div>
            
            {/* Feedback content */}
            <div className="flex-1 overflow-y-auto mb-3">
              {Array.isArray(feedback.bullet_points) && feedback.bullet_points.length > 0 ? (
                <ul className="list-disc list-inside space-y-1">
                  {feedback.bullet_points.map((point, idx) => (
                    <li key={idx} className="text-sm text-gray-700 dark:text-gray-300">
                      {point}
                    </li>
                  ))}
                </ul>
              ) : feedback.feedback ? (
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {feedback.feedback}
                </p>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">No details provided.</p>
              )}
            </div>
            
            {/* Progress bar underneath text */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
              <motion.div
                className="bg-current opacity-40 h-1 rounded-full"
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 10, ease: "linear" }}
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-3 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
            {isEvaluationActive ? (
              <div className="text-xs text-gray-400 dark:text-gray-600">
                Evaluating performance...
              </div>
            ) : (
              <div className="text-xs text-gray-400 dark:text-gray-600">
                Waiting to start...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

FeedbackDisplay.displayName = 'FeedbackDisplay';

export default FeedbackDisplay;
