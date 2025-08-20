"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Search, Clock, Users, TrendingUp, Building, Filter, ChevronRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils";
import SessionSelector from "./SessionSelector";
import DocumentUpload from "./DocumentUpload";
import { useRouter } from "next/navigation";

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
  const [industryFilter, setIndustryFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [documentSessionId, setDocumentSessionId] = useState<string>("");
  
  // Handle session selection from SessionSelector
  const handleSessionSelect = (sessionId: string) => {
    router.push(`/interview/session?sessionId=${sessionId}`);
  };

  // Fetch all data on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

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
                         case_.overview.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || case_.type === typeFilter;
    const matchesIndustry = industryFilter === "all" || case_.industry === industryFilter;
    const matchesDifficulty = difficultyFilter === "all" || case_.difficulty === difficultyFilter;
    
    return matchesSearch && matchesType && matchesIndustry && matchesDifficulty;
  });

  // Get unique filter options
  const typeOptions = [...new Set(cases.map(c => c.type).filter(Boolean))];
  const industryOptions = [...new Set(cases.map(c => c.industry).filter(Boolean))];
  const difficultyOptions = [...new Set(cases.map(c => c.difficulty).filter(Boolean))];

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-6 py-8">
        {/* Header with Session Selector */}
        <div className="flex justify-between items-start mb-8">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 text-center"
          >
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Set Up Your Interview
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Choose your interview case, interviewer, and difficulty level for a personalized experience
            </p>
          </motion.div>
          
          {/* Session Selector in top right */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="ml-4"
          >
            <SessionSelector 
              onSelectSession={handleSessionSelect}
              currentSessionId=""
            />
          </motion.div>
        </div>

        {/* Progress Steps */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center mb-12"
        >
          <div className="flex items-center space-x-4">
            {["Case", "Interviewer", "Difficulty"].map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold",
                  currentStep > index + 1 ? "bg-green-500 text-white" :
                  currentStep === index + 1 ? "bg-blue-500 text-white" :
                  "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                )}>
                  {index + 1}
                </div>
                <span className={cn(
                  "ml-2 text-sm font-medium",
                  currentStep >= index + 1 ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"
                )}>
                  {step}
                </span>
                {index < 2 && (
                  <ChevronRight className="ml-4 w-4 h-4 text-gray-400" />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cases Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Select Interview Case
                </CardTitle>
                <CardDescription>
                  Choose from our curated collection of real interview cases
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search and Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search cases..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {typeOptions.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={industryFilter} onValueChange={setIndustryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Industries</SelectItem>
                      {industryOptions.map(industry => (
                        <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      {difficultyOptions.map(difficulty => (
                        <SelectItem key={difficulty} value={difficulty}>{difficulty}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Cases Grid */}
                <div className="grid gap-4 max-h-96 overflow-y-auto">
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
                            "cursor-pointer transition-all hover:shadow-lg",
                            selectedCase === case_.id ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950" : ""
                          )}
                          onClick={() => {
                            setSelectedCase(case_.id);
                            setCurrentStep(2);
                          }}
                        >
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <h3 className="font-semibold text-lg">{case_.title}</h3>
                              <div className="flex gap-2">
                                {case_.requires_documents && (
                                  <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                                    📄 Requires Documents
                                  </Badge>
                                )}
                                {case_.type && (
                                  <Badge className={getTypeColor(case_.type)}>
                                    {case_.type}
                                  </Badge>
                                )}
                                {case_.difficulty && (
                                  <Badge className={getDifficultyColor(case_.difficulty)}>
                                    {case_.difficulty}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                              {case_.overview}
                            </p>
                            
                            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                              <div className="flex items-center gap-4">
                                {case_.industry && (
                                  <div className="flex items-center gap-1">
                                    <Building className="w-4 h-4" />
                                    {case_.industry}
                                  </div>
                                )}
                                {case_.total_time && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {case_.total_time}
                                  </div>
                                )}
                              </div>
                              <div className="text-xs text-blue-600 dark:text-blue-400">
                                {case_.format}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                
                {filteredCases.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Filter className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No cases match your filters. Try adjusting your search criteria.
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Selection Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            {/* Interviewer Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Select Interviewer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {interviewers.map((interviewer) => (
                  <Card
                    key={interviewer.id}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md p-3",
                      selectedInterviewer === interviewer.id ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950" : ""
                    )}
                    onClick={() => {
                      setSelectedInterviewer(interviewer.id);
                      setCurrentStep(3);
                    }}
                  >
                    <div>
                      <h4 className="font-semibold">{interviewer.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{interviewer.role}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">{interviewer.company}</p>
                    </div>
                  </Card>
                ))}
              </CardContent>
            </Card>

            {/* Difficulty Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Select Difficulty
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {difficulties.map((difficulty) => (
                  <Card
                    key={difficulty.id}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md p-3",
                      selectedDifficulty === difficulty.id ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950" : ""
                    )}
                    onClick={() => setSelectedDifficulty(difficulty.id)}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{difficulty.display_name}</h4>
                      <Badge className={getDifficultyColor(difficulty.level)}>
                        {difficulty.level}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </CardContent>
            </Card>

            {/* Start Button */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
            >
              <Button
                onClick={handleStartInterview}
                disabled={!canProceed}
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
              >
                {canProceed ? "Start Interview" : "Select All Options"}
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
