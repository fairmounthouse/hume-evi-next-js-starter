import React, { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, X } from 'lucide-react';

interface AnalysisFeedbackFormProps {
  onClose: () => void;
  onSubmit: (formData: any) => Promise<void>;
  onPartialSubmit: (formData: any) => Promise<void>;
  sessionData?: {
    id: string;
    [key: string]: any;
  };
}

const AnalysisFeedbackForm: React.FC<AnalysisFeedbackFormProps> = ({ onClose, onSubmit, onPartialSubmit, sessionData }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [formData, setFormData] = useState({
    accuracyRating: null as number | null,
    helpfulnessAnswer: null as string | null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const questions = [
    {
      id: 'accuracy',
      type: 'rating',
      question: 'How accurate and useful was the feedback on your performance (e.g., structure, logic, energy)?',
      options: ['1', '2', '3', '4', '5'],
      labels: ['Not Accurate', '', '', '', 'Very Accurate'],
      required: true
    },
    {
      id: 'helpfulness',
      type: 'binary',
      question: 'Did the feedback help you identify areas for improvement?',
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
      case 'accuracy': return formData.accuracyRating !== null;
      case 'helpfulness': return formData.helpfulnessAnswer !== null;
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
        console.error('Failed to submit analysis feedback:', error);
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
      console.error('Failed to save partial analysis feedback:', error);
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
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Compact header */}
        <div className="px-6 pt-4 pb-2 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              {currentQuestion + 1} / {questions.length}
            </span>
            <span className="text-xs text-green-600 dark:text-green-400 font-medium">
              Analysis Feedback
            </span>
          </div>
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

          {/* Rating - 1-5 scale with labels */}
          {currentQ.type === 'rating' && (
            <div>
              <div className="flex gap-2">
                {currentQ.options?.map((option, index) => {
                  const isSelected = formData.accuracyRating === index + 1;
                  return (
                    <button
                      key={option}
                      onClick={() => setFormData(prev => ({ ...prev, accuracyRating: index + 1 }))}
                      className={`flex-1 py-3 px-3 rounded-lg text-sm font-medium transition-all
                        ${isSelected 
                          ? 'bg-green-500 text-white' 
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

          {/* Binary - Yes/No */}
          {currentQ.type === 'binary' && (
            <div className="flex gap-3">
              <button
                onClick={() => setFormData(prev => ({ ...prev, helpfulnessAnswer: 'yes' }))}
                className={`flex-1 py-3 rounded-lg font-medium transition-all
                  ${formData.helpfulnessAnswer === 'yes'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'}`}
              >
                Yes
              </button>
              <button
                onClick={() => setFormData(prev => ({ ...prev, helpfulnessAnswer: 'no' }))}
                className={`flex-1 py-3 rounded-lg font-medium transition-all
                  ${formData.helpfulnessAnswer === 'no'
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
            <button
              onClick={handleNext}
              disabled={(currentQ.required && !canProceed()) || isSubmitting}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1
                ${(canProceed() && !isSubmitting)
                  ? 'bg-green-500 text-white hover:bg-green-600' 
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

export default AnalysisFeedbackForm;
