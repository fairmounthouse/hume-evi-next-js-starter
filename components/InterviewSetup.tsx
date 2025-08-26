"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Search, Clock, Users, TrendingUp, Building, Filter, ChevronRight, Sparkles, ArrowLeft, ArrowRight, CheckCircle, X, Star, Zap, Target, Crown, Settings, Home } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils";
import SessionSelector from "./SessionSelector";
import DocumentUpload from "./DocumentUpload";

interface InterviewCase {
  id: string;
  title: string;
  format: string;
  type: string;
  difficulty: string;
  industry: string;
  stretch_area: string;
  total_time: string;
  overview: string;
  requires_documents: boolean; // NEW: Flag for document requirements
  phases: Array<{
    name: string;
    details: string;
    duration: number;
  }>;
}

interface InterviewerProfile {
  id: string;
  name: string;
  company: string;
  role: string;
}

interface DifficultyProfile {
  id: string;
  level: string;
  display_name: string;
}

interface InterviewSetupProps {
  onStartInterview: (selections: {
    caseId: string;
    interviewerId: string;
    difficultyId: string;
    sessionId?: string; // NEW: Pass session ID from document upload
  }) => void;
}

export default function InterviewSetup({ onStartInterview }: InterviewSetupProps) {
  const router = useRouter();
  const [cases, setCases] = useState<InterviewCase[]>([]);
  const [interviewers, setInterviewers] = useState<InterviewerProfile[]>([]);
  const [difficulties, setDifficulties] = useState<DifficultyProfile[]>([]);
  
  const [selectedCase, setSelectedCase] = useState<string>("");
  const [selectedInterviewer, setSelectedInterviewer] = useState<string>("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [industryFilter, setIndustryFilter] = useState<string>("all");
  const [formatFilter, setFormatFilter] = useState<string>("all");
  
  // Interviewer filters
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [seniorityFilter, setSeniorityFilter] = useState<string>("all");
  
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1); // 1 = Case Selection, 2 = Configuration
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [documentSessionId, setDocumentSessionId] = useState<string>("");
  
  // Scroll detection state
  const [isCasesScrollable, setIsCasesScrollable] = useState(false);
  const [isInterviewersScrollable, setIsInterviewersScrollable] = useState(false);
  const [isCasesAtBottom, setIsCasesAtBottom] = useState(false);
  const [isInterviewersAtBottom, setIsInterviewersAtBottom] = useState(false);
  const casesGridRef = useRef<HTMLDivElement>(null);
  const interviewersGridRef = useRef<HTMLDivElement>(null);

  
  // Handle session selection from SessionSelector
  const handleSessionSelect = (sessionId: string) => {
    router.push(`/interview/session?sessionId=${sessionId}`);
  };

  // Check if content is scrollable
  const checkScrollable = (interviewerCount?: number) => {
    if (casesGridRef.current) {
      const isScrollable = casesGridRef.current.scrollHeight > casesGridRef.current.clientHeight;
      setIsCasesScrollable(isScrollable);
    }
    
    if (interviewersGridRef.current) {
      const element = interviewersGridRef.current;
      const isScrollable = element.scrollHeight > element.clientHeight;
      
      // For interviewers, also check if we have 3+ items (since 2x2 grid fits 4 perfectly)
      const currentCount = interviewerCount || 0;
      const hasEnoughItems = currentCount >= 3;
      const shouldShowFade = isScrollable || hasEnoughItems;
      
      setIsInterviewersScrollable(shouldShowFade);
    }
  };

  // Check scroll position to determine if at bottom
  const checkScrollPosition = (element: HTMLDivElement, setAtBottom: (atBottom: boolean) => void) => {
    const { scrollTop, scrollHeight, clientHeight } = element;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px threshold
    setAtBottom(isAtBottom);
  };

  // Handle scroll events
  const handleCasesScroll = useCallback(() => {
    if (casesGridRef.current) {
      checkScrollPosition(casesGridRef.current, setIsCasesAtBottom);
    }
  }, []);

  const handleInterviewersScroll = useCallback(() => {
    if (interviewersGridRef.current) {
      checkScrollPosition(interviewersGridRef.current, setIsInterviewersAtBottom);
    }
  }, []);

  // Fetch all data on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

  // Check scrollable state when data or filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      // Calculate filtered interviewers count for the check
      const filteredCount = interviewers.filter(interviewer => {
        const matchesCompany = companyFilter === "all" || interviewer.company === companyFilter;
        const matchesSeniority = seniorityFilter === "all" || interviewer.role === seniorityFilter;
        return matchesCompany && matchesSeniority;
      }).length;
      
      checkScrollable(filteredCount);
    }, 100); // Small delay to ensure DOM is updated
    
    return () => clearTimeout(timer);
  }, [cases, interviewers, companyFilter, seniorityFilter, currentPage]);

  // Also check on window resize
  useEffect(() => {
    const handleResize = () => {
      // Calculate current filtered count for resize check
      const filteredCount = interviewers.filter(interviewer => {
        const matchesCompany = companyFilter === "all" || interviewer.company === companyFilter;
        const matchesSeniority = seniorityFilter === "all" || interviewer.role === seniorityFilter;
        return matchesCompany && matchesSeniority;
      }).length;
      
      checkScrollable(filteredCount);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [interviewers, companyFilter, seniorityFilter]);

  // Attach scroll listeners
  useEffect(() => {
    const casesElement = casesGridRef.current;
    const interviewersElement = interviewersGridRef.current;

    if (casesElement) {
      casesElement.addEventListener('scroll', handleCasesScroll);
    }
    
    if (interviewersElement) {
      interviewersElement.addEventListener('scroll', handleInterviewersScroll);
    }

    return () => {
      if (casesElement) {
        casesElement.removeEventListener('scroll', handleCasesScroll);
      }
      if (interviewersElement) {
        interviewersElement.removeEventListener('scroll', handleInterviewersScroll);
      }
    };
  }, [handleCasesScroll, handleInterviewersScroll]); // Re-attach when handlers change

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const { supabase } = await import("@/utils/supabase-client");
      
      const [casesRes, interviewersRes, difficultiesRes] = await Promise.all([
        supabase.from("interview_cases").select("*").eq("active", true),
        supabase.from("interviewer_profiles").select("*").eq("active", true),
        supabase.from("difficulty_profiles").select("*").eq("active", true)
      ]);

      if (!casesRes.error) setCases(casesRes.data || []);
      if (!interviewersRes.error) setInterviewers(interviewersRes.data || []);
      if (!difficultiesRes.error) setDifficulties(difficultiesRes.data || []);
    } catch (error) {
      console.error("Error fetching interview setup data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter cases based on search and filters
  const filteredCases = cases.filter(case_ => {
    const matchesSearch = case_.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         case_.overview.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         case_.industry?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         case_.stretch_area?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || case_.type === typeFilter;
    const matchesDifficulty = difficultyFilter === "all" || case_.difficulty === difficultyFilter;
    const matchesIndustry = industryFilter === "all" || case_.industry === industryFilter;
    const matchesFormat = formatFilter === "all" || case_.format === formatFilter;
    
    return matchesSearch && matchesType && matchesDifficulty && matchesIndustry && matchesFormat;
  });

  // Get unique filter options
  const typeOptions = [...new Set(cases.map(c => c.type).filter(Boolean))];
  const difficultyOptions = [...new Set(cases.map(c => c.difficulty).filter(Boolean))];
  const industryOptions = [...new Set(cases.map(c => c.industry).filter(Boolean))];
  const formatOptions = [...new Set(cases.map(c => c.format).filter(Boolean))];
  
  // Interviewer filter options
  const companyOptions = [...new Set(interviewers.map(i => i.company).filter(Boolean))];
  const seniorityOptions = [...new Set(interviewers.map(i => i.role).filter(Boolean))];
  
  // Filter interviewers
  const filteredInterviewers = interviewers.filter(interviewer => {
    const matchesCompany = companyFilter === "all" || interviewer.company === companyFilter;
    const matchesSeniority = seniorityFilter === "all" || interviewer.role === seniorityFilter;
    return matchesCompany && matchesSeniority;
  });

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setTypeFilter("all");
    setDifficultyFilter("all");
    setIndustryFilter("all");
    setFormatFilter("all");
  };
  
  // Clear interviewer filters
  const clearInterviewerFilters = () => {
    setCompanyFilter("all");
    setSeniorityFilter("all");
  };

  // Check if any filters are active
  const hasActiveFilters = searchQuery || typeFilter !== "all" || difficultyFilter !== "all" || industryFilter !== "all" || formatFilter !== "all";
  const hasActiveInterviewerFilters = companyFilter !== "all" || seniorityFilter !== "all";

  // Navigation functions
  const goToPage2 = () => {
    if (selectedCase) {
      setCurrentPage(2);
    }
  };

  const goBackToPage1 = () => {
    setCurrentPage(1);
  };

  const canProceed = selectedCase && selectedInterviewer && selectedDifficulty;

  const handleStartInterview = () => {
    if (canProceed) {
      // Check if the selected case requires documents
      const selectedCaseData = cases.find(c => c.id === selectedCase);
      const requiresDocuments = selectedCaseData?.requires_documents || false;
      
      if (requiresDocuments) {
        console.log("📋 Case requires documents - showing document upload screen");
        // Generate session ID once for document upload and interview
        const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        setDocumentSessionId(sessionId);
        setShowDocumentUpload(true);
      } else {
        console.log("📋 Case doesn't require documents - proceeding directly to interview");
        onStartInterview({
          caseId: selectedCase,
          interviewerId: selectedInterviewer,
          difficultyId: selectedDifficulty
        });
      }
    }
  };

  // Get selected case data for display
  const selectedCaseData = cases.find(c => c.id === selectedCase);
  const selectedInterviewerData = interviewers.find(i => i.id === selectedInterviewer);
  const selectedDifficultyData = difficulties.find(d => d.id === selectedDifficulty);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (currentPage === 2) {
          goBackToPage1();
        }
      }
      if (e.key === 'Enter' && selectedCase && currentPage === 1) {
        goToPage2();
      }
      if (e.key === 'Enter' && canProceed && currentPage === 2) {
        handleStartInterview();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, selectedCase, canProceed]);

  // Handle document upload completion
  const handleDocumentUploadComplete = () => {
    console.log("📋 Documents processed - proceeding to interview", { 
      documentSessionId,
      hasDocumentData: !!documentSessionId 
    });
    setShowDocumentUpload(false);
    
    // Use the same session ID that was used for document processing
    onStartInterview({
      caseId: selectedCase,
      interviewerId: selectedInterviewer,
      difficultyId: selectedDifficulty,
      sessionId: documentSessionId // Pass the session ID that has the document data
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case "easy": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "hard": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getTypeColor = (type: string) => {
    const colors = [
      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
      "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
    ];
    return colors[Math.abs(type.charCodeAt(0)) % colors.length];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  // Show document upload screen if case requires documents
  if (showDocumentUpload && documentSessionId) {
    return (
      <DocumentUpload 
        sessionId={documentSessionId}
        onContinue={handleDocumentUploadComplete}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 h-16">
        <div className="container mx-auto px-6 h-full flex items-center justify-between">
          {/* Left: Back button and Title */}
          <div className="flex items-center gap-4">
            {/* Page Back Button - Only on Page 2 */}
            {currentPage === 2 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={goBackToPage1}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            )}
            
            <h1 className="text-xl font-bold text-gray-900">
              Interview Setup
            </h1>
          </div>

          {/* Center: Progress bar */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-32 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${(currentPage / 2) * 100}%` }}
                />
              </div>
              <span className="text-sm text-gray-500">
                Step {currentPage} of 2
              </span>
            </div>
          </div>

          {/* Right: Session selector and Dashboard button */}
          <div className="flex items-center gap-3">
            <SessionSelector 
              onSelectSession={handleSessionSelect}
              currentSessionId=""
            />
            
            {/* Dashboard Back Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <Home className="w-4 h-4" />
              Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Page 1: Case Selection */}
      <AnimatePresence mode="wait">
        {currentPage === 1 && (
          <motion.div
            key="page1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="container mx-auto px-6 py-8"
          >
            {/* Clean Single-Row Filter Bar */}
            <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100 -mx-6 px-6 py-6 mb-8">
              <div className="flex items-center gap-4">
                {/* Search */}
                <div className="relative flex-1 max-w-lg">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search cases, industries, skills..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-gray-200 focus:border-blue-300 focus:ring-blue-100"
                  />
                </div>

                {/* All Filters in One Row */}
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-32 border-gray-200">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {typeOptions.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                  <SelectTrigger className="w-32 border-gray-200">
                    <SelectValue placeholder="Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    {difficultyOptions.map(difficulty => (
                      <SelectItem key={difficulty} value={difficulty}>{difficulty}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={industryFilter} onValueChange={setIndustryFilter}>
                  <SelectTrigger className="w-36 border-gray-200">
                    <SelectValue placeholder="Industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Industries</SelectItem>
                    {industryOptions.map(industry => (
                      <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={formatFilter} onValueChange={setFormatFilter}>
                  <SelectTrigger className="w-36 border-gray-200">
                    <SelectValue placeholder="Format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Formats</SelectItem>
                    {formatOptions.map(format => (
                      <SelectItem key={format} value={format}>{format}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Clear & Results */}
                <div className="flex items-center gap-3 ml-auto">
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      Clear
                    </Button>
                  )}
                  <div className="text-sm text-gray-500 font-medium">
                    {filteredCases.length} cases
                  </div>
                </div>
              </div>
            </div>

            {/* Cases Grid */}
            <div className="relative">
              <div 
                ref={casesGridRef}
                onScroll={handleCasesScroll}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-h-[70vh] overflow-y-auto pr-4 pt-2 pb-1 px-1"
              >
                <AnimatePresence>
                  {filteredCases.map((case_, index) => (
                  <motion.div
                    key={case_.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card 
                      className={cn(
                        "h-full cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg",
                        selectedCase === case_.id 
                          ? "ring-2 ring-blue-500 bg-blue-50 border-blue-200" 
                          : "hover:border-blue-200"
                      )}
                      onClick={() => setSelectedCase(case_.id)}
                    >
                      <CardContent className="p-6 h-full flex flex-col">
                        {/* Clean Header - Only Priority Info */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex gap-2">
                            {case_.difficulty && (
                              <Badge className={getDifficultyColor(case_.difficulty)} variant="secondary">
                                {case_.difficulty}
                              </Badge>
                            )}
                            {case_.requires_documents && (
                              <Badge variant="outline" className="text-xs">
                                📄
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 font-medium">
                            {case_.type}
                          </div>
                        </div>

                        {/* Title & Enhanced Meta */}
                        <div className="mb-4">
                          <h3 className="font-semibold text-lg leading-tight mb-3 line-clamp-2">
                            {case_.title}
                          </h3>
                          
                          {/* Primary Meta Row */}
                          <div className="flex items-center gap-3 text-sm text-gray-500 mb-2">
                            {case_.industry && (
                              <>
                                <span>{case_.industry}</span>
                                <span>•</span>
                              </>
                            )}
                            <span>{case_.total_time || "30 min"}</span>
                          </div>
                          
                          {/* Secondary Meta Row - Format */}
                          {case_.format && (
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs text-blue-600 border-blue-200 bg-blue-50/50">
                                {case_.format}
                              </Badge>
                            </div>
                          )}
                        </div>

                        {/* Description */}
                        <p className="text-sm text-gray-600 mb-6 flex-grow line-clamp-3 leading-relaxed">
                          {case_.overview}
                        </p>

                        {/* Clean Footer */}
                        <div className="flex items-center justify-between">
                          {case_.stretch_area && (
                            <div className="text-xs text-gray-400 flex items-center gap-1">
                              <Target className="w-3 h-3" />
                              {case_.stretch_area}
                            </div>
                          )}
                          <div className="flex-1" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              
              {/* Fade effect overlay - only show if scrollable and not at bottom */}
              {isCasesScrollable && !isCasesAtBottom && (
                <div className="absolute bottom-0 left-1 right-4 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
              )}
            </div>

            {/* No Results */}
            {filteredCases.length === 0 && (
              <div className="text-center py-16">
                <Filter className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No cases found</h3>
                <p className="text-gray-500 mb-4">
                  Try adjusting your search criteria or clearing filters
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearFilters}>
                    Clear all filters
                  </Button>
                )}
              </div>
            )}

            {/* Floating Action Button - Continue */}
            {selectedCase && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="fixed bottom-8 right-8 z-50"
              >
                <Button
                  size="lg"
                  onClick={goToPage2}
                  className="rounded-full h-14 px-6 bg-blue-600 hover:bg-blue-700 shadow-lg"
                >
                  Continue
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </motion.div>
            )}

          </motion.div>
        )}

        {/* Page 2: Configuration */}
        {currentPage === 2 && (
          <motion.div
            key="page2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="container mx-auto px-6 py-8"
          >


            {/* Two Column Layout */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Left: Interviewer Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Choose Interview Style</CardTitle>
                  <CardDescription>
                    Select an AI interviewer personality that matches your preparation goals
                  </CardDescription>
                  
                  {/* Interviewer Filters */}
                  <div className="flex gap-3 mt-4">
                    <Select value={companyFilter} onValueChange={setCompanyFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Company" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Companies</SelectItem>
                        {companyOptions.map(company => (
                          <SelectItem key={company} value={company}>{company}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select value={seniorityFilter} onValueChange={setSeniorityFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Seniority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        {seniorityOptions.map(role => (
                          <SelectItem key={role} value={role}>{role}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {hasActiveInterviewerFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearInterviewerFilters}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  
                  <div className="text-xs text-gray-500 mt-2">
                    {filteredInterviewers.length} interviewers
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <div 
                      ref={interviewersGridRef}
                      onScroll={handleInterviewersScroll}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-6 pt-2 pb-1 pl-1"
                    >
                    {filteredInterviewers.map((interviewer) => (
                      <Card
                        key={interviewer.id}
                        data-interviewer-card="true"
                        className={cn(
                          "cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg relative",
                          selectedInterviewer === interviewer.id 
                            ? "ring-2 ring-blue-500 bg-blue-50 border-blue-200" 
                            : "hover:border-blue-200"
                        )}
                        onClick={() => setSelectedInterviewer(interviewer.id)}
                      >
                        <CardContent className="p-6 text-center">
                          {selectedInterviewer === interviewer.id && (
                            <CheckCircle className="absolute top-2 right-2 w-5 h-5 text-green-500" />
                          )}
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                            {interviewer.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-1">{interviewer.name}</h4>
                          <p className="text-sm text-gray-600 mb-1">{interviewer.role}</p>
                          <p className="text-xs text-gray-500">{interviewer.company}</p>
                        </CardContent>
                      </Card>
                    ))}
                    </div>
                    
                    {/* Fade effect overlay - only show if scrollable and not at bottom */}
                    {isInterviewersScrollable && !isInterviewersAtBottom && (
                      <div className="absolute bottom-0 left-1 right-6 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Right: Difficulty Selection */}
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="text-lg">Select Difficulty Level</CardTitle>
                  <CardDescription>
                    Choose the challenge level that matches your experience
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-center">
                  <div className={cn(
                    "space-y-2 flex flex-col",
                    difficulties.length <= 2 ? "gap-6" : 
                    difficulties.length <= 4 ? "gap-3" : "gap-2"
                  )}>
                    {difficulties.map((difficulty) => (
                      <Card
                        key={difficulty.id}
                        className={cn(
                          "cursor-pointer transition-all duration-200 hover:shadow-md hover:translate-x-1 flex-1",
                          selectedDifficulty === difficulty.id 
                            ? "ring-2 ring-blue-500 bg-blue-50 border-blue-200" 
                            : "hover:border-blue-200"
                        )}
                        onClick={() => setSelectedDifficulty(difficulty.id)}
                      >
                        <CardContent className={cn(
                          "flex items-center gap-3",
                          difficulties.length <= 2 ? "p-5" :
                          difficulties.length <= 4 ? "p-4" : "p-3"
                        )}>
                          <div className={cn(
                            "rounded-xl flex items-center justify-center transition-all duration-200",
                            difficulties.length <= 2 ? "w-14 h-14" :
                            difficulties.length <= 4 ? "w-12 h-12" : "w-10 h-10",
                            difficulty.level === "entry" ? "bg-emerald-100 text-emerald-600" :
                            difficulty.level === "mid" ? "bg-amber-100 text-amber-600" :
                            difficulty.level === "senior" ? "bg-rose-100 text-rose-600" :
                            difficulty.level === "principal" ? "bg-violet-100 text-violet-600" :
                            difficulty.level === "custom" ? "bg-indigo-100 text-indigo-600" :
                            "bg-gray-100 text-gray-600"
                          )}>
                            {difficulty.level === "entry" ? <Star className={difficulties.length <= 2 ? "w-7 h-7" : difficulties.length <= 4 ? "w-6 h-6" : "w-5 h-5"} /> :
                             difficulty.level === "mid" ? <Zap className={difficulties.length <= 2 ? "w-7 h-7" : difficulties.length <= 4 ? "w-6 h-6" : "w-5 h-5"} /> :
                             difficulty.level === "senior" ? <Target className={difficulties.length <= 2 ? "w-7 h-7" : difficulties.length <= 4 ? "w-6 h-6" : "w-5 h-5"} /> :
                             difficulty.level === "principal" ? <Crown className={difficulties.length <= 2 ? "w-7 h-7" : difficulties.length <= 4 ? "w-6 h-6" : "w-5 h-5"} /> :
                             difficulty.level === "custom" ? <Settings className={difficulties.length <= 2 ? "w-7 h-7" : difficulties.length <= 4 ? "w-6 h-6" : "w-5 h-5"} /> : 
                             <Star className={difficulties.length <= 2 ? "w-7 h-7" : difficulties.length <= 4 ? "w-6 h-6" : "w-5 h-5"} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className={cn(
                              "font-semibold text-gray-900 truncate",
                              difficulties.length <= 2 ? "text-lg" :
                              difficulties.length <= 4 ? "text-base" : "text-sm"
                            )}>{difficulty.display_name}</h4>
                            <p className={cn(
                              "text-gray-600 capitalize truncate",
                              difficulties.length <= 2 ? "text-base" :
                              difficulties.length <= 4 ? "text-sm" : "text-xs"
                            )}>{difficulty.level} Level</p>
                          </div>
                          {selectedDifficulty === difficulty.id && (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-6 z-40">
              <div className="container mx-auto flex items-center justify-between">
                {/* Left: Summary Pills */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                    <CheckCircle className="w-4 h-4" />
                    Case Selected
                  </div>
                  {selectedInterviewerData && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      <CheckCircle className="w-4 h-4" />
                      {selectedInterviewerData.name}
                    </div>
                  )}
                  {selectedDifficultyData && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      <CheckCircle className="w-4 h-4" />
                      {selectedDifficultyData.display_name}
                    </div>
                  )}
                </div>

                {/* Right: Action Buttons */}
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={goBackToPage1}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleStartInterview}
                    disabled={!canProceed}
                    className="bg-blue-600 hover:bg-blue-700 px-8"
                  >
                    Start Interview
                  </Button>
                </div>
              </div>
            </div>

            {/* Spacer for fixed bottom bar */}
            <div className="h-24" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
