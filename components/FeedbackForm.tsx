import React, { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, X } from 'lucide-react';

interface FeedbackFormProps {
  onClose: () => void;
  onSubmit: (formData: any) => Promise<void>;
  onPartialSubmit: (formData: any) => Promise<void>; // New prop for partial submissions
  sessionData?: {
    id: string;
    [key: string]: any;
  };
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ onClose, onSubmit, onPartialSubmit, sessionData }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [formData, setFormData] = useState({
    // New survey fields
    satisfactionScore: null as number | null, // 1-5
    satisfactionFeedback: '', // follow-up
    improvements: '', // open-ended
    coachHelpfulnessScore: null as number | null, // 1-5
    coachHelpfulnessFeedback: '', // follow-up
    technicalIssues: null as string | null, // 'yes' | 'no'
    technicalIssuesDescription: '', // open-ended if yes
    featureRequests: '', // open-ended
    npsScore: null as number | null, // 0-10
    npsReason: '', // follow-up
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const questions = [
    {
      id: 'satisfactionScore',
      type: 'rating',
      question: 'On a scale of 1-5, how satisfied were you with this mock interview session?',
      options: ['1', '2', '3', '4', '5'],
      labels: ['Very Dissatisfied', '', '', '', 'Very Satisfied'],
      required: true
    },
    {
      id: 'improvements',
      type: 'text',
      question: 'What could we improve about the session (e.g., questions, pacing, features)?',
      placeholder: 'Share any suggestions or areas for improvement...',
      required: false
    },
    {
      id: 'coachHelpfulnessScore',
      type: 'rating',
      question: 'How helpful and useful was the AI coach?',
      options: ['1', '2', '3', '4', '5'],
      labels: ['Not Helpful', '', '', '', 'Very Helpful'],
      required: true
    },
    {
      id: 'technicalIssues',
      type: 'binary',
      question: 'Did you encounter any technical issues (e.g., audio, video, loading)?',
      required: true
    },
    {
      id: 'featureRequests',
      type: 'text',
      question: 'What other features and services should Skillflo include to improve your overall interview preparation experience?',
      placeholder: 'Your ideas and suggestions...',
      required: false
    },
    {
      id: 'npsScore',
      type: 'nps',
      question: 'On a scale of 0-10, how likely are you to recommend Skillflo to a peer preparing for interviews?',
      scaleMin: 0,
      scaleMax: 10,
      required: true
    }
  ];

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        if (canProceed()) handleNext();
      }
      if (e.key === 'ArrowRight' && canProceed()) handleNext();
      if (e.key === 'ArrowLeft' && currentQuestion > 0) handleBack();
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentQuestion, formData]);

  const canProceed = () => {
    if (!currentQ.required) return true;
    switch (currentQ.id) {
      case 'npsScore': return formData.npsScore !== null;
      case 'satisfactionScore': return formData.satisfactionScore !== null;
      case 'coachHelpfulnessScore': return formData.coachHelpfulnessScore !== null;
      case 'technicalIssues': return formData.technicalIssues !== null;
      default: return true;
    }
  };

  const handleNext = async () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      setIsSubmitting(true);
      try {
        await onSubmit({ 
          ...formData, 
          sessionId: sessionData?.id,
          submittedAt: new Date().toISOString(),
          completed: true,
          lastQuestionIndex: currentQuestion,
          totalQuestions: questions.length,
          closeReason: 'completed'
        });
        onClose();
      } catch (error) {
        console.error('Failed to submit feedback:', error);
        setIsSubmitting(false);
      }
    }
  };

  const handleClose = async () => {
    // Save partial feedback data before closing
    try {
      await onPartialSubmit({
        ...formData,
        sessionId: sessionData?.id,
        submittedAt: new Date().toISOString(),
        completed: false,
        lastQuestionIndex: currentQuestion,
        totalQuestions: questions.length,
        closeReason: 'closed_by_user'
      });
    } catch (error) {
      console.error('Failed to save partial feedback:', error);
    }
    onClose();
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl max-w-lg w-full shadow-xl">
        {/* Slim progress bar */}
        <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-t-xl overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Compact header */}
        <div className="px-6 pt-4 pb-2 flex justify-between items-center">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            {currentQuestion + 1} / {questions.length}
          </span>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Question */}
        <div className="px-6 pb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {currentQ.question}
          </h3>
          {(currentQ as any).subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 -mt-2 mb-3">{(currentQ as any).subtitle}</p>
          )}

          {/* NPS Scale - Supports 0-10 */}
          {currentQ.type === 'nps' && (
            <div>
              <div className="flex gap-1">
                {Array.from({ length: ((currentQ as any).scaleMax ?? 10) - ((currentQ as any).scaleMin ?? 0) + 1 }).map((_, i) => {
                  const min = (currentQ as any).scaleMin ?? 0;
                  const score = min + i;
                  const isSelected = formData.npsScore === score;
                  return (
                    <button
                      key={score}
                      onClick={() => setFormData(prev => ({ ...prev, npsScore: score }))}
                      className={`flex-1 h-10 rounded text-sm font-medium transition-all
                        ${isSelected 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'}`}
                    >
                      {score}
                    </button>
                  );
                })}
              </div>
              {/* NPS follow-up */}
              {formData.npsScore !== null && (
                <div className="mt-3">
                  <textarea
                    value={formData.npsReason}
                    onChange={(e) => setFormData(prev => ({ ...prev, npsReason: e.target.value }))}
                    className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    rows={3}
                    placeholder={"Why that score?"}
                  />
                </div>
              )}
            </div>
          )}

          {/* Rating - 1-5 scale with labels */}
          {currentQ.type === 'rating' && (
            <div>
              <div className="flex gap-2">
                {currentQ.options?.map((option, index) => {
                  const selectedValue = (formData as any)[currentQ.id] as number | null;
                  const isSelected = selectedValue === index + 1;
                  return (
                    <button
                      key={option}
                      onClick={() => setFormData(prev => ({ ...prev, [currentQ.id]: index + 1 }))}
                      className={`flex-1 py-3 px-3 rounded-lg text-sm font-medium transition-all
                        ${isSelected 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'}`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">{currentQ.labels?.[0]}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{currentQ.labels?.[4]}</span>
              </div>

              {/* Follow-ups for rating questions */}
              {currentQ.id === 'satisfactionScore' && (formData.satisfactionScore !== null) && (
                <div className="mt-3">
                  <textarea
                    value={formData.satisfactionFeedback}
                    onChange={(e) => setFormData(prev => ({ ...prev, satisfactionFeedback: e.target.value }))}
                    className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    rows={3}
                    placeholder={"What influenced your rating?"}
                  />
                </div>
              )}

              {currentQ.id === 'coachHelpfulnessScore' && (formData.coachHelpfulnessScore !== null) && (
                <div className="mt-3">
                  <textarea
                    value={formData.coachHelpfulnessFeedback}
                    onChange={(e) => setFormData(prev => ({ ...prev, coachHelpfulnessFeedback: e.target.value }))}
                    className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    rows={3}
                    placeholder={"Tell us more about the AI coach's usefulness"}
                  />
                </div>
              )}
            </div>
          )}

          {/* Text Input - Compact */}
          {currentQ.type === 'text' && (
            <textarea
              value={(formData as any)[currentQ.id] as string}
              onChange={(e) => setFormData(prev => ({ ...prev, [currentQ.id]: e.target.value }))}
              className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              rows={3}
              placeholder={(currentQ as any).placeholder}
              autoFocus
            />
          )}

          {/* Feature chips UI removed in favor of open-ended input per new survey */}

          {/* Binary - Yes/No with conditional description */}
          {currentQ.type === 'binary' && (
            <div>
              <div className="flex gap-3">
                <button
                  onClick={() => setFormData(prev => ({ ...prev, [currentQ.id]: 'yes' }))}
                  className={`flex-1 py-3 rounded-lg font-medium transition-all
                    ${(formData as any)[currentQ.id] === 'yes'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'}`}
                >
                  Yes
                </button>
                <button
                  onClick={() => setFormData(prev => ({ ...prev, [currentQ.id]: 'no' }))}
                  className={`flex-1 py-3 rounded-lg font-medium transition-all
                    ${ (formData as any)[currentQ.id] === 'no'
                      ? 'bg-gray-500 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'}`}
                >
                  No
                </button>
              </div>
              {currentQ.id === 'technicalIssues' && formData.technicalIssues === 'yes' && (
                <div className="mt-3">
                  <textarea
                    value={formData.technicalIssuesDescription}
                    onChange={(e) => setFormData(prev => ({ ...prev, technicalIssuesDescription: e.target.value }))}
                    className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    rows={3}
                    placeholder={"Please describe the issue(s)"}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Compact navigation */}
        <div className="px-6 pb-4 flex justify-between items-center">
          <button
            onClick={handleBack}
            className={`text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 flex items-center gap-1 py-2
              ${currentQuestion === 0 ? 'invisible' : ''}`}
          >
            <ArrowLeft className="w-3 h-3" />
            Back
          </button>

          <div className="flex gap-2">
            {!currentQ.required && (
              <button
                onClick={() => {
                  // Track that this question was skipped
                  console.log(`📊 Question ${currentQuestion + 1} (${currentQ.id}) was skipped`);
                  handleNext();
                }}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                disabled={isSubmitting}
              >
                Skip
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={(currentQ.required && !canProceed()) || isSubmitting}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1
                ${(canProceed() && !isSubmitting)
                  ? 'bg-blue-500 text-white hover:bg-blue-600' 
                  : 'bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500'}`}
            >
              {isSubmitting ? 'Submitting...' : currentQuestion === questions.length - 1 ? 'Submit' : 'Next'}
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Keyboard hint */}
        <div className="px-6 pb-3 text-center">
          <span className="text-xs text-gray-400 dark:text-gray-500">Press Ctrl+Enter to continue</span>
        </div>
      </div>
    </div>
  );
};

export default FeedbackForm;
