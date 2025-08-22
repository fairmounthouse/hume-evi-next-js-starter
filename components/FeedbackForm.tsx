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
    npsScore: null as number | null,
    realisticScore: null as number | null,
    challenges: '',
    motivation: '',
    features: [] as string[],
    otherFeature: '',
    followUpInterest: null as string | null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const questions = [
    {
      id: 'nps',
      type: 'nps',
      question: 'On a scale of 1-10, how likely are you to recommend this AI mock interview tool to a friend preparing for interviews?',
      required: true
    },
    {
      id: 'realistic',
      type: 'rating',
      question: 'How realistic did the AI coach feel compared to a real MBB consultant interviewer?',
      options: ['1', '2', '3', '4', '5'],
      labels: ['Not Realistic', '', '', '', 'Very Realistic'],
      required: true
    },
    {
      id: 'challenges',
      type: 'text',
      question: 'What challenges did you face during the session that we could address in future updates?',
      placeholder: 'Share any difficulties or areas for improvement...',
      required: false
    },
    {
      id: 'motivation',
      type: 'text',
      question: 'What motivated you to use this tool today, and did it meet your expectations?',
      placeholder: 'Tell us about your goals and experience...',
      required: false
    },
    {
      id: 'features',
      type: 'chips',
      question: 'What new features would make this tool even better?',
      subtitle: 'Select up to 3',
      options: ['More case types', 'Behavioral mocks', 'Video integration', 'Custom plans', 'Other'],
      required: false
    },
    {
      id: 'followup',
      type: 'binary',
      question: 'Would you be open to a 15-min follow-up call for more feedback in exchange for more mock interview credits?',
      required: false
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
      case 'nps': return formData.npsScore !== null;
      case 'realistic': return formData.realisticScore !== null;
      case 'followup': return formData.followUpInterest !== null;
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
          {currentQ.subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 -mt-2 mb-3">{currentQ.subtitle}</p>
          )}

          {/* NPS Scale - Compact */}
          {currentQ.type === 'nps' && (
            <div className="flex gap-1">
              {[...Array(10)].map((_, i) => {
                const score = i + 1;
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
          )}

          {/* Rating - 1-5 scale with labels */}
          {currentQ.type === 'rating' && (
            <div>
              <div className="flex gap-2">
                {currentQ.options?.map((option, index) => {
                  const isSelected = formData.realisticScore === index + 1;
                  return (
                    <button
                      key={option}
                      onClick={() => setFormData(prev => ({ ...prev, realisticScore: index + 1 }))}
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
            </div>
          )}

          {/* Text Input - Compact */}
          {currentQ.type === 'text' && (
            <textarea
              value={formData[currentQ.id as keyof typeof formData] as string}
              onChange={(e) => setFormData(prev => ({ ...prev, [currentQ.id]: e.target.value }))}
              className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              rows={3}
              placeholder={currentQ.placeholder}
              autoFocus
            />
          )}

          {/* Feature chips with "Other" text input */}
          {currentQ.type === 'chips' && (
            <div>
              <div className="flex flex-wrap gap-2">
                {currentQ.options?.map((option) => {
                  const isSelected = formData.features.includes(option);
                  const isDisabled = !isSelected && formData.features.length >= 3;
                  return (
                    <button
                      key={option}
                      onClick={() => {
                        if (isDisabled) return;
                        setFormData(prev => ({
                          ...prev,
                          features: isSelected
                            ? prev.features.filter(f => f !== option)
                            : [...prev.features, option]
                        }));
                      }}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all
                        ${isSelected 
                          ? 'bg-blue-500 text-white' 
                          : isDisabled
                          ? 'bg-gray-100 text-gray-400 opacity-50 dark:bg-gray-700 dark:text-gray-500'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'}`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
              {formData.features.includes('Other') && (
                <input
                  type="text"
                  placeholder="Please specify..."
                  className="w-full mt-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  onChange={(e) => setFormData(prev => ({ ...prev, otherFeature: e.target.value }))}
                />
              )}
            </div>
          )}

          {/* Binary - Yes/No */}
          {currentQ.type === 'binary' && (
            <div className="flex gap-3">
              <button
                onClick={() => setFormData(prev => ({ ...prev, followUpInterest: 'yes' }))}
                className={`flex-1 py-3 rounded-lg font-medium transition-all
                  ${formData.followUpInterest === 'yes'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'}`}
              >
                Yes
              </button>
              <button
                onClick={() => setFormData(prev => ({ ...prev, followUpInterest: 'no' }))}
                className={`flex-1 py-3 rounded-lg font-medium transition-all
                  ${formData.followUpInterest === 'no'
                    ? 'bg-gray-500 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'}`}
              >
                No
              </button>
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
