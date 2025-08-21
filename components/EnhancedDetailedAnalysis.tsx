"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  FileText, 
  ChevronRight, 
  CheckCircle, 
  AlertTriangle, 
  Target,
  Clock,
  X
} from "lucide-react";
import { cn } from "@/utils";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import CircularProgress from "./CircularProgress";
import { FinalEvaluation } from "@/utils/feedbackTypes";

interface EnhancedDetailedAnalysisProps {
  evaluation: FinalEvaluation;
  confidence: number;
}

interface ExampleModalProps {
  example: {
    timestamp: string;
    quote: string;
    issue: string;
    better_approach: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

function ExampleModal({ example, isOpen, onClose, factorName }: ExampleModalProps & { factorName?: string }) {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
      style={{ zIndex: 1000 }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          maxWidth: '500px',
          zIndex: 1000
        }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            Example - {factorName || 'Factor Details'}
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Modal Body */}
        <div className="space-y-4">
          {/* Timestamp */}
          <div>
            <button 
              className="text-blue-600 hover:text-blue-700 underline cursor-pointer"
              style={{ 
                color: '#2563eb', 
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              {example.timestamp}
            </button>
          </div>
          
          {/* Quote */}
          <div 
            className="italic text-gray-600"
            style={{
              fontStyle: 'italic',
              color: '#6b7280',
              margin: '8px 0',
              padding: '8px',
              background: '#f9fafb',
              borderLeft: '3px solid #d1d5db'
            }}
          >
            "{example.quote}"
          </div>
          
          {/* Issue */}
          <div 
            className="flex items-start gap-2"
            style={{
              color: '#dc2626',
              fontSize: '12px',
              margin: '8px 0'
            }}
          >
            <span>⚠️</span>
            <div>
              <span className="font-medium">Issue:</span>
              <span className="ml-1">{example.issue}</span>
            </div>
          </div>
          
          {/* Better Approach */}
          <div 
            className="flex items-start gap-2"
            style={{
              color: '#059669',
              fontSize: '12px',
              background: '#f0fdf4',
              padding: '8px',
              borderRadius: '4px'
            }}
          >
            <span>✓</span>
            <div>
              <span className="font-medium">Better approach:</span>
              <span className="ml-1">{example.better_approach}</span>
            </div>
          </div>
        </div>
        
        {/* Modal Footer */}
        <div className="flex justify-end mt-6">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function EnhancedDetailedAnalysis({ evaluation, confidence }: EnhancedDetailedAnalysisProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "detailed">("overview");
  const [selectedExample, setSelectedExample] = useState<any>(null);
  const [selectedFactorIndex, setSelectedFactorIndex] = useState<number>(0);

  // Height matching effect
  useEffect(() => {
    const matchHeights = () => {
      const container = document.querySelector('.detailed-factors-container') as HTMLElement;
      const nav = document.querySelector('.factor-nav') as HTMLElement;
      const details = document.querySelector('.factor-details') as HTMLElement;
      
      if (container && nav && details) {
        const containerHeight = container.offsetHeight;
        nav.style.height = `${containerHeight}px`;
        details.style.height = `${containerHeight}px`;
      }
    };

    const timer = setTimeout(matchHeights, 100);
    window.addEventListener('resize', matchHeights);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', matchHeights);
    };
  }, [activeTab, selectedFactorIndex]);

  const getScoreBadgeColor = (score: number) => {
    if (score >= 8) return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
    if (score >= 5) return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
    return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
  };

  const getHiringRecommendationBadge = (recommendation: string) => {
    const lower = recommendation.toLowerCase();
    if (lower.includes("yes") || lower.includes("strong") || lower.includes("recommended")) {
      return { color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300", text: "Recommended" };
    }
    if (lower.includes("maybe") || lower.includes("minor") || lower.includes("consider")) {
      return { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300", text: "Maybe" };
    }
    return { color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300", text: "Not Recommended" };
  };

  const hiringBadge = getHiringRecommendationBadge(evaluation.summary.hiring_recommendation);

  return (
    <>
      <Card className="p-6 flex flex-col max-h-[600px]">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Detailed Analysis
        </h3>

        {/* Compact Score Section - Outside of tabs */}
        <div 
          className="bg-gray-50 dark:bg-gray-800 rounded-lg mb-4 flex items-center gap-4"
          style={{ 
            padding: '12px', 
            height: '70px' 
          }}
        >
          <CircularProgress score={evaluation.summary.total_score} />
          
          <div className="flex flex-col gap-1">
            <Badge 
              className={cn("text-xs", hiringBadge.color)}
              style={{ fontSize: '12px', padding: '3px 8px' }}
            >
              {hiringBadge.text}
            </Badge>
            
            <p 
              className="text-gray-400 dark:text-gray-500"
              style={{ fontSize: '10px', color: '#9ca3af' }}
            >
              {Math.round(confidence * 100)}% confidence
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
          <div className="flex">
            {[
              { key: "overview", label: "Overview" },
              { key: "detailed", label: "Detailed Factors" }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={cn(
                  "px-3 py-2.5 text-sm font-medium border-b-2 transition-colors",
                  activeTab === tab.key
                    ? "border-blue-600 text-blue-600 font-bold"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                )}
                style={{ padding: '10px 12px' }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div 
          className="flex-grow pr-1 pb-5" 
          style={{ 
            scrollBehavior: 'smooth',
            height: 'calc(100vh - 250px)',
            minHeight: '400px',
            overflow: 'hidden'
          }}
        >
          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-full"
              >
                {/* Two Column Layout */}
                <div 
                  className="grid h-full gap-5 p-4"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '65% 35%',
                    gap: '20px',
                    padding: '16px'
                  }}
                >
                  {/* Left Column (60%) */}
                  <div 
                    className="flex flex-col gap-4"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px'
                    }}
                  >
                    {/* Hiring Recommendation */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <h4 className="font-semibold text-sm mb-2 text-blue-700 dark:text-blue-300">Hiring Recommendation</h4>
                      <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                        {evaluation.summary.hiring_recommendation}
                      </p>
                    </div>

                    {/* Key Strengths */}
                    <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                      <h4 className="font-semibold text-sm mb-3 text-green-600 dark:text-green-400 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Key Strengths
                      </h4>
                      <ul className="space-y-2">
                        {evaluation.summary.key_strengths.slice(0, 3).map((strength, index) => (
                          <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Areas for Improvement */}
                    <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg">
                      <h4 className="font-semibold text-sm mb-3 text-amber-600 dark:text-amber-400 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Areas for Improvement
                      </h4>
                      <ul className="space-y-2">
                        {evaluation.summary.critical_weaknesses.slice(0, 3).map((weakness, index) => (
                          <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                            {weakness}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Right Column (40%) */}
                  <div 
                    className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 h-fit"
                    style={{
                      background: '#eff6ff',
                      borderRadius: '8px',
                      padding: '16px',
                      height: 'fit-content'
                    }}
                  >
                    {/* Action Items */}
                    <div className="mb-4">
                      <h4 
                        className="font-semibold text-xs text-blue-600 dark:text-blue-400 uppercase mb-3"
                        style={{
                          fontSize: '11px',
                          color: '#2563eb',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          fontWeight: '600',
                          marginBottom: '12px'
                        }}
                      >
                        ACTION ITEMS
                      </h4>
                      <div className="space-y-2">
                        {evaluation.summary.immediate_action_items.map((item, index) => (
                          <div 
                            key={index} 
                            className="py-2 border-b border-blue-200 dark:border-blue-800 last:border-b-0"
                            style={{
                              fontSize: '13px',
                              lineHeight: '1.5',
                              padding: '8px 0',
                              borderBottom: index < evaluation.summary.immediate_action_items.length - 1 ? '1px solid #dbeafe' : 'none'
                            }}
                          >
                            <div className="flex items-start gap-2">
                              <input 
                                type="checkbox" 
                                className="mt-1 text-blue-600" 
                                style={{ accentColor: '#2563eb' }}
                              />
                              <span className="text-blue-700 dark:text-blue-300">{item}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>


                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "detailed" && (
              <motion.div
                key="detailed"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-full"
              >
                {/* Fixed Layout Container */}
                <div 
                  className="detailed-factors-container flex h-full"
                  style={{
                    display: 'flex',
                    height: 'calc(100vh - 250px)',
                    minHeight: '400px',
                    maxHeight: '600px'
                  }}
                >
                  {/* Left Side - Factor Navigation List */}
                  <div 
                    className="factor-nav"
                    style={{
                      width: '25%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRight: '1px solid #e5e7eb',
                      padding: '4px',
                      overflow: 'hidden',
                      height: '100%'
                    }}
                  >
                    {evaluation.factors.map((factor, index) => (
                      <div
                        key={index}
                        className={cn(
                          "flex justify-between items-center rounded cursor-pointer transition-all duration-200",
                          selectedFactorIndex === index 
                            ? "bg-blue-50 dark:bg-blue-950 border-l-3 border-blue-600 font-medium" 
                            : "hover:bg-gray-100 dark:hover:bg-gray-800"
                        )}
                        onClick={() => setSelectedFactorIndex(index)}
                        style={{
                          flex: '1',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0 10px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          minHeight: '32px',
                          maxHeight: '45px',
                          fontSize: '12px',
                          ...(selectedFactorIndex === index ? {
                            background: '#eff6ff',
                            borderLeft: '3px solid #2563eb',
                            fontWeight: '500'
                          } : {})
                        }}
                      >
                        <span 
                          className="flex-1 truncate"
                          style={{ fontSize: '12px' }}
                        >
                          {factor.factor_name}
                        </span>
                        
                        <Badge 
                          className={cn("font-semibold", getScoreBadgeColor(factor.score))}
                          style={{
                            fontSize: '11px',
                            padding: '1px 4px',
                            borderRadius: '3px',
                            fontWeight: '600'
                          }}
                        >
                          {factor.score}/10
                        </Badge>
                      </div>
                    ))}
                  </div>

                  {/* Right Side - Factor Details Panel */}
                  <div 
                    className="factor-details"
                    style={{
                      flex: '1',
                      height: '100%',
                      overflow: 'hidden',
                      background: '#fafafa'
                    }}
                  >
                    {evaluation.factors[selectedFactorIndex] && (
                      <div 
                        className="factor-content-wrapper"
                        style={{
                          display: 'flex',
                          height: '100%',
                          gap: '20px',
                          padding: '16px'
                        }}
                      >
                        {/* Column 1 - Strengths & Improvements Combined */}
                        <div 
                          className="content-column column-strengths-improvements"
                          style={{
                            flex: '1',
                            display: 'flex',
                            flexDirection: 'column',
                            height: '100%'
                          }}
                        >
                          {/* Strengths Section */}
                          <div 
                            className="strengths-section"
                            style={{
                              flex: '0 1 auto',
                              marginBottom: '12px'
                            }}
                          >
                            <div 
                              className="section-label"
                              style={{
                                flex: '0 0 auto',
                                fontSize: '12px',
                                color: '#6b7280',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                marginBottom: '8px',
                                fontWeight: '600'
                              }}
                            >
                              STRENGTHS
                            </div>
                            <div 
                              className="strengths-content"
                              style={{
                                fontSize: '13px',
                                color: '#059669',
                                lineHeight: '1.4'
                              }}
                            >
                              • {evaluation.factors[selectedFactorIndex].strength}
                            </div>
                          </div>

                          {/* Improvements Section */}
                          <div 
                            className="improvements-section"
                            style={{
                              flex: '1',
                              display: 'flex',
                              flexDirection: 'column',
                              minHeight: '0'
                            }}
                          >
                            <div 
                              className="section-label"
                              style={{
                                flex: '0 0 auto',
                                fontSize: '12px',
                                color: '#6b7280',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                marginBottom: '8px',
                                fontWeight: '600'
                              }}
                            >
                              IMPROVEMENTS
                            </div>
                            <div 
                              className="improvements-content"
                              style={{
                                flex: '1',
                                overflowY: 'auto',
                                overflowX: 'hidden',
                                paddingRight: '4px'
                              }}
                            >
                              {evaluation.factors[selectedFactorIndex].weakness.length > 0 ? (
                                <ul 
                                  className="improvement-list"
                                  style={{
                                    margin: '0',
                                    paddingLeft: '16px'
                                  }}
                                >
                                  {evaluation.factors[selectedFactorIndex].weakness.map((weakness, i) => (
                                    <li 
                                      key={i}
                                      className="content-item"
                                      style={{
                                        marginBottom: '6px',
                                        fontSize: '13px',
                                        color: '#d97706',
                                        lineHeight: '1.5'
                                      }}
                                    >
                                      {weakness}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <div style={{ color: '#6b7280', fontSize: '11px' }}>No specific improvements identified</div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Column 2 - Recommendations */}
                        <div 
                          className="content-column column-recommendations"
                          style={{
                            flex: '1',
                            display: 'flex',
                            flexDirection: 'column',
                            height: '100%'
                          }}
                        >
                          <div 
                            className="section-label"
                            style={{
                              fontSize: '12px',
                              color: '#6b7280',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              marginBottom: '8px',
                              fontWeight: '600'
                            }}
                          >
                            RECOMMENDATIONS
                          </div>
                          <div 
                            className="recommendations-content"
                            style={{
                              flex: '1',
                              overflowY: 'auto',
                              overflowX: 'hidden',
                              paddingRight: '4px'
                            }}
                          >
                            {evaluation.factors[selectedFactorIndex].feedback.length > 0 ? (
                              <ul 
                                className="recommendation-list"
                                style={{
                                  margin: '0',
                                  paddingLeft: '0',
                                  listStyle: 'none'
                                }}
                              >
                                {evaluation.factors[selectedFactorIndex].feedback.map((feedback, i) => (
                                  <li 
                                    key={i}
                                    className="recommendation-item"
                                    style={{
                                      background: '#dbeafe',
                                      padding: '4px 8px',
                                      borderRadius: '4px',
                                      marginBottom: '6px',
                                      fontSize: '13px',
                                      color: '#1e40af',
                                      lineHeight: '1.5'
                                    }}
                                  >
                                    • {feedback}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <div style={{ color: '#6b7280', fontSize: '11px' }}>No specific recommendations</div>
                            )}
                          </div>
                        </div>

                        {/* Column 3 - Example */}
                        <div 
                          className="content-column column-example"
                          style={{
                            flex: '1',
                            display: 'flex',
                            flexDirection: 'column',
                            height: '100%'
                          }}
                        >
                          <div 
                            className="section-label"
                            style={{
                              fontSize: '12px',
                              color: '#6b7280',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              marginBottom: '8px',
                              fontWeight: '600'
                            }}
                          >
                            EXAMPLE
                          </div>
                          <div 
                            className="example-content"
                            style={{
                              flex: '1',
                              overflowY: 'auto',
                              overflowX: 'hidden',
                              paddingRight: '4px'
                            }}
                          >
                            {evaluation.factors[selectedFactorIndex].specific_example.length > 0 ? (
                              <div 
                                className="example-inline"
                                style={{
                                  background: '#f9fafb',
                                  padding: '12px',
                                  borderRadius: '6px',
                                  fontSize: '11px'
                                }}
                              >
                                <div 
                                  className="example-timestamp"
                                  style={{
                                    color: '#2563eb',
                                    fontWeight: '500',
                                    marginBottom: '6px',
                                    fontSize: '12px',
                                    lineHeight: '1.4'
                                  }}
                                >
                                  📍 Timestamp: {evaluation.factors[selectedFactorIndex].specific_example[0].timestamp}
                                </div>
                                
                                <div 
                                  className="example-quote"
                                  style={{
                                    fontStyle: 'italic',
                                    color: '#6b7280',
                                    padding: '8px',
                                    background: 'white',
                                    borderLeft: '2px solid #d1d5db',
                                    margin: '8px 0',
                                    fontSize: '12px',
                                    lineHeight: '1.4'
                                  }}
                                >
                                  "{evaluation.factors[selectedFactorIndex].specific_example[0].quote}"
                                </div>
                                
                                <div className="space-y-1">
                                  <div 
                                    className="example-issue"
                                    style={{ 
                                      color: '#dc2626', 
                                      margin: '6px 0', 
                                      fontSize: '12px',
                                      lineHeight: '1.4'
                                    }}
                                  >
                                    <span className="font-medium">Issue:</span> {evaluation.factors[selectedFactorIndex].specific_example[0].issue}
                                  </div>
                                  <div 
                                    className="example-better"
                                    style={{ 
                                      color: '#059669', 
                                      margin: '6px 0', 
                                      fontSize: '12px',
                                      lineHeight: '1.4'
                                    }}
                                  >
                                    <span className="font-medium">Better:</span> {evaluation.factors[selectedFactorIndex].specific_example[0].better_approach}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div 
                                className="flex-1 flex items-center justify-center"
                                style={{ color: '#6b7280', fontSize: '11px', textAlign: 'center', lineHeight: '1.3' }}
                              >
                                No example available
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>

      <AnimatePresence>
        {selectedExample && (
          <ExampleModal
            example={selectedExample}
            isOpen={!!selectedExample}
            onClose={() => setSelectedExample(null)}
            factorName={selectedExample.factorName}
          />
        )}
      </AnimatePresence>
    </>
  );
}
