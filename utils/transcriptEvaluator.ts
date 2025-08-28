import { 
  TranscriptEntry, 
  InInterviewFeedback, 
  FinalEvaluation 
} from './feedbackTypes';

export class TranscriptEvaluator {
  private transcriptHistory: TranscriptEntry[] = [];
  private evaluationInterval: NodeJS.Timeout | null = null;
  private onEvaluationCallback: ((feedback: InInterviewFeedback) => void) | null = null;
  private readonly ROLLING_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
  private readonly EVALUATION_INTERVAL_MS = 20 * 1000; // 20 seconds
  private isEvaluating = false;

  constructor() {}

  /**
   * Start periodic evaluation every 20 seconds
   */
  startPeriodicEvaluation(getTranscriptEntries: () => TranscriptEntry[]): void {
    if (this.evaluationInterval) {
      return;
    }

    this.evaluationInterval = setInterval(async () => {
      if (this.isEvaluating) {
        console.log("⏳ [EVALUATOR] Already evaluating, skipping...");
        return;
      }

      try {
        this.isEvaluating = true;
        const entries = getTranscriptEntries();
        
        console.log("🔄 [EVALUATOR] Periodic evaluation triggered, entries:", entries.length);
        
        if (entries.length === 0) {
          console.log("⚠️ [EVALUATOR] No entries to evaluate");
          return;
        }

        // Update internal history
        this.updateTranscriptHistory(entries);
        
        // Get rolling window of last 5 minutes
        const rollingWindow = this.getRollingWindow();
        
        console.log("📊 [EVALUATOR] Rolling window entries:", rollingWindow.length);
        
        if (rollingWindow.length === 0) {
          console.log("⚠️ [EVALUATOR] No entries in rolling window");
          return;
        }

        // Perform evaluation
        const feedback = await this.evaluateTranscript(rollingWindow);
        
        if (feedback && this.onEvaluationCallback) {
          console.log("✅ [EVALUATOR] Calling feedback callback with:", feedback);
          this.onEvaluationCallback(feedback);
        } else {
          console.log("⚠️ [EVALUATOR] No feedback received or no callback set");
        }
      } catch (error) {
        console.error("❌ [EVALUATOR] Periodic evaluation error:", error);
      } finally {
        this.isEvaluating = false;
      }
    }, this.EVALUATION_INTERVAL_MS);
  }

  /**
   * Stop periodic evaluation
   */
  stopPeriodicEvaluation(): void {
    if (this.evaluationInterval) {
      clearInterval(this.evaluationInterval);
      this.evaluationInterval = null;
    }
  }

  /**
   * Set callback for evaluation results
   */
  onEvaluation(callback: (feedback: InInterviewFeedback) => void): void {
    this.onEvaluationCallback = callback;
  }

  /**
   * Get detailed evaluation for end of interview
   */
  async getDetailedEvaluation(entries: TranscriptEntry[]): Promise<FinalEvaluation> {
    console.log("📊 Getting detailed evaluation for", entries.length, "entries");
    
    const transcriptText = this.formatTranscriptForAPI(entries);
    
    try {
      const response = await fetch('/api/transcript/final_evaluation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript_text: transcriptText
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get detailed evaluation: ${response.status}`);
      }

      const result = await response.json();
      console.log("📊 Received detailed evaluation:", result);
      
      return result;
    } catch (error) {
      console.error("📊 Error getting detailed evaluation:", error);
      throw error;
    }
  }

  /**
   * Update internal transcript history
   */
  private updateTranscriptHistory(entries: TranscriptEntry[]): void {
    // Replace the entire history with new entries
    this.transcriptHistory = [...entries];
    
    // Clean up old entries outside the rolling window
    const cutoffTime = Date.now() - this.ROLLING_WINDOW_MS;
    this.transcriptHistory = this.transcriptHistory.filter(
      entry => entry.timestamp * 1000 >= cutoffTime
    );
  }

  /**
   * Get entries within the 5-minute rolling window
   * 
   * IMPORTANT: This rolling window is ONLY used for real-time feedback evaluation
   * to improve performance and focus on recent conversation context.
   * 
   * The master transcript stored in Chat component is NEVER truncated and
   * contains the complete conversation history for download.
   */
  private getRollingWindow(): TranscriptEntry[] {
    const cutoffTime = Date.now() - this.ROLLING_WINDOW_MS;
    const rollingEntries = this.transcriptHistory.filter(
      entry => entry.timestamp * 1000 >= cutoffTime
    );
    
    console.log(`🕐 [EVALUATOR] Rolling window: ${rollingEntries.length}/${this.transcriptHistory.length} entries (last 5 minutes only)`);
    console.log(`🕐 [EVALUATOR] Full transcript history preserved separately: ${this.transcriptHistory.length} total entries`);
    
    return rollingEntries;
  }

  /**
   * Evaluate transcript using the in-interview API
   */
  private async evaluateTranscript(entries: TranscriptEntry[]): Promise<InInterviewFeedback | null> {
    const transcriptText = this.formatTranscriptForAPI(entries);
    
    console.log("🔍 [EVALUATOR] Starting evaluation with", entries.length, "entries");
    console.log("🔍 [EVALUATOR] Transcript text:", transcriptText.substring(0, 200) + "...");
    
    try {
      const response = await fetch('/api/transcript/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript_text: transcriptText
        }),
      });

      console.log("🔍 [EVALUATOR] API response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ [EVALUATOR] API failed:", response.status, errorText);
        return null;
      }

      const result = await response.json();
      console.log("✅ [EVALUATOR] API success:", result);
      return result;
    } catch (error) {
      console.error("❌ [EVALUATOR] Error:", error);
      return null;
    }
  }

  /**
   * Format transcript entries for API - USES ROLLING WINDOW (TRUNCATED for feedback only)
   * NOTE: This is intentionally truncated for real-time feedback performance.
   * The master transcript is preserved separately and never truncated.
   */
  private formatTranscriptForAPI(entries: TranscriptEntry[]): string {
    if (entries.length === 0) {
      return 'No transcript data available yet.';
    }

    console.log(`📝 [EVALUATOR] Formatting ${entries.length} entries for feedback API (rolling window - last 5 minutes only)`);
    console.log(`📝 [EVALUATOR] NOTE: Master transcript is preserved separately and not truncated`);

    return entries.map(entry => {
      const timeStr = new Date(entry.timestamp * 1000).toLocaleTimeString();
      const speaker = entry.speaker === "user" ? "Candidate" : "Interviewer";
      
      // Add emotion data if available
      let emotionInfo = "";
      if (entry.emotions && Object.keys(entry.emotions).length > 0) {
        const topEmotions = Object.entries(entry.emotions)
          .sort(([,a], [,b]) => (b as number) - (a as number))
          .slice(0, 3)
          .map(([emotion, score]) => `${emotion}:${(score as number).toFixed(2)}`)
          .join(", ");
        emotionInfo = ` [Emotions: ${topEmotions}]`;
      }
      
      // Add confidence if available
      let confidenceInfo = "";
      if (entry.confidence) {
        confidenceInfo = ` [Confidence: ${entry.confidence.toFixed(2)}]`;
      }
      
      return `[${timeStr}] ${speaker}: ${entry.text}${emotionInfo}${confidenceInfo}`;
    }).join('\n');
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stopPeriodicEvaluation();
    this.onEvaluationCallback = null;
    this.transcriptHistory = [];
  }
}

export default TranscriptEvaluator;
