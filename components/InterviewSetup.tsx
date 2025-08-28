"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Search, Clock, Users, TrendingUp, Building, Filter, ChevronRight, Sparkles, ArrowLeft, ArrowRight, CheckCircle, X, Star, Zap, Target, Crown, Settings, Home, User } from "lucide-react";
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

// New combined profile interfaces
interface CompanyProfile {
  id: string;
  name: string;
  display_name: string;
  description?: string;
}

interface SeniorityProfile {
  id: string;
  level: string;
  display_name: string;
  description?: string;
}

interface DifficultyProfile {
  id: string;
  level: string;
  display_name: string;
  description?: string;
}

interface CombinedInterviewerProfile {
  id: string;
  alias: string;
  name: string; // Human-readable name like "John Doe"
  user_id?: string | null; // null = default for everyone, UUID = custom for specific user
  difficulty_profiles: DifficultyProfile;
  seniority_profiles: SeniorityProfile;
  company_profiles: CompanyProfile;
}

interface InterviewSetupProps {
  onStartInterview: (selections: {
    caseId: string;
    interviewerProfileId: string; // Updated to use combined profile ID
    sessionId?: string; // NEW: Pass session ID from document upload
  }) => void;
}

export default function InterviewSetup({ onStartInterview }: InterviewSetupProps) {
  const router = useRouter();
  const [cases, setCases] = useState<InterviewCase[]>([]);
  const [combinedProfiles, setCombinedProfiles] = useState<CombinedInterviewerProfile[]>([]);
  const [companyProfiles, setCompanyProfiles] = useState<CompanyProfile[]>([]);
  const [seniorityProfiles, setSeniorityProfiles] = useState<SeniorityProfile[]>([]);
  const [difficultyProfiles, setDifficultyProfiles] = useState<DifficultyProfile[]>([]);
  
  const [selectedCase, setSelectedCase] = useState<string>("");
  const [selectedProfile, setSelectedProfile] = useState<string>("");
  
  // Custom profile creation state
  const [customProfileName, setCustomProfileName] = useState("John Doe");
  const [customProfileAlias, setCustomProfileAlias] = useState("");
  const [customCompanyId, setCustomCompanyId] = useState("");
  const [customSeniorityId, setCustomSeniorityId] = useState("");
  const [customDifficultyId, setCustomDifficultyId] = useState("");
  
  // Company search state
  const [companySearchQuery, setCompanySearchQuery] = useState("");
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  
  // Profile search state
  const [profileSearchQuery, setProfileSearchQuery] = useState("");
  const [availableProfilesFilter, setAvailableProfilesFilter] = useState(""); // Separate filter for available profiles sidebar
  const [suggestedProfile, setSuggestedProfile] = useState<CombinedInterviewerProfile | null>(null);
  
  // Fuzzy search function for profiles
  const fuzzySearchProfiles = (profiles: CombinedInterviewerProfile[], query: string) => {
    if (!query.trim()) return profiles;
    
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    
    return profiles.filter(profile => {
      const searchableText = [
        profile.name || '',
        profile.alias || '',
        profile.company_profiles.display_name || '',
        profile.company_profiles.name || '',
        profile.seniority_profiles.display_name || '',
        profile.seniority_profiles.level || '',
        profile.difficulty_profiles.display_name || '',
        profile.difficulty_profiles.level || '',
        profile.user_id ? 'custom' : 'default'
      ].join(' ').toLowerCase();
      
      return searchTerms.every(term => searchableText.includes(term));
    });
  };

  // Filter available profiles based on current form selections AND search query
  const getFilteredAvailableProfiles = () => {
    let filtered = combinedProfiles;
    
    // Apply search filter first
    if (availableProfilesFilter.trim()) {
      filtered = fuzzySearchProfiles(filtered, availableProfilesFilter);
    }
    
    // Apply form-based filtering (show profiles matching current selections)
    if (customCompanyId || customSeniorityId || customDifficultyId) {
      filtered = filtered.filter(profile => {
        const companyMatch = !customCompanyId || profile.company_profiles.id === customCompanyId;
        const seniorityMatch = !customSeniorityId || profile.seniority_profiles.id === customSeniorityId;
        const difficultyMatch = !customDifficultyId || profile.difficulty_profiles.id === customDifficultyId;
        return companyMatch && seniorityMatch && difficultyMatch;
      });
    }
    
    return filtered;
  };

  // Check for exact matches when user is creating custom profile
  const checkForExactMatch = () => {
    if (!customCompanyId || !customSeniorityId || !customDifficultyId) {
      setSuggestedProfile(null);
      return;
    }

    const exactMatch = combinedProfiles.find(profile => 
      profile.company_profiles.id === customCompanyId &&
      profile.seniority_profiles.id === customSeniorityId &&
      profile.difficulty_profiles.id === customDifficultyId
    );

    setSuggestedProfile(exactMatch || null);
  };

  // Populate form fields from selected available profile
  const populateFormFromProfile = (profile: CombinedInterviewerProfile) => {
    setCustomProfileName(profile.name || "");
    setCustomProfileAlias(profile.alias || "");
    setCustomCompanyId(profile.company_profiles.id);
    setCustomSeniorityId(profile.seniority_profiles.id);
    setCustomDifficultyId(profile.difficulty_profiles.id);
    
    // Clear any existing selection since we're populating form
    setSelectedProfile("");
    setSuggestedProfile(null);
  };

  // Run exact match check whenever custom selections change
  useEffect(() => {
    checkForExactMatch();
  }, [customCompanyId, customSeniorityId, customDifficultyId, combinedProfiles]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [industryFilter, setIndustryFilter] = useState<string>("all");
  const [formatFilter, setFormatFilter] = useState<string>("all");
  
  // Profile filters (matching case selection design)
  const [profileTypeFilter, setProfileTypeFilter] = useState<string>("all"); // "default" or "custom" or "all"
  const [profileCompanyFilter, setProfileCompanyFilter] = useState<string>("all");
  const [profileSeniorityFilter, setProfileSeniorityFilter] = useState<string>("all");
  const [profileDifficultyFilter, setProfileDifficultyFilter] = useState<string>("all");
  
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1); // 1 = Case Selection, 2 = Profile Selection, 3 = Custom Profile Creation, 4 = Documents (optional), 5 = Device Setup
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [documentSessionId, setDocumentSessionId] = useState<string>("");
  
  // Get selected case data to determine if documents are required
  const selectedCaseData = cases.find(c => c.id === selectedCase);
  const requiresDocuments = selectedCaseData?.requires_documents || false;
  const totalSteps = requiresDocuments ? 5 : 4; // Case -> Profile -> [Custom Profile] -> [Documents] -> Device
  
  // Scroll detection state
  const [isCasesScrollable, setIsCasesScrollable] = useState(false);
  const [isInterviewersScrollable, setIsInterviewersScrollable] = useState(false);
  const [isCasesAtBottom, setIsCasesAtBottom] = useState(false);
  const [isInterviewersAtBottom, setIsInterviewersAtBottom] = useState(false);
  const casesGridRef = useRef<HTMLDivElement>(null);
  const interviewersGridRef = useRef<HTMLDivElement>(null);

  
  // Handle session selection from SessionSelector
  const handleSessionSelect = (sessionId: string) => {
    // Redirect to the session viewer page, not the interview session page
    router.push(`/sessions/${sessionId}`);
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
      // Calculate filtered profiles count for the check
      const filteredCount = combinedProfiles.filter(profile => {
        if (profileTypeFilter === "default") return profile.user_id === null;
        if (profileTypeFilter === "custom") return profile.user_id !== null;
        return true; // "all"
      }).length;
      
      checkScrollable(filteredCount);
    }, 100); // Small delay to ensure DOM is updated
    
    return () => clearTimeout(timer);
  }, [cases, combinedProfiles, profileTypeFilter, currentPage]);

  // Also check on window resize
  useEffect(() => {
    const handleResize = () => {
      // Calculate current filtered count for resize check
      const filteredCount = combinedProfiles.filter(profile => {
        if (profileTypeFilter === "default") return profile.user_id === null;
        if (profileTypeFilter === "custom") return profile.user_id !== null;
        return true; // "all"
      }).length;
      
      checkScrollable(filteredCount);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [combinedProfiles, profileTypeFilter]);

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
      
      // Fetch cases from Supabase directly
      const casesRes = await supabase.from("interview_cases").select("*").eq("active", true);
      
      // Fetch profiles from our new API endpoints
      const [combinedProfilesRes, companyProfilesRes, seniorityProfilesRes, difficultyProfilesRes] = await Promise.all([
        fetch('/api/profiles/interviewer').then(res => res.json()),
        fetch('/api/profiles/company').then(res => res.json()),
        fetch('/api/profiles/seniority').then(res => res.json()),
        fetch('/api/profiles/difficulty').then(res => res.json()) // Use new difficulty API with prompt content
      ]);

      if (!casesRes.error) setCases(casesRes.data || []);
      if (combinedProfilesRes.success) setCombinedProfiles(combinedProfilesRes.profiles || []);
      if (companyProfilesRes.success) setCompanyProfiles(companyProfilesRes.profiles || []);
      if (seniorityProfilesRes.success) setSeniorityProfiles(seniorityProfilesRes.profiles || []);
      if (difficultyProfilesRes.success) setDifficultyProfiles(difficultyProfilesRes.profiles || []);
      
      console.log("📊 Loaded profile data:", {
        combinedProfiles: combinedProfilesRes.profiles?.length || 0,
        companyProfiles: companyProfilesRes.profiles?.length || 0,
        seniorityProfiles: seniorityProfilesRes.profiles?.length || 0,
        difficultyProfiles: difficultyProfilesRes.data?.length || 0
      });
    } catch (error) {
      console.error("Error fetching interview setup data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Create custom interviewer profile
  const createCustomProfile = async () => {
    if (!customProfileName || !customProfileAlias || !customCompanyId || !customSeniorityId || !customDifficultyId) {
      alert("Please fill in all fields for the custom profile");
      return;
    }

    try {
      const response = await fetch('/api/profiles/interviewer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: customProfileName,
          alias: customProfileAlias,
          company_profile_id: customCompanyId,
          seniority_profile_id: customSeniorityId,
          difficulty_profile_id: customDifficultyId
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Add the new profile to the list
        setCombinedProfiles(prev => [...prev, result.profile]);
        
        // Select the new profile
        setSelectedProfile(result.profile.id);
        
        // Reset form
        setCustomProfileName("John Doe");
        setCustomProfileAlias("");
        setCustomCompanyId("");
        setCustomSeniorityId("");
        setCustomDifficultyId("");
        
        console.log("✅ Created custom profile:", result.profile.alias);
        
        // Directly proceed to interview with the new profile ID
        if (requiresDocuments) {
          setCurrentPage(4);
          const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          setDocumentSessionId(sessionId);
          setShowDocumentUpload(true);
        } else {
          // Directly call onStartInterview with the new profile ID
          onStartInterview({
            caseId: selectedCase,
            interviewerProfileId: result.profile.id, // Use the new profile ID directly
            sessionId: undefined
          });
        }
      } else {
        alert(`Failed to create profile: ${result.error}`);
      }
    } catch (error) {
      console.error("Error creating custom profile:", error);
      alert("Failed to create custom profile");
    }
  };

  // Filter profiles based on all filters (matching case selection logic)
  const filteredProfiles = combinedProfiles.filter(profile => {
    // Type filter
    if (profileTypeFilter === "default" && profile.user_id !== null) return false;
    if (profileTypeFilter === "custom" && profile.user_id === null) return false;
    
    // Company filter
    if (profileCompanyFilter !== "all" && profile.company_profiles.name !== profileCompanyFilter) return false;
    
    // Seniority filter
    if (profileSeniorityFilter !== "all" && profile.seniority_profiles.level !== profileSeniorityFilter) return false;
    
    // Difficulty filter
    if (profileDifficultyFilter !== "all" && profile.difficulty_profiles.level !== profileDifficultyFilter) return false;
    
    return true;
  });

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
  
  // Profile filter options (no longer needed for filtering, but kept for potential future use)
  const companyOptions = [...new Set(companyProfiles.map(c => c.display_name).filter(Boolean))];
  const seniorityOptions = [...new Set(seniorityProfiles.map(s => s.display_name).filter(Boolean))];
  const difficultyLevelOptions = [...new Set(difficultyProfiles.map(d => d.display_name).filter(Boolean))];

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setTypeFilter("all");
    setDifficultyFilter("all");
    setIndustryFilter("all");
    setFormatFilter("all");
  };
  
  // Clear profile filters
  const clearProfileFilters = () => {
    setProfileTypeFilter("all");
  };

  // Check if any filters are active
  const hasActiveFilters = searchQuery || typeFilter !== "all" || difficultyFilter !== "all" || industryFilter !== "all" || formatFilter !== "all";
  const hasActiveProfileFilters = profileTypeFilter !== "all";

  // Navigation functions
  const goToNextPage = () => {
    if (currentPage === 1 && selectedCase) {
      setCurrentPage(2);
    } else if (currentPage === 2 && selectedProfile) {
      if (requiresDocuments) {
        // Go to documents page (step 4)
        setCurrentPage(4);
        // Generate session ID for document upload
        const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        setDocumentSessionId(sessionId);
        setShowDocumentUpload(true);
      } else {
        // Skip documents, go directly to device setup or start interview
        proceedToInterview();
      }
    } else if (currentPage === 3) {
      // From custom profile creation, should not reach here as it handles its own navigation
      if (requiresDocuments) {
        setCurrentPage(4);
        const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        setDocumentSessionId(sessionId);
        setShowDocumentUpload(true);
      } else {
        proceedToInterview();
      }
    } else if (currentPage === 4) {
      // From documents to device setup or interview
      proceedToInterview();
    }
  };

  // Reset available profiles filter when entering custom profile creation
  const goToCustomProfilePage = () => {
    setCurrentPage(3);
    setAvailableProfilesFilter(""); // Reset the sidebar filter
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      if (currentPage === 4) {
        setShowDocumentUpload(false);
      }
      setCurrentPage(currentPage - 1);
    }
  };

  const proceedToInterview = () => {
    const selectedProfileData = combinedProfiles.find(p => p.id === selectedProfile);
    
    console.log("🚀 Proceeding to interview with configuration:", {
      caseId: selectedCase,
      interviewerProfileId: selectedProfile,
      profileAlias: selectedProfileData?.alias,
      sessionId: documentSessionId,
      hasDocuments: requiresDocuments
    });
    
        onStartInterview({
          caseId: selectedCase,
      interviewerProfileId: selectedProfile,
      sessionId: requiresDocuments ? documentSessionId : undefined
    });
  };

  const canProceedFromPage1 = selectedCase;
  const canProceedFromPage2 = selectedProfile;

  // Get selected profile data for display
  const selectedProfileData = combinedProfiles.find(p => p.id === selectedProfile);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (currentPage > 1) {
          goToPreviousPage();
        }
      }
      if (e.key === 'Enter' && canProceedFromPage1 && currentPage === 1) {
        goToNextPage();
      }
      if (e.key === 'Enter' && canProceedFromPage2 && currentPage === 2) {
        goToNextPage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, canProceedFromPage1, canProceedFromPage2]);

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
      interviewerProfileId: selectedProfile,
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

  // Create a short, readable summary from the difficulty description bullets
  const summarizeDescription = (text?: string, maxItems: number = 2): string => {
    if (!text) return "";
    return text
      .split("\n")
      .map(line => line.replace(/^\-\s*/, "").trim())
      .filter(Boolean)
      .slice(0, maxItems)
      .join(" • ");
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
            {/* Page Back Button - Show on pages 2+ */}
            {currentPage > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={goToPreviousPage}
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
                  style={{ width: `${(currentPage / totalSteps) * 100}%` }}
                />
              </div>
              <span className="text-sm text-gray-500">
                Step {currentPage} of {totalSteps}
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
                  onClick={goToNextPage}
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
            {/* Header */}
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Choose Interview Style</h2>
              <p className="text-gray-600 text-lg">Select an AI interviewer personality that matches your preparation goals</p>
            </div>

            {/* Filters and Create Custom Button */}
            <div className="flex flex-wrap gap-3 mb-6 items-center">
              <Select value={profileTypeFilter} onValueChange={setProfileTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>

              <Select value={profileCompanyFilter} onValueChange={setProfileCompanyFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Companies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Companies</SelectItem>
                  {companyProfiles.map(company => (
                    <SelectItem key={company.id} value={company.name}>{company.display_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={profileSeniorityFilter} onValueChange={setProfileSeniorityFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {seniorityProfiles.map(seniority => (
                    <SelectItem key={seniority.id} value={seniority.level}>{seniority.display_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={profileDifficultyFilter} onValueChange={setProfileDifficultyFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Difficulties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Difficulties</SelectItem>
                  {difficultyProfiles.map(difficulty => (
                    <SelectItem key={difficulty.id} value={difficulty.level}>{difficulty.display_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {(profileTypeFilter !== "all" || profileCompanyFilter !== "all" || profileSeniorityFilter !== "all" || profileDifficultyFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setProfileTypeFilter("all");
                    setProfileCompanyFilter("all");
                    setProfileSeniorityFilter("all");
                    setProfileDifficultyFilter("all");
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}

              {/* Create Custom Button - Same Height as Filters */}
              <Button
                variant="outline"
                onClick={goToCustomProfilePage}
                className="border-2 border-dashed border-blue-300 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 hover:border-blue-400 text-blue-700 font-medium"
              >
                <Settings className="w-4 h-4 mr-2" />
                Create Custom
              </Button>
              
              <div className="text-sm text-gray-500 flex items-center ml-auto">
                {filteredProfiles.length} profiles available
              </div>
            </div>

            {/* Profiles Grid */}
            <div className="relative">
              <div 
                ref={interviewersGridRef}
                onScroll={handleInterviewersScroll}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-h-[70vh] overflow-y-auto pr-4 pt-2 pb-1 px-1"
              >
                {filteredProfiles.map((profile) => (
                  <Card
                    key={profile.id}
                    data-profile-card="true"
                    className={cn(
                      "cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg relative",
                      selectedProfile === profile.id 
                        ? "ring-2 ring-blue-500 bg-blue-50 border-blue-200" 
                        : "hover:border-blue-200"
                    )}
                    onClick={() => setSelectedProfile(profile.id)}
                  >
                    <CardContent className="p-6 text-center">
                      {selectedProfile === profile.id && (
                        <CheckCircle className="absolute top-2 right-2 w-5 h-5 text-green-500" />
                      )}
                      
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                        {(profile.name || profile.alias).split(' ').map(n => n[0]).join('').toUpperCase()}
                      </div>
                      
                      <h4 className="font-semibold text-gray-900 mb-1">{profile.name || profile.alias}</h4>
                      <p className="text-sm text-gray-500 mb-2">{profile.alias}</p>
                      
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-1 justify-center">
                          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                            <Building className="w-3 h-3 mr-1" />
                            {profile.company_profiles.display_name}
                          </Badge>
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                            <Users className="w-3 h-3 mr-1" />
                            {profile.seniority_profiles.display_name}
                          </Badge>
                          <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                            <Target className="w-3 h-3 mr-1" />
                            {profile.difficulty_profiles.display_name || profile.difficulty_profiles.level}
                          </Badge>
                        </div>
                        {profile.user_id !== null && (
                          <Badge variant="default" className="text-xs bg-purple-100 text-purple-800 w-fit mx-auto">
                            <Crown className="w-3 h-3 mr-1" />
                            Custom Profile
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {/* Fade effect overlay - only show if scrollable and not at bottom */}
              {isInterviewersScrollable && !isInterviewersAtBottom && (
                <div className="absolute bottom-0 left-1 right-4 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
              )}
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
                  {selectedProfileData && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      <CheckCircle className="w-4 h-4" />
                      {selectedProfileData.name || selectedProfileData.alias}
                    </div>
                  )}
                </div>

                {/* Right: Action Buttons */}
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={goToPreviousPage}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={goToNextPage}
                    disabled={!canProceedFromPage2}
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

        {/* Page 3: Custom Profile Creation */}
        {currentPage === 3 && (
          <motion.div
            key="page3"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="bg-gray-50 min-h-screen"
          >
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-8 text-center">
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">Create Custom Interviewer Profile</h1>
              <p className="text-gray-600 text-sm">Design your perfect interviewer by combining company culture, seniority level, and difficulty</p>
            </div>

            {/* Main Content - Split Layout */}
            <div className="flex h-[calc(100vh-280px)]">
              
              {/* Left Panel - Form */}
              <div className="flex-1 bg-white overflow-y-auto p-8">
                
                {/* Interviewer Details Section */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-4 h-4 text-indigo-600" />
                    <h2 className="text-sm font-semibold text-gray-700">Interviewer Details</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">Name</label>
                      <Input
                        placeholder="John Doe"
                        value={customProfileName}
                        onChange={(e) => setCustomProfileName(e.target.value)}
                        className="w-full h-10"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">Alias</label>
                      <Input
                        placeholder="My Google Interview Style"
                        value={customProfileAlias}
                        onChange={(e) => setCustomProfileAlias(e.target.value)}
                        className="w-full h-10"
                      />
                      <p className="text-xs text-gray-500 mt-1">A memorable name for this interviewer style</p>
                    </div>
                  </div>
                </div>

                {/* Company Culture Section */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-indigo-600" />
                      <h2 className="text-sm font-semibold text-gray-700">Company Culture</h2>
                    </div>
                    <div className="w-48 relative">
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                        <Input
                          placeholder="Search companies..."
                          value={companySearchQuery}
                          onChange={(e) => setCompanySearchQuery(e.target.value)}
                          onFocus={() => setIsCompanyDropdownOpen(true)}
                          onBlur={() => setTimeout(() => setIsCompanyDropdownOpen(false), 200)}
                          className="h-9 text-sm pl-8 pr-3"
                        />
                      </div>
                      {isCompanyDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg mt-1 max-h-40 overflow-y-auto shadow-lg z-10">
                          {companyProfiles
                            .filter(company => 
                              company.display_name.toLowerCase().includes(companySearchQuery.toLowerCase()) ||
                              company.name.toLowerCase().includes(companySearchQuery.toLowerCase())
                            )
                            .map(company => (
                              <div
                                key={company.id}
                                className="p-3 hover:bg-indigo-50 cursor-pointer text-sm"
                                onClick={() => {
                                  setCustomCompanyId(company.id);
                                  setCompanySearchQuery(company.display_name);
                                  setIsCompanyDropdownOpen(false);
                                }}
                              >
                                {company.display_name}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-48 overflow-y-auto">
                    {companyProfiles.slice(0, 12).map(company => {
                      // Get description from database or fallback to default descriptions
                      const getCompanyDescription = (companyName: string) => {
                        const descriptions: Record<string, string> = {
                          'google': "Technical excellence, scalability, innovation",
                          'amazon': "Customer obsession, leadership principles", 
                          'microsoft': "Collaboration, growth mindset, inclusive",
                          'apple': "Attention to detail, user experience",
                          'meta': "Moving fast, being bold, social impact",
                          'startup': "Versatility, ownership, problem-solving",
                          'netflix': "Culture of freedom and responsibility",
                          'spotify': "Music-first, data-driven innovation",
                          'uber': "Move fast, scale globally, solve problems",
                          'airbnb': "Belong anywhere, create experiences",
                          'tesla': "Accelerate sustainable transport",
                          'linkedin': "Connect professionals, create opportunity",
                          'twitter': "Real-time information, global conversation",
                          'adobe': "Creativity, digital experiences",
                          'salesforce': "Customer success, equality, innovation"
                        };
                        return descriptions[companyName.toLowerCase()] || company.description || "Innovation and excellence";
                      };

                      return (
                        <div
                          key={company.id}
                          className={cn(
                            "p-4 border-2 rounded-lg cursor-pointer transition-all duration-200",
                            customCompanyId === company.id 
                              ? "border-indigo-500 bg-indigo-50" 
                              : "border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-25"
                          )}
                          onClick={() => {
                            setCustomCompanyId(company.id);
                            setCompanySearchQuery(company.display_name);
                          }}
                        >
                          <div className="font-semibold text-gray-900 text-sm mb-2">{company.display_name}</div>
                          <div className="text-sm text-gray-600 leading-relaxed">
                            {getCompanyDescription(company.name)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Show "More companies available" hint if there are more than 12 */}
                  {companyProfiles.length > 12 && (
                    <div className="mt-3 text-center">
                      <div className="text-xs text-gray-500 bg-gray-50 rounded-lg py-2 px-3 inline-flex items-center gap-2">
                        <Search className="w-3 h-3" />
                        {companyProfiles.length - 12} more companies available in search
                      </div>
                    </div>
                  )}
                </div>

                {/* Seniority & Difficulty Levels */}
                <div className="space-y-4">
                  
                  {/* Seniority Level */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="w-4 h-4 text-indigo-600" />
                      <h2 className="text-sm font-semibold text-gray-700">Seniority Level</h2>
                    </div>
                    <div className="grid grid-cols-5 gap-3">
                      {seniorityProfiles.map((seniority, index) => (
                        <div
                          key={seniority.id}
                          className={cn(
                            "p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 text-center",
                            customSeniorityId === seniority.id 
                              ? "border-indigo-500 bg-indigo-50" 
                              : "border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-25"
                          )}
                          onClick={() => setCustomSeniorityId(seniority.id)}
                        >
                          <div className="text-sm text-gray-700 mb-2">{seniority.display_name}</div>
                          <div className="flex gap-1 justify-center">
                            {[...Array(5)].map((_, dotIndex) => (
                              <div
                                key={dotIndex}
                                className={cn(
                                  "w-1.5 h-1.5 rounded-full",
                                  dotIndex <= index ? "bg-indigo-600" : "bg-gray-300"
                                )}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Difficulty Level */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="w-4 h-4 text-indigo-600" />
                      <h2 className="text-sm font-semibold text-gray-700">Difficulty Level</h2>
                    </div>
                    <div className="grid grid-cols-5 gap-3">
                      {difficultyProfiles.map((difficulty, index) => {
                        const colors = [
                          "bg-green-500", // Easy
                          "bg-yellow-500", // Medium  
                          "bg-red-500", // Hard
                          "bg-red-600", // Expert
                          "bg-red-800" // Extreme
                        ];
                        return (
                          <div
                            key={difficulty.id}
                            className={cn(
                              "p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 text-center",
                              customDifficultyId === difficulty.id 
                                ? "border-indigo-500 bg-indigo-50" 
                                : "border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-25"
                            )}
                            onClick={() => setCustomDifficultyId(difficulty.id)}
                          >
                            <div className="text-sm text-gray-700 mb-2">{difficulty.display_name}</div>
                            <div className="flex gap-1 justify-center">
                              {[...Array(5)].map((_, dotIndex) => (
                                <div
                                  key={dotIndex}
                                  className={cn(
                                    "w-1.5 h-1.5 rounded-full",
                                    dotIndex <= index ? colors[index] : "bg-gray-300"
                                  )}
                                />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Panel - Available Profiles */}
              <div className="w-96 bg-gray-50 border-l border-gray-200 flex flex-col">
                <div className="p-5 border-b border-gray-200 bg-white">
                  <div className="text-base font-semibold text-gray-700 mb-1">Available Profiles</div>
                  <div className="text-sm text-gray-600">
                    {selectedProfile ? "Profile selected - click Continue to use it" : "Or choose from existing profiles"}
                  </div>
                </div>

                {/* Exact Match Suggestion Banner */}
                {suggestedProfile && !selectedProfile && (
                  <div className="mx-5 mt-5 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                        {(suggestedProfile.name || suggestedProfile.alias).split(' ').map(n => n[0]).join('').toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-blue-900 mb-1">Exact Match Found!</div>
                        <div className="text-xs text-blue-700 mb-2">
                          "{suggestedProfile.name || suggestedProfile.alias}" has the same settings
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedProfile(suggestedProfile.id);
                              setSuggestedProfile(null);
                            }}
                            className="text-xs bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700"
                          >
                            Use Existing
                          </button>
                          <button
                            onClick={() => setSuggestedProfile(null)}
                            className="text-xs bg-white text-blue-600 border border-blue-300 px-3 py-1 rounded-md hover:bg-blue-50"
                          >
                            Create New
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="p-5 border-b border-gray-200 bg-white">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search: easy amazon, hard google..."
                      value={availableProfilesFilter}
                      onChange={(e) => setAvailableProfilesFilter(e.target.value)}
                      className="pl-10 bg-white"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                  {getFilteredAvailableProfiles().slice(0, 8).map((profile) => {
                    const avatarColors = [
                      "from-purple-500 to-purple-600",
                      "from-blue-500 to-blue-600", 
                      "from-green-500 to-green-600",
                      "from-pink-500 to-pink-600",
                      "from-yellow-500 to-yellow-600",
                      "from-red-500 to-red-600",
                      "from-indigo-500 to-indigo-600"
                    ];
                    const colorIndex = parseInt(profile.id) % avatarColors.length;
                    
                    return (
                      <div
                        key={profile.id}
                        className={cn(
                          "p-3 border rounded-lg cursor-pointer transition-all duration-200 hover:translate-x-1",
                          selectedProfile === profile.id
                            ? "border-blue-500 bg-blue-50 shadow-md"
                            : "border-gray-200 bg-white hover:border-indigo-500 hover:bg-indigo-25"
                        )}
                        onClick={() => {
                          if (selectedProfile === profile.id) {
                            // If already selected, deselect it
                            setSelectedProfile("");
                          } else {
                            // If not selected, populate form fields from this profile
                            populateFormFromProfile(profile);
                          }
                        }}
                      >
                        <div className="flex items-start gap-3 mb-2">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-semibold bg-gradient-to-br flex-shrink-0",
                            avatarColors[colorIndex]
                          )}>
                            {(profile.name || profile.alias).split(' ').map(n => n[0]).join('').toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 text-sm truncate">{profile.name || profile.alias}</div>
                            <div className="text-xs text-gray-600 truncate">{profile.alias}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            {profile.user_id && (
                              <div className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                                Custom
                              </div>
                            )}
                            {selectedProfile === profile.id && (
                              <CheckCircle className="w-4 h-4 text-blue-600" />
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <Building className="w-3 h-3 text-blue-600" />
                            <span className="text-xs text-blue-700 font-medium">{profile.company_profiles.display_name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-green-600" />
                            <span className="text-xs text-green-700 font-medium">{profile.seniority_profiles.display_name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Target className="w-3 h-3 text-orange-600" />
                            <span className="text-xs text-orange-700 font-medium">{profile.difficulty_profiles.display_name}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-5 border-t border-gray-200 text-center bg-white">
                  <button 
                    className="text-indigo-600 text-sm font-medium hover:text-indigo-700 flex items-center gap-1 mx-auto"
                    onClick={() => setCurrentPage(2)}
                  >
                    View all profiles
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Fixed Footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-8 py-5 flex items-center justify-between z-50 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>Case Selected</span>
                </div>
                {selectedProfile && (
                  <div className="flex items-center gap-2 text-blue-600 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    <span>Profile Selected</span>
                  </div>
                )}
                {!selectedProfile && customCompanyId && customSeniorityId && customDifficultyId && (
                  <div className="flex items-center gap-2 text-purple-600 text-sm">
                    <Settings className="w-4 h-4" />
                    <span>Creating New Profile</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentPage(2);
                    setSelectedProfile(""); // Clear selection when going back
                  }}
                >
                  Back
                </Button>
                {selectedProfile ? (
                  <Button
                    onClick={() => {
                      if (requiresDocuments) {
                        setCurrentPage(4);
                        const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
                        setDocumentSessionId(sessionId);
                        setShowDocumentUpload(true);
                      } else {
                        proceedToInterview();
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Continue with Selected
                  </Button>
                ) : (
                  <Button
                    onClick={createCustomProfile}
                    disabled={!customProfileName || !customProfileAlias || !customCompanyId || !customSeniorityId || !customDifficultyId}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    Create & Continue
                  </Button>
                )}
              </div>
            </div>
            
            {/* Spacer for fixed footer */}
            <div className="h-20"></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
