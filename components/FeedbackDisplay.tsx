"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { cn } from "@/utils";
import { motion, AnimatePresence } from "motion/react";
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

  // Auto-hide feedback after 10 seconds
  useEffect(() => {
    if (feedback) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 10000);

      return () => clearTimeout(timer);
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
    <div className={cn("w-full min-h-[60px] max-h-[200px] overflow-y-auto", className)}>
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg"
          >
            <Loader2 className="w-3 h-3 text-gray-500 animate-spin" />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Analyzing...
            </span>
          </motion.div>
        )}
        
        {feedback && isVisible && !isLoading && (
          <motion.div
            key={`feedback-${feedback.status}-${feedback.confidence}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
              "border rounded-lg p-3 relative",
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
              <span className="text-xs text-gray-500">
                {getConfidenceText(feedback.confidence)}
              </span>
            </div>
            
            {/* Feedback text */}
            <div className="max-h-[120px] overflow-y-auto mb-3">
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {feedback.feedback}
              </p>
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
          </motion.div>
        )}
        
        {/* Timer and Empty state */}
        {!feedback && !isLoading && (
          <motion.div
            key="empty-state"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="text-center py-3 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg"
          >
            {isEvaluationActive ? (
              <div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  Next evaluation in {nextEvaluation}s
                </div>
                {/* Minimalistic progress bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                  <motion.div
                    className="bg-blue-500 h-1 rounded-full"
                    initial={{ width: "100%" }}
                    animate={{ width: `${(nextEvaluation / 20) * 100}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-400 dark:text-gray-600">
                Waiting to start...
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

FeedbackDisplay.displayName = 'FeedbackDisplay';

export default FeedbackDisplay;
