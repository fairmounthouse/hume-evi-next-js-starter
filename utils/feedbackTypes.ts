export interface TranscriptEntry {
  id: string;
  speaker: "user" | "assistant";
  text: string;
  timestamp: number;
  startSpeakingTimestamp?: number; // For user messages: when they started speaking (from first interim)
  emotions?: any;
  confidence?: number;
  isInterim?: boolean; // Flag for interim messages (used for UI styling)
}

export interface InInterviewFeedback {
  status: "great" | "good" | "bad";
  feedback?: string;
  bullet_points?: string[];
  confidence?: number;
  timestamp?: number;
}

export interface FinalEvaluationFactor {
  factor_name: string;
  score: number;
  strength: string;
  weakness: string[];
  feedback: string[];
  specific_example: Array<{
    timestamp: string;
    quote: string;
    issue: string;
    better_approach: string;
  }>;
}

export interface FinalEvaluationSummary {
  total_score: number;
  key_strengths: string[];
  critical_weaknesses: string[];
  immediate_action_items: string[];
  hiring_recommendation: string;
}

export interface FinalEvaluation {
  factors: FinalEvaluationFactor[];
  summary: FinalEvaluationSummary;
  confidence: number;
  timestamp: number;
}
