"use client";

import { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from "react";
import { useDebouncedCallback } from 'use-debounce';
import { useRouter } from "next/navigation";
import { useInterviewSetupData } from "@/hooks/useInterviewSetupData";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Search, Clock, Users, TrendingUp, Building, Filter, ChevronRight, Sparkles, ArrowLeft, ArrowRight, CheckCircle, X, Star, Zap, Target, Crown, Settings, Home, User, AlertCircle, FileText, DollarSign, Tag, Factory, Package, BarChart3, Rocket, Handshake, PieChart, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils";
import SessionSelector from "./SessionSelector";
// Lazy load heavy components
const DocumentUpload = lazy(() => import("./DocumentUpload"));
import ScrollFadeIndicator from "./ScrollFadeIndicator";
import { InterviewSetupSkeleton } from "./ui/enhanced-skeleton";

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

// Use the same interfaces as the hook to avoid conflicts
interface Profile {
  id: string;
  display_name: string;
  name?: string;
  level: string;
  description?: string;
}

interface LocalCombinedInterviewerProfile {
  id: string;
  alias: string;
  name: string; // Human-readable name like "John Doe"
  user_id?: string | null; // null = default for everyone, UUID = custom for specific user
  difficulty_profiles: Profile;
  seniority_profiles: Profile;
  company_profiles: Profile;
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
  
  // Use SWR for efficient data fetching with caching
  const { 
    cases, 
    combinedProfiles, 
    companyProfiles, 
    seniorityProfiles, 
    difficultyProfiles, 
    isLoading: loading, 
    hasError 
  } = useInterviewSetupData();
  
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
  const [suggestedProfile, setSuggestedProfile] = useState<LocalCombinedInterviewerProfile | null>(null);
  
  // Fuzzy search function for profiles
  const fuzzySearchProfiles = (profiles: LocalCombinedInterviewerProfile[], query: string) => {
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

  // Memoized filtered available profiles for better performance
  const filteredAvailableProfiles = useMemo(() => {
    const hasSearch = availableProfilesFilter.trim().length > 0;
    
    if (hasSearch) {
      return fuzzySearchProfiles(combinedProfiles || [], availableProfilesFilter);
    }
    
    let filtered = combinedProfiles || [];
    if (customCompanyId || customSeniorityId || customDifficultyId) {
      filtered = filtered.filter(profile => {
        const companyMatch = !customCompanyId || profile.company_profiles?.id === customCompanyId;
        const seniorityMatch = !customSeniorityId || profile.seniority_profiles?.id === customSeniorityId;
        const difficultyMatch = !customDifficultyId || profile.difficulty_profiles?.id === customDifficultyId;
        return companyMatch && seniorityMatch && difficultyMatch;
      });
    }
    
    return filtered;
  }, [combinedProfiles, availableProfilesFilter, customCompanyId, customSeniorityId, customDifficultyId]);

  // Check for exact matches when user is creating custom profile
  const checkForExactMatch = () => {
    if (!customCompanyId || !customSeniorityId || !customDifficultyId) {
      setSuggestedProfile(null);
      return;
    }

    const exactMatch = combinedProfiles?.find(profile => 
      profile.company_profiles?.id === customCompanyId &&
      profile.seniority_profiles?.id === customSeniorityId &&
      profile.difficulty_profiles?.id === customDifficultyId
    );

    setSuggestedProfile(exactMatch || null);
  };

  // Populate form fields from selected available profile
  const populateFormFromProfile = (profile: LocalCombinedInterviewerProfile) => {
    setCustomProfileName(profile.name || "");
    setCustomProfileAlias(profile.alias || "");
    setCustomCompanyId(profile.company_profiles?.id || "");
    setCustomSeniorityId(profile.seniority_profiles?.id || "");
    setCustomDifficultyId(profile.difficulty_profiles?.id || "");
    
    // Clear search bar when populating from profile (search takes priority over selection)
    setAvailableProfilesFilter("");
    
    // Clear suggested profile since we're using an existing one
    setSuggestedProfile(null);
    
    // NOTE: Don't clear selectedProfile here - it's set in the click handler
  };

  // Run exact match check whenever custom selections change
  useEffect(() => {
    checkForExactMatch();
  }, [customCompanyId, customSeniorityId, customDifficultyId, combinedProfiles]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [industryFilter, setIndustryFilter] = useState<string>("all");
  const [formatFilter, setFormatFilter] = useState<string>("all");

  // Debounced search for better performance
  const debouncedSearch = useDebouncedCallback(
    (value: string) => setDebouncedSearchQuery(value),
    300
  );

  // Trigger debounced search when searchQuery changes
  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);
  
  // Profile filters (matching case selection design)
  const [profileTypeFilter, setProfileTypeFilter] = useState<string>("all"); // "default" or "custom" or "all"
  const [profileCompanyFilter, setProfileCompanyFilter] = useState<string>("all");
  const [profileSeniorityFilter, setProfileSeniorityFilter] = useState<string>("all");
  const [profileDifficultyFilter, setProfileDifficultyFilter] = useState<string>("all");
  

  const [currentPage, setCurrentPage] = useState(1); // 1 = Case Selection, 2 = Profile Selection, 3 = Custom Profile Creation, 4 = Documents (optional), 5 = Device Setup
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [documentSessionId, setDocumentSessionId] = useState<string>("");
  
  // Get selected case data to determine if documents are required
  const selectedCaseData = cases.find(c => c.id === selectedCase);
  const requiresDocuments = selectedCaseData?.requires_documents || false;
  const totalSteps = requiresDocuments ? 5 : 4; // Case -> Profile -> [Custom Profile] -> [Documents] -> Device
  
  // Removed scroll detection state - now handled by ScrollFadeIndicator

  
  // Handle session selection from SessionSelector
  const handleSessionSelect = (sessionId: string) => {
    // Redirect to the session viewer page, not the interview session page
    router.push(`/sessions/${sessionId}`);
  };

  // Scroll handling now managed by ScrollFadeIndicator component

  // Browser back navigation handling
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      event.preventDefault();
      if (currentPage > 1) {
        setCurrentPage(prev => prev - 1);
        window.history.pushState(null, '', window.location.pathname);
      } else {
        // If on first page, allow navigation to dashboard
        router.push('/dashboard');
      }
    };

    // Push initial state to prevent going back to dashboard immediately
    window.history.pushState(null, '', window.location.pathname);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [currentPage, router]);

  // Data is now loaded via SWR hooks - no manual fetching needed

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
        // SWR will automatically revalidate the data, but we can manually trigger it for immediate feedback
        // The profile will appear in the list after SWR revalidates
        
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

  // Memoized filtered profiles based on all filters for better performance
  const filteredProfiles = useMemo(() => {
    return (combinedProfiles || []).filter(profile => {
      // Type filter
      if (profileTypeFilter === "default" && profile.user_id !== null) return false;
      if (profileTypeFilter === "custom" && profile.user_id === null) return false;
      
      // Company filter
      if (profileCompanyFilter !== "all" && profile.company_profiles?.name !== profileCompanyFilter) return false;
      
      // Seniority filter
      if (profileSeniorityFilter !== "all" && profile.seniority_profiles?.level !== profileSeniorityFilter) return false;
      
      // Difficulty filter
      if (profileDifficultyFilter !== "all" && profile.difficulty_profiles?.level !== profileDifficultyFilter) return false;
      
      return true;
    });
  }, [combinedProfiles, profileTypeFilter, profileCompanyFilter, profileSeniorityFilter, profileDifficultyFilter]);

  // Memoized filtered cases for better performance with debounced search
  const filteredCases = useMemo(() => {
    const normalize = (v: string) => (v || "").toLowerCase().trim();
    const getTypePriority = (type?: string) => {
      const t = normalize(type || "");
      if (/profit/.test(t)) return 0; // Profitability
      if (/market\s*entry/.test(t)) return 1; // Market Entry
      if (/(growth\s*strategy|revenue\s*growth|growth)/.test(t)) return 2; // Growth Strategy
      if (/(merger|acquisition|m&a)/.test(t)) return 3; // M&A
      if (/pricing/.test(t)) return 4; // Pricing
      if (/(market\s*sizing|sizing)/.test(t)) return 5; // Market Sizing
      return 999;
    };

    const filtered = cases.filter(case_ => {
      const matchesSearch = case_.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
                           case_.overview.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
                           case_.industry?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
                           case_.stretch_area?.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      const matchesType = typeFilter === "all" || case_.type === typeFilter;
      const matchesDifficulty = difficultyFilter === "all" || case_.difficulty === difficultyFilter;
      const matchesIndustry = industryFilter === "all" || case_.industry === industryFilter;
      const matchesFormat = formatFilter === "all" || case_.format === formatFilter;
      
      return matchesSearch && matchesType && matchesDifficulty && matchesIndustry && matchesFormat;
    });

    // Default sort by case type priority, then by title for stability
    return filtered
      .slice()
      .sort((a, b) => {
        const pa = getTypePriority(a.type);
        const pb = getTypePriority(b.type);
        if (pa !== pb) return pa - pb;
        const ta = (a.title || "").toLowerCase();
        const tb = (b.title || "").toLowerCase();
        if (ta < tb) return -1;
        if (ta > tb) return 1;
        return 0;
      });
  }, [cases, debouncedSearchQuery, typeFilter, difficultyFilter, industryFilter, formatFilter]);

  // Memoized filter options to avoid recalculating on every render
  const filterOptions = useMemo(() => ({
    types: [...new Set((cases || []).map(c => c.type).filter(Boolean))],
    difficulties: [...new Set((cases || []).map(c => c.difficulty).filter(Boolean))],
    industries: [...new Set((cases || []).map(c => c.industry).filter(Boolean))],
    formats: [...new Set((cases || []).map(c => c.format).filter(Boolean))]
  }), [cases]);

  const { types: typeOptions, difficulties: difficultyOptions, industries: industryOptions, formats: formatOptions } = filterOptions;
  
  // Memoized profile filter options for better performance
  const profileFilterOptions = useMemo(() => ({
    companies: [...new Set((companyProfiles || []).map(c => c.display_name).filter(Boolean))],
    seniorities: [...new Set((seniorityProfiles || []).map(s => s.display_name).filter(Boolean))],
    difficulties: [...new Set((difficultyProfiles || []).map(d => d.display_name).filter(Boolean))]
  }), [companyProfiles, seniorityProfiles, difficultyProfiles]);

  const { companies: companyOptions, seniorities: seniorityOptions, difficulties: difficultyLevelOptions } = profileFilterOptions;

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

  // Map difficulty to 1-3 star rating for simple visual scale
  const getDifficultyStars = (difficultyName?: string, difficultyLevel?: string): number => {
    const source = (difficultyName || difficultyLevel || "").toLowerCase();
    if (!source) return 1;
    if (/(easy|junior|beginner|level\s*1)/.test(source)) return 1;
    if (/(medium|mid|intermediate|level\s*2|level\s*3)/.test(source)) return 2;
    // Treat hard/expert/extreme as 3
    if (/(hard|senior|expert|extreme|level\s*4|level\s*5)/.test(source)) return 3;
    return 2;
  };

  // Map seniority display to Tailwind color scheme for pills
  const getSeniorityPillColors = (seniorityDisplay?: string) => {
    const t = (seniorityDisplay || "").toLowerCase();
    if (/(entry|junior|intern)/.test(t)) {
      return {
        bg: "bg-emerald-100",
        text: "text-emerald-800",
        border: "border-emerald-200",
      };
    }
    if (/(mid|intermediate|associate)/.test(t)) {
      return {
        bg: "bg-amber-100",
        text: "text-amber-800",
        border: "border-amber-200",
      };
    }
    if (/(senior)/.test(t)) {
      return {
        bg: "bg-sky-100",
        text: "text-sky-800",
        border: "border-sky-200",
      };
    }
    if (/(principal|staff|lead)/.test(t)) {
      return {
        bg: "bg-purple-100",
        text: "text-purple-800",
        border: "border-purple-200",
      };
    }
    if (/(director|manager|executive|vp|chief)/.test(t)) {
      return {
        bg: "bg-rose-100",
        text: "text-rose-800",
        border: "border-rose-200",
      };
    }
    return {
      bg: "bg-gray-100",
      text: "text-gray-800",
      border: "border-gray-200",
    };
  };

  // Rank seniority into 1..4 bubbles: Entry(1), Mid(2), Senior(3), Principal(4)
  const getSeniorityRank = (seniorityDisplay?: string): number => {
    const t = (seniorityDisplay || "").toLowerCase();
    if (/entry|junior|intern/.test(t)) return 1;
    if (/mid|intermediate|associate/.test(t)) return 2;
    if (/senior/.test(t)) return 3;
    if (/principal|staff|lead/.test(t)) return 4;
    return 2; // sensible default
  };

  // Order difficulty: Easy(1), Medium(2), Hard(3)
  const getDifficultyOrder = (difficultyDisplay?: string): number => {
    const t = (difficultyDisplay || "").toLowerCase();
    if (/easy/.test(t)) return 1;
    if (/medium/.test(t)) return 2;
    if (/hard/.test(t)) return 3;
    return 2;
  };

  const getInitials = (fullName: string) => {
    return fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Pick an icon based on case type
  const getCaseTypeIcon = (type?: string) => {
    const t = (type || "").toLowerCase();
    if (/(revenue|growth|growth\s*strategy)/.test(t)) return TrendingUp; // Growth Strategy
    if (/(profit|profitability)/.test(t)) return DollarSign; // Profitability
    if (/(market\s*entry)/.test(t)) return Rocket; // Market Entry
    if (/(merger|acquisition|m&a)/.test(t)) return Handshake; // M&A
    if (/(pricing)/.test(t)) return Tag; // Pricing
    if (/(market\s*sizing|sizing)/.test(t)) return PieChart; // Market Sizing
    if (t.includes("operations") || t.includes("process")) return Factory;
    if (t.includes("supply") || t.includes("product")) return Package;
    if (t.includes("data") || t.includes("analytics") || t.includes("forecast")) return BarChart3;
    return FileText;
  };

  // Compute color classes for category/type to keep icon + pill in sync
  const getCategoryColor = (type?: string) => {
    const t = (type || "").toLowerCase();
    // Defaults (blue)
    let bg = "bg-blue-50";
    let border = "border-blue-200";
    let text = "text-blue-700";
    let hoverBg = "hover:bg-blue-100";

    if (/(profit|profitability)/.test(t)) {
      // Profitability: green
      bg = "bg-green-50"; border = "border-green-200"; text = "text-green-700"; hoverBg = "hover:bg-green-100";
    } else if (/(revenue|growth|growth\s*strategy)/.test(t)) {
      // Growth strategy: indigo
      bg = "bg-indigo-50"; border = "border-indigo-200"; text = "text-indigo-700"; hoverBg = "hover:bg-indigo-100";
    } else if (/(market\s*entry)/.test(t)) {
      // Market entry: sky
      bg = "bg-sky-50"; border = "border-sky-200"; text = "text-sky-700"; hoverBg = "hover:bg-sky-100";
    } else if (/(merger|acquisition|m&a)/.test(t)) {
      // M&A: amber
      bg = "bg-amber-50"; border = "border-amber-200"; text = "text-amber-700"; hoverBg = "hover:bg-amber-100";
    } else if (/(pricing)/.test(t)) {
      // Pricing: purple
      bg = "bg-purple-50"; border = "border-purple-200"; text = "text-purple-700"; hoverBg = "hover:bg-purple-100";
    } else if (/(market\s*sizing|sizing)/.test(t)) {
      // Market sizing: teal
      bg = "bg-teal-50"; border = "border-teal-200"; text = "text-teal-700"; hoverBg = "hover:bg-teal-100";
    } else if (/(behavioral)/.test(t)) {
      bg = "bg-blue-50"; border = "border-blue-200"; text = "text-blue-700"; hoverBg = "hover:bg-blue-100";
    } else if (/(pricing)/.test(t)) {
      bg = "bg-purple-50"; border = "border-purple-200"; text = "text-purple-700"; hoverBg = "hover:bg-purple-100";
    } else if (/(operations|process)/.test(t)) {
      bg = "bg-green-50"; border = "border-green-200"; text = "text-green-700"; hoverBg = "hover:bg-green-100";
    } else if (/(market|entry|supply|product)/.test(t)) {
      bg = "bg-blue-50"; border = "border-blue-200"; text = "text-blue-700"; hoverBg = "hover:bg-blue-100";
    } else if (/(data|analytics|forecast)/.test(t)) {
      bg = "bg-indigo-50"; border = "border-indigo-200"; text = "text-indigo-700"; hoverBg = "hover:bg-indigo-100";
    }

    return { bg, border, text, hoverBg };
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
    return <InterviewSetupSkeleton />;
  }

  // Show document upload screen if case requires documents
  if (showDocumentUpload && documentSessionId) {
    return (
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-muted-foreground">Loading document upload...</p>
          </div>
        </div>
      }>
        <DocumentUpload 
          sessionId={documentSessionId}
          onContinue={handleDocumentUploadComplete}
        />
      </Suspense>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 overflow-hidden flex flex-col min-h-screen">
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

      {/* Page Content Area - Takes remaining space */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
        {currentPage === 1 && (
          <div
            key="page1"
            className="h-full flex flex-col"
          >
            {/* Header and Filters - consistent with page 2 */}
            <div 
              className="fixed left-0 right-0 z-40 bg-white backdrop-blur-sm border-b border-gray-100"
              style={{ 
                top: '64px',
                height: '180px'
              }}
            >
              <div className="container mx-auto px-6 py-6">
                {/* Header - always visible */}
                <div className="text-center space-y-2 mb-4">
                  <h2 className="text-3xl font-bold text-gray-900">Choose Your Case</h2>
                  <p className="text-gray-600 text-lg">
                    Select an interview case that matches your preparation goals
                  </p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3 items-center min-h-[48px]">
                  {/* Search - responsive width */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search cases..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-10 border-gray-200 focus:border-blue-300 focus:ring-1 focus:ring-blue-100"
                    />
                  </div>

                  {/* Filters - consistent widths */}
                  <div className="hidden lg:flex items-center gap-2">
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="w-[140px] h-10 border-gray-200">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {typeOptions.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                      <SelectTrigger className="w-[140px] h-10 border-gray-200">
                        <SelectValue placeholder="All Levels" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        {difficultyOptions.map(difficulty => (
                          <SelectItem key={difficulty} value={difficulty}>{difficulty}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={industryFilter} onValueChange={setIndustryFilter}>
                      <SelectTrigger className="w-[160px] h-10 border-gray-200">
                        <SelectValue placeholder="All Industries" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Industries</SelectItem>
                        {industryOptions.map(industry => (
                          <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={formatFilter} onValueChange={setFormatFilter}>
                      <SelectTrigger className="w-[160px] h-10 border-gray-200">
                        <SelectValue placeholder="All Formats" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Formats</SelectItem>
                        {formatOptions.map(format => (
                          <SelectItem key={format} value={format}>{format}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Results count and clear - always visible */}
                  <div className="flex items-center gap-3 ml-auto">
                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="text-gray-500 hover:text-gray-700 h-8"
                      >
                        Clear
                      </Button>
                    )}
                    <div className="text-sm text-gray-600 font-medium whitespace-nowrap">
                      {filteredCases.length} {filteredCases.length === 1 ? 'case' : 'cases'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Area - consistent padding to match new header height */}
            <div className="h-full" style={{ paddingTop: '180px' }}>
              <ScrollFadeIndicator 
                className="h-full"
                fadeHeight={60}
                fadeColor="rgb(255, 255, 255)"
              >
                <div className="px-6 pb-24 pt-6">
                  {/* Grid content */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <AnimatePresence>
                      {filteredCases.map((case_, index) => (
                        <motion.div
                          key={case_.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ delay: Math.min(index * 0.03, 0.3) }}
                          layout
                        >
                          <Card
                            className={cn(
                              "h-full cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg",
                              "flex flex-col",
                              selectedCase === case_.id
                                ? "ring-2 ring-blue-500 bg-blue-50/50 border-blue-200"
                                : "hover:border-blue-200"
                            )}
                            onClick={() => {
                              setSelectedCase(case_.id);
                              setTimeout(() => setCurrentPage(2), 300);
                            }}
                          >
                            <CardContent className="p-6 flex flex-col h-full">
                              {/* Header section - fixed height */}
                              <div className="flex items-start gap-4 mb-4 min-h-[60px]">
                                <div className={cn(
                                  "w-12 h-12 rounded-lg border flex items-center justify-center flex-shrink-0",
                                  getCategoryColor(case_.type).bg,
                                  getCategoryColor(case_.type).border,
                                  getCategoryColor(case_.type).text
                                )}>
                                  {(() => {
                                    const Icon = getCaseTypeIcon(case_.type);
                                    return <Icon className="w-5 h-5" />;
                                  })()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-lg leading-tight line-clamp-2 text-gray-900 mb-1">
                                    {case_.title}
                                  </h3>
                                  <div className="flex items-center gap-2 text-sm text-gray-500">
                                    {case_.industry && (
                                      <>
                                        <span className="truncate max-w-[150px]">{case_.industry}</span>
                                        <span className="text-gray-300">•</span>
                                      </>
                                    )}
                                    <span className="whitespace-nowrap">{case_.total_time || "30 min"}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Badges section - fixed height */}
                              <div className="flex items-center justify-between mb-4 min-h-[32px]">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {case_.type && (
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        "text-xs",
                                        getCategoryColor(case_.type).text,
                                        getCategoryColor(case_.type).border,
                                        getCategoryColor(case_.type).bg,
                                        getCategoryColor(case_.type).hoverBg
                                      )}
                                    >
                                      {case_.type}
                                    </Badge>
                                  )}
                                  {case_.requires_documents && (
                                    <Badge variant="outline" className="text-xs text-purple-700 border-purple-200 bg-purple-50">
                                      📄
                                    </Badge>
                                  )}
                                </div>
                                {case_.format && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-100"
                                  >
                                    {case_.format}
                                  </Badge>
                                )}
                              </div>

                              {/* Overview - fixed height with proper line clamping */}
                              <p className="text-sm text-gray-600 leading-relaxed flex-1 line-clamp-3 min-h-[60px]">
                                {case_.overview}
                              </p>

                              {/* Footer section - always at bottom */}
                              <div className="mt-4 pt-4 border-t border-gray-100">
                                {/* Difficulty */}
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-sm font-medium text-gray-600">Difficulty</span>
                                  <div className="flex items-center gap-0.5">
                                    {[1, 2, 3].map((i) => (
                                      <Star
                                        key={i}
                                        className={cn(
                                          "w-4 h-4 transition-colors",
                                          i <= getDifficultyStars(case_.difficulty)
                                            ? "fill-indigo-500 text-indigo-500"
                                            : "fill-gray-200 text-gray-200"
                                        )}
                                      />
                                    ))}
                                  </div>
                                </div>

                                {/* Stretch area - always present for consistent height */}
                                <div className="flex items-center gap-2 text-gray-600 min-h-[24px]">
                                  {case_.stretch_area ? (
                                    <>
                                      <Target className="w-4 h-4 text-gray-400" />
                                      <span className="text-sm truncate">{case_.stretch_area}</span>
                                    </>
                                  ) : (
                                    <span className="text-sm text-gray-400">General skills</span>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </ScrollFadeIndicator>
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

            {/* Removed floating continue button - cards auto-advance */}

          </div>
        )}

                {/* Page 2: Profile Selection - Same approach */}
        {currentPage === 2 && (
          <div
            key="page2"
            className="h-full flex flex-col"
          >
            {/* Header and Filters - NO ANIMATION, immediate positioning */}
            <div 
              className="fixed left-0 right-0 z-40 bg-white backdrop-blur-sm border-b border-gray-100" 
              style={{ 
                top: '64px',
                height: '180px'
              }}
            >
              <div className="container mx-auto px-6 py-6">
                {/* Header - always visible */}
                <div className="text-center space-y-2 mb-4">
                  <h2 className="text-3xl font-bold text-gray-900">Choose Interview Style</h2>
                  <p className="text-gray-600 text-lg">
                    Select an AI interviewer personality that matches your preparation goals
                  </p>
                </div>

                {/* Filters - no animation to prevent jumping */}
                <div className="flex flex-wrap gap-3 items-center min-h-[48px]">
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
                          <SelectItem key={company.id} value={company.name || company.display_name}>{company.display_name}</SelectItem>
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
              </div>
            </div>

            {/* Content - consistent padding */}
            <div className="h-full" style={{ paddingTop: '180px' }}>
              <ScrollFadeIndicator 
                className="h-full"
                fadeHeight={60}
                fadeColor="rgb(255, 255, 255)"
              >
                <div className="container mx-auto px-6 pb-24 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 min-h-[400px]">
                  {filteredProfiles.map((profile) => {
                    const displayName = profile.name || profile.alias;
                    const companyName = profile.company_profiles.display_name;
                    const companyInitial = (companyName || "").slice(0, 1).toUpperCase();
                    const seniorityDisplay = profile.seniority_profiles.display_name;
                    const difficultyDisplay = profile.difficulty_profiles.display_name || profile.difficulty_profiles.level;
                    const stars = getDifficultyStars(difficultyDisplay, profile.difficulty_profiles.level);
                    const companyDescription =
                      (profile.company_profiles && profile.company_profiles.description) ||
                      (profile as any).company_description ||
                      (companyProfiles.find(c =>
                        c.display_name === profile.company_profiles.display_name ||
                        (c.name || "") === (profile.company_profiles as any).name
                      )?.description) || "";
                    const seniorityDescription =
                      (profile.seniority_profiles && profile.seniority_profiles.description) ||
                      (profile as any).senority_description ||
                      (seniorityProfiles.find(s =>
                        s.display_name === profile.seniority_profiles.display_name ||
                        (s.level || "") === (profile.seniority_profiles as any).level
                      )?.description) || "";

                    return (
                      <Card
                        key={profile.id}
                        data-profile-card="true"
                        className={cn(
                          "cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg relative",
                          selectedProfile === profile.id 
                            ? "ring-2 ring-blue-500 bg-blue-50 border-blue-200" 
                            : "hover:border-blue-200"
                        )}
                        onClick={() => {
                          const newSelection = selectedProfile === profile.id ? "" : profile.id;
                          setSelectedProfile(newSelection);
                          // Auto-advance to next step after selection (only if selecting, not deselecting)
                          if (newSelection) {
                            setTimeout(() => {
                              // Skip document upload and go directly to interview
                              onStartInterview({
                                caseId: selectedCase,
                                interviewerProfileId: newSelection,
                                sessionId: undefined
                              });
                            }, 300);
                          }
                        }}
                      >
                        <CardContent className="p-6">
                          {selectedProfile === profile.id && (
                            <CheckCircle className="absolute top-2 right-2 w-5 h-5 text-green-500" />
                          )}

                          {/* Header: Avatar, Name, Custom badge */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center font-semibold shadow-sm">
                                {getInitials(displayName)}
                              </div>
                              <div>
                                <div className="text-base font-semibold text-gray-900">{displayName}</div>
                                <div className="text-sm text-gray-600">{profile.seniority_profiles.display_name}</div>
                              </div>
                            </div>
                            {profile.user_id !== null && (
                              <div className="px-3 py-1 bg-purple-100 text-purple-800 text-xs rounded-full border border-purple-200">Custom</div>
                            )}
                          </div>

                          {/* Meta row: Company chip and Seniority pill */}
                          <div className="flex items-center justify-between mt-4">
                            <div className="inline-flex items-center gap-2 text-sm text-blue-800">
                              <div className="w-7 h-7 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-xs flex items-center justify-center font-semibold">
                                {companyInitial}
                              </div>
                              <span>{companyName}</span>
                            </div>
                            {(() => {
                              const colors = getSeniorityPillColors(seniorityDisplay);
                              return (
                                <div className={cn("px-3 py-1 rounded-full text-xs font-medium", colors.bg, colors.text, colors.border)}>
                                  {seniorityDisplay}
                                </div>
                              );
                            })()}
                          </div>

                          {/* Divider */}
                          <div className="my-4 border-t border-gray-200" />

                          {/* Difficulty stars */}
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-700">Difficulty</div>
                            <div className="flex items-center gap-1">
                              {[1,2,3].map((i) => (
                                <Star
                                  key={i}
                                  className={cn(
                                    "w-4 h-4",
                                    i <= stars ? "fill-current text-purple-600" : "text-purple-200"
                                  )}
                                />
                              ))}
                            </div>
                          </div>

                          {/* Descriptions from interviewer_profiles_view */}
                          {(companyDescription || seniorityDescription) && (
                            <>
                              <div className="my-4 border-t border-gray-200" />
                              {companyDescription && (
                                <div className="text-sm text-gray-600 mb-2 whitespace-pre-line">
                                  {companyDescription}
                                </div>
                              )}
                              {seniorityDescription && (
                                <div className="text-sm text-gray-600 whitespace-pre-line">
                                  {seniorityDescription}
                                </div>
                              )}
                            </>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}

                  {/* Empty card to create a custom interviewer */}
                  <Card
                    className={cn(
                      "cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg border-2 border-dashed",
                      "bg-gradient-to-br from-blue-50/40 to-purple-50/40 hover:from-blue-100/40 hover:to-purple-100/40"
                    )}
                    onClick={goToCustomProfilePage}
                  >
                    <CardContent className="p-6 h-full flex flex-col items-center justify-center text-center">
                      <div className="w-14 h-14 rounded-xl bg-white text-blue-600 border border-blue-200 flex items-center justify-center shadow-sm mb-3">
                        <Plus className="w-6 h-6" />
                      </div>
                      <div className="text-base font-semibold text-gray-900">Create Custom Interviewer</div>
                      <div className="text-sm text-gray-600 mt-1">
                        Combine company, seniority, and difficulty to craft your own
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </ScrollFadeIndicator>
            </div>
          </div>
        )}

        {/* Page 3: Custom Profile Creation */}
        {currentPage === 3 && (
          <div
            key="page3"
            className="h-full flex flex-col overflow-hidden"
          >
            {/* Page Header (not fixed) */}
            <div className="bg-white border-b border-gray-100 px-6 py-6">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-gray-900">Create Custom Interviewer Profile</h2>
                <p className="text-gray-600 text-lg">Design your perfect interviewer by combining company culture, seniority level, and difficulty</p>
              </div>
            </div>

            {/* Main Content - Split Layout (takes remaining height) */}
            <div className="flex flex-1 overflow-hidden">
              
              {/* Left Panel - Form (independently scrollable) */}
              <div className="flex-1 bg-white overflow-y-auto">
                <div className="p-8 pt-8">
                
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
                              (company.name || '').toLowerCase().includes(companySearchQuery.toLowerCase())
                            )
                            .map(company => (
                              <div
                                key={company.id}
                                className="p-3 hover:bg-indigo-50 cursor-pointer text-sm"
                                onClick={() => {
                                  setCustomCompanyId(prev => prev === company.id ? "" : company.id);
                                  if (customCompanyId !== company.id) {
                                    setCompanySearchQuery(company.display_name);
                                  }
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
                            setCustomCompanyId(prev => prev === company.id ? "" : company.id);
                            if (customCompanyId !== company.id) {
                              setCompanySearchQuery(company.display_name);
                            }
                          }}
                        >
                          <div className="font-semibold text-gray-900 text-sm mb-2 text-center">{company.display_name}</div>
                          <div className="text-sm text-gray-600 leading-relaxed">
                            {getCompanyDescription(company.name || company.display_name)}
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
                    <div className="grid grid-cols-4 gap-3">
                      {[...seniorityProfiles].sort((a,b) => getSeniorityRank(a.display_name) - getSeniorityRank(b.display_name)).map((seniority) => {
                        const rank = getSeniorityRank(seniority.display_name);
                        const colors = getSeniorityPillColors(seniority.display_name);
                        return (
                        <div
                          key={seniority.id}
                          className={cn(
                            "p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 text-center",
                            customSeniorityId === seniority.id 
                              ? "border-indigo-500 bg-indigo-50" 
                              : "border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-25"
                          )}
                          onClick={() => setCustomSeniorityId(prev => prev === seniority.id ? "" : seniority.id)}
                        >
                          <div className="text-sm font-semibold text-gray-900 mb-2 text-center">{seniority.display_name}</div>
                          <div className="text-xs text-gray-600 whitespace-pre-line min-h-[1rem]">
                            {seniority.description || ''}
                          </div>
                        </div>
                      )})}
                    </div>
                  </div>

                  {/* Difficulty Level */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="w-4 h-4 text-indigo-600" />
                      <h2 className="text-sm font-semibold text-gray-700">Difficulty Level</h2>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[...difficultyProfiles].filter(d => /(easy|medium|hard)/i.test(d.display_name || d.level)).sort((a,b) => getDifficultyOrder(a.display_name || a.level) - getDifficultyOrder(b.display_name || b.level)).map((difficulty) => {
                        const level = (difficulty.display_name || difficulty.level || '').toLowerCase();
                        const stars = level.includes('easy') ? 1 : level.includes('medium') ? 2 : 3;
                        return (
                          <div
                            key={difficulty.id}
                            className={cn(
                              "p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 text-center",
                              customDifficultyId === difficulty.id 
                                ? "border-indigo-500 bg-indigo-50" 
                                : "border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-25"
                            )}
                            onClick={() => setCustomDifficultyId(prev => prev === difficulty.id ? "" : difficulty.id)}
                          >
                            <div className="text-sm font-semibold text-gray-900 mb-2 text-center">{difficulty.display_name}</div>
                            <div className="flex items-center gap-1 justify-center">
                              {[1,2,3].map((i) => (
                                <Star
                                  key={i}
                                  className={cn(
                                    "w-4 h-4",
                                    i <= stars ? "fill-current text-purple-600" : "text-purple-200"
                                  )}
                                />
                              ))}
                            </div>
                            <div className="text-xs text-gray-600 whitespace-pre-line mt-1 min-h-[1rem]">
                              {difficulty.description || ''}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                </div>
              </div>

              {/* Right Panel - Available Profiles */}
              <div className="w-96 bg-gray-50 border-l border-gray-200 flex flex-col overflow-hidden">
                <div className="p-5 border-b border-gray-200 bg-white">
                  <div className="text-base font-semibold text-gray-700 mb-1">Existing Profiles</div>
                </div>

                {/* Exact Match Suggestion Banner */}
                {suggestedProfile && !selectedProfile && (
                  <div className="mx-5 mt-5 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 bg-gradient-to-br from-blue-500 to-purple-600">
                        {(suggestedProfile.name || suggestedProfile.alias).split(' ').map((n: string) => n[0]).join('').toUpperCase()}
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
                      className="pl-10 pr-9 bg-white"
                    />
                    {availableProfilesFilter.trim() && (
                      <button
                        aria-label="Clear search"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        onClick={() => setAvailableProfilesFilter("")}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                  {filteredAvailableProfiles.slice(0, 8).map((profile) => {
                    const avatarGradient = "from-blue-500 to-purple-600";
                    const displayName = profile.name || profile.alias;
                    const companyName = profile.company_profiles.display_name;
                    const seniorityDisplay = profile.seniority_profiles.display_name;
                    const difficultyDisplay = profile.difficulty_profiles.display_name || profile.difficulty_profiles.level;
                    const stars = getDifficultyStars(difficultyDisplay, profile.difficulty_profiles.level);
                    const companyDescription =
                      (profile.company_profiles && profile.company_profiles.description) ||
                      (companyProfiles.find(c =>
                        c.display_name === profile.company_profiles.display_name ||
                        (c.name || "") === (profile.company_profiles as any).name
                      )?.description) || "";
                    const seniorityDescription =
                      (profile.seniority_profiles && profile.seniority_profiles.description) ||
                      (seniorityProfiles.find(s =>
                        s.display_name === profile.seniority_profiles.display_name ||
                        (s.level || "") === (profile.seniority_profiles as any).level
                      )?.description) || "";
                    
                    return (
                      <div
                        key={profile.id}
                        className={cn(
                          "p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:translate-x-1 hover:shadow-sm",
                          selectedProfile === profile.id
                            ? "border-blue-500 bg-blue-50 shadow-md"
                            : "border-gray-200 bg-white hover:border-indigo-500 hover:bg-indigo-25"
                        )}
                        onClick={() => {
                          if (selectedProfile === profile.id) {
                            // If already selected, deselect it
                            setSelectedProfile("");
                            // Also clear form fields to show we're not using this profile anymore
                            setCustomProfileName("John Doe");
                            setCustomProfileAlias("");
                            setCustomCompanyId("");
                            setCustomSeniorityId("");
                            setCustomDifficultyId("");
                            console.log("🔄 Deselected profile and cleared form:", profile.alias);
                          } else {
                            // If not selected, select it and populate form fields
                            setSelectedProfile(profile.id);
                            populateFormFromProfile(profile);
                            console.log("✅ Selected profile and populated form:", profile.alias);
                          }
                        }}
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div className={cn(
                            "w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-semibold bg-gradient-to-br flex-shrink-0",
                            avatarGradient
                          )}>
                            {displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 text-sm truncate">{displayName}</div>
                            <div className="text-xs text-gray-600 truncate">{seniorityDisplay}</div>
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
                        <div className="flex items-center justify-between mb-2">
                          <div className="inline-flex items-center gap-1 text-[11px] text-blue-800">
                            <div className="w-5 h-5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-[10px] flex items-center justify-center font-semibold">
                              {(companyName || '').slice(0,1).toUpperCase()}
                            </div>
                            <span>{companyName}</span>
                          </div>
                          {(() => { const colors = getSeniorityPillColors(seniorityDisplay); return (
                            <div className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium border", colors.bg, colors.text, colors.border)}>
                              {seniorityDisplay}
                            </div>
                          ); })()}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-700">Difficulty</div>
                          <div className="flex items-center gap-1">
                            {[1,2,3].map((i) => (
                              <Star
                                key={i}
                                className={cn(
                                  "w-3.5 h-3.5",
                                  i <= stars ? "fill-current text-purple-600" : "text-purple-200"
                                )}
                              />
                            ))}
                          </div>
                        </div>

                        {(companyDescription || seniorityDescription) && (
                          <>
                            <div className="my-2 border-t border-gray-200" />
                            {companyDescription && (
                              <div className="text-[11px] text-gray-600 mb-1 whitespace-pre-line line-clamp-3">
                                {companyDescription}
                              </div>
                            )}
                            {seniorityDescription && (
                              <div className="text-[11px] text-gray-600 whitespace-pre-line line-clamp-3">
                                {seniorityDescription}
                              </div>
                            )}
                          </>
                        )}
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
                {/* Removed search warning to allow continuing even with active search */}
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
                    Continue with Selected Profile
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
          </div>
        )}
        </AnimatePresence>
      </div>
    </div>
  );
}
