"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Upload, FileText, CheckCircle, XCircle, Loader2, AlertCircle, Type, ChevronDown, Plus, History, Home } from "lucide-react";
import { useRouter } from "next/navigation";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils";

interface DocumentUploadProps {
  sessionId: string;
  onContinue: () => void; // Just proceed to interview - no need to pass analysis data
}

interface UploadedFile {
  file: File;
  type: 'resume' | 'job_description';
  status: 'uploading' | 'uploaded' | 'processing' | 'completed' | 'error';
  url?: string;
  error?: string;
}

interface UserDocument {
  id: string;
  title: string;
  document_type: 'resume' | 'job_description';
  original_filename: string;
  file_size_bytes: number;
  mime_type: string;
  created_at: string;
  file_url: string;
  signed_url?: string;
  extracted_text_file_path?: string; // Path to .txt file in storage
  extracted_text_file_url?: string; // Public URL to .txt file
  alias?: string;
  last_used_at?: string;
}

export default function DocumentUpload({ sessionId, onContinue }: DocumentUploadProps) {
  const router = useRouter();
  const [uploadedFiles, setUploadedFiles] = useState<{
    resume?: UploadedFile;
    job_description?: UploadedFile;
  }>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState<string>("");
  
  // Text input states
  const [resumeText, setResumeText] = useState("");
  const [jobDescText, setJobDescText] = useState("");
  const [inputMode, setInputMode] = useState<{
    resume: 'file' | 'text' | 'existing';
    job_description: 'file' | 'text' | 'existing';
  }>({
    resume: 'file', // Will be updated after documents load
    job_description: 'file' // Will be updated after documents load
  });
  
  // Track if initial setup is complete to prevent UI flashing
  const [initialSetupComplete, setInitialSetupComplete] = useState(false);

  // User documents states
  const [userDocuments, setUserDocuments] = useState<{
    resumes: UserDocument[];
    job_descriptions: UserDocument[];
  }>({
    resumes: [],
    job_descriptions: []
  });
  const [selectedDocuments, setSelectedDocuments] = useState<{
    resume?: string;
    job_description?: string;
  }>({});
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  
  // Save new document states
  const [saveTitle, setSaveTitle] = useState<{
    resume: string;
    job_description: string;
  }>({
    resume: '',
    job_description: ''
  });

  // Alias states for new documents
  const [documentAlias, setDocumentAlias] = useState<{
    resume: string;
    job_description: string;
  }>({
    resume: '',
    job_description: ''
  });

  // Track if existing document text has been modified (to ask for alias)
  const [textModified, setTextModified] = useState<{
    resume: boolean;
    job_description: boolean;
  }>({
    resume: false,
    job_description: false
  });

  // Store original text to detect modifications
  const [originalText, setOriginalText] = useState<{
    resume: string;
    job_description: string;
  }>({
    resume: '',
    job_description: ''
  });

  // Fetch user documents on component mount
  useEffect(() => {
    fetchUserDocuments();
  }, []);

  const fetchUserDocuments = async () => {
    setLoadingDocuments(true);
    try {
      const [resumesRes, jobDescsRes] = await Promise.all([
        fetch('/api/user-documents/list?type=resume'),
        fetch('/api/user-documents/list?type=job_description')
      ]);

      if (resumesRes.ok && jobDescsRes.ok) {
        const resumesData = await resumesRes.json();
        const jobDescsData = await jobDescsRes.json();
        
        const resumes = resumesData.documents || [];
        const jobDescriptions = jobDescsData.documents || [];
        
        setUserDocuments({
          resumes,
          job_descriptions: jobDescriptions
        });

        // Auto-set input mode based on available documents
        setInputMode({
          resume: resumes.length > 0 ? 'existing' : 'file',
          job_description: jobDescriptions.length > 0 ? 'existing' : 'file'
        });
      }
    } catch (error) {
      console.error('Error fetching user documents:', error);
    } finally {
      setLoadingDocuments(false);
      setInitialSetupComplete(true);
    }
  };

  // Handle existing document selection
  const handleExistingDocumentSelect = async (documentId: string, type: 'resume' | 'job_description') => {
    const documents = type === 'resume' ? userDocuments.resumes : userDocuments.job_descriptions;
    const selectedDoc = documents.find(doc => doc.id === documentId);
    
    if (selectedDoc) {
      console.log(`📋 Selected existing ${type}:`, {
        id: selectedDoc.id,
        title: selectedDoc.title,
        hasExtractedText: !!(selectedDoc.extracted_text_file_url || selectedDoc.extracted_text_file_path)
      });

      // Update selected documents
      setSelectedDocuments(prev => ({
        ...prev,
        [type]: documentId
      }));

      // Update last_used_at timestamp
      try {
        await fetch('/api/user-documents/update-last-used', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ documentId })
        });
        console.log(`📅 Updated last_used_at for ${type} document`);
      } catch (error) {
        console.warn('Failed to update last_used_at:', error);
        // Don't block the user flow for this non-critical update
      }

      // If the document has extracted text file, auto-populate the text field
      if (selectedDoc.extracted_text_file_url) {
        // Fetch text from .txt file
        console.log(`📄 Fetching ${type} text from file:`, selectedDoc.extracted_text_file_url);
        try {
          const response = await fetch(selectedDoc.extracted_text_file_url);
          const textContent = await response.text();
          
          if (type === 'resume') {
            setResumeText(textContent);
            setOriginalText(prev => ({ ...prev, resume: textContent }));
            setTextModified(prev => ({ ...prev, resume: false }));
          } else {
            setJobDescText(textContent);
            setOriginalText(prev => ({ ...prev, job_description: textContent }));
            setTextModified(prev => ({ ...prev, job_description: false }));
          }
          console.log(`✅ Loaded ${type} text from file (${textContent.length} chars)`);
        } catch (error) {
          console.error(`❌ Failed to fetch ${type} text from file:`, error);
          // Clear text if file fetch fails
          if (type === 'resume') {
            setResumeText('');
            setOriginalText(prev => ({ ...prev, resume: '' }));
            setTextModified(prev => ({ ...prev, resume: false }));
          } else {
            setJobDescText('');
            setOriginalText(prev => ({ ...prev, job_description: '' }));
            setTextModified(prev => ({ ...prev, job_description: false }));
          }
        }
      } else {
        // Clear text if no extracted text available
        if (type === 'resume') {
          setResumeText('');
          setOriginalText(prev => ({ ...prev, resume: '' }));
          setTextModified(prev => ({ ...prev, resume: false }));
        } else {
          setJobDescText('');
          setOriginalText(prev => ({ ...prev, job_description: '' }));
          setTextModified(prev => ({ ...prev, job_description: false }));
        }
      }
    }
  };

  // Handle file drops
  const onDropResume = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      handleFileUpload(acceptedFiles[0], 'resume');
    }
  }, []);

  const onDropJobDescription = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      handleFileUpload(acceptedFiles[0], 'job_description');
    }
  }, []);

  // Configure dropzones
  const resumeDropzone = useDropzone({
    onDrop: onDropResume,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
    disabled: isProcessing || !!uploadedFiles.resume
  });

  const jobDescriptionDropzone = useDropzone({
    onDrop: onDropJobDescription,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
    disabled: isProcessing || !!uploadedFiles.job_description
  });

  // Upload text and return URL directly (for processing)
  const uploadTextAndGetUrl = async (text: string, type: 'resume' | 'job_description'): Promise<string | null> => {
    if (!text.trim()) return null;
    
    try {
      // Create a text file from the input
      const textBlob = new Blob([text], { type: 'text/plain' });
      const textFile = new File([textBlob], `${type}.txt`, { type: 'text/plain' });
      
      const formData = new FormData();
      formData.append('file', textFile);
      formData.append('sessionId', sessionId);
      formData.append('documentType', type);
      
      // Add alias if provided
      const alias = documentAlias[type];
      if (alias && alias.trim()) {
        formData.append('alias', alias.trim());
      }

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Update state for UI
      setUploadedFiles(prev => ({
        ...prev,
        [type]: { 
          file: textFile, 
          type, 
          status: 'uploaded',
          url: result.file_url 
        }
      }));

      return result.file_url;

    } catch (error) {
      console.error(`Error uploading ${type} text:`, error);
      throw error;
    }
  };

  // Upload text as file to Supabase Storage
  const handleTextUpload = async (text: string, type: 'resume' | 'job_description') => {
    if (!text.trim()) return;
    
    setUploadedFiles(prev => ({
      ...prev,
      [type]: { 
        file: new File([text], `${type}.txt`, { type: 'text/plain' }), 
        type, 
        status: 'uploading' 
      }
    }));

    try {
      // Create a text file from the input
      const textBlob = new Blob([text], { type: 'text/plain' });
      const textFile = new File([textBlob], `${type}.txt`, { type: 'text/plain' });
      
      const formData = new FormData();
      formData.append('file', textFile);
      formData.append('sessionId', sessionId);
      formData.append('documentType', type);

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      setUploadedFiles(prev => ({
        ...prev,
        [type]: { 
          file: textFile, 
          type, 
          status: 'uploaded',
          url: result.file_url 
        }
      }));

    } catch (error) {
      console.error(`Error uploading ${type} text:`, error);
      setUploadedFiles(prev => ({
        ...prev,
        [type]: { 
          file: new File([text], `${type}.txt`), 
          type, 
          status: 'error',
          error: error instanceof Error ? error.message : 'Upload failed'
        }
      }));
    }
  };

  // Upload file to Supabase Storage
  const handleFileUpload = async (file: File, type: 'resume' | 'job_description') => {
    setUploadedFiles(prev => ({
      ...prev,
      [type]: { file, type, status: 'uploading' }
    }));

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sessionId', sessionId);
      formData.append('documentType', type);
      
      // Add alias if provided
      const alias = documentAlias[type];
      if (alias && alias.trim()) {
        formData.append('alias', alias.trim());
      }

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      setUploadedFiles(prev => ({
        ...prev,
        [type]: { 
          file, 
          type, 
          status: 'uploaded',
          url: result.file_url 
        }
      }));

    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      setUploadedFiles(prev => ({
        ...prev,
        [type]: { 
          file, 
          type, 
          status: 'error',
          error: error instanceof Error ? error.message : 'Upload failed'
        }
      }));
    }
  };

  // Link existing documents to session via references table
  const linkDocumentsToSession = async () => {
    const references = [];
    
    // Add resume reference if selected
    if (inputMode.resume === 'existing' && selectedDocuments.resume && !textModified.resume) {
      references.push({
        session_id: sessionId,
        document_id: selectedDocuments.resume
      });
    }
    
    // Add job description reference if selected
    if (inputMode.job_description === 'existing' && selectedDocuments.job_description && !textModified.job_description) {
      references.push({
        session_id: sessionId,
        document_id: selectedDocuments.job_description
      });
    }
    
    if (references.length > 0) {
      try {
        const response = await fetch('/api/sessions/link-documents', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ references })
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log(`✅ Linked ${result.linkedCount} existing documents to session`);
        } else {
          console.warn('Failed to link existing documents:', response.statusText);
        }
      } catch (error) {
        console.warn('Error linking existing documents:', error);
      }
    }
  };

  // Process documents with external API
  const handleProcessDocuments = async () => {
    setIsProcessing(true);
    setProcessingError("");

    try {
      let resumeUrl = uploadedFiles.resume?.url || null;
      let jobDescUrl = uploadedFiles.job_description?.url || null;

      // Handle existing documents - check if modified
      if (inputMode.resume === 'existing' && selectedDocuments.resume) {
        const selectedResume = userDocuments.resumes.find(doc => doc.id === selectedDocuments.resume);
        if (selectedResume) {
          if (textModified.resume) {
            // Text was modified - upload as new .txt file for processing
            console.log("📝 Resume text modified - uploading as new .txt file");
            resumeUrl = await uploadTextAndGetUrl(resumeText, 'resume');
          } else if (selectedResume.extracted_text_file_url) {
            // Use existing .txt file URL (most efficient - no LLM conversion needed)
            resumeUrl = selectedResume.extracted_text_file_url;
            console.log("📄 Using existing resume .txt file:", selectedResume.extracted_text_file_url);
          } else {
            // Use original document URL (will need LLM conversion)
            resumeUrl = selectedResume.signed_url || selectedResume.file_url;
            console.log("📋 Using existing resume (needs conversion):", selectedResume.title);
          }
        }
      }

      if (inputMode.job_description === 'existing' && selectedDocuments.job_description) {
        const selectedJobDesc = userDocuments.job_descriptions.find(doc => doc.id === selectedDocuments.job_description);
        if (selectedJobDesc) {
          if (textModified.job_description) {
            // Text was modified - upload as new .txt file for processing
            console.log("📝 Job description text modified - uploading as new .txt file");
            jobDescUrl = await uploadTextAndGetUrl(jobDescText, 'job_description');
          } else if (selectedJobDesc.extracted_text_file_url) {
            // Use existing .txt file URL (most efficient - no LLM conversion needed)
            jobDescUrl = selectedJobDesc.extracted_text_file_url;
            console.log("📄 Using existing job description .txt file:", selectedJobDesc.extracted_text_file_url);
          } else {
            // Use original document URL (will need LLM conversion)
            jobDescUrl = selectedJobDesc.signed_url || selectedJobDesc.file_url;
            console.log("📋 Using existing job description (needs conversion):", selectedJobDesc.title);
          }
        }
      }

      // Handle text inputs by uploading them first and getting URLs directly
      if (inputMode.resume === 'text' && resumeText.trim() && !uploadedFiles.resume) {
        console.log("📤 Uploading resume text to storage...");
        resumeUrl = await uploadTextAndGetUrl(resumeText, 'resume');
      }
      
      if (inputMode.job_description === 'text' && jobDescText.trim() && !uploadedFiles.job_description) {
        console.log("📤 Uploading job description text to storage...");
        jobDescUrl = await uploadTextAndGetUrl(jobDescText, 'job_description');
      }

      console.log("📋 Processing with URLs:", {
        resume_url: resumeUrl,
        job_description_url: jobDescUrl,
        resume_mode: inputMode.resume,
        job_desc_mode: inputMode.job_description
      });

      // Check if we can skip external API processing (only for unmodified existing documents with text files)
      const resumeDoc = userDocuments.resumes.find(doc => doc.id === selectedDocuments.resume);
      const jobDescDoc = userDocuments.job_descriptions.find(doc => doc.id === selectedDocuments.job_description);
      
      const resumeHasTextFile = inputMode.resume === 'existing' && 
        !textModified.resume &&
        resumeDoc?.extracted_text_file_url;
      const jobDescHasTextFile = inputMode.job_description === 'existing' && 
        !textModified.job_description &&
        jobDescDoc?.extracted_text_file_url;

      if ((resumeUrl && resumeHasTextFile) || (jobDescUrl && jobDescHasTextFile)) {
        console.log("⚡ Using existing unmodified text content - skipping external API processing for efficiency");
        
        // Link existing documents to the session
        await linkDocumentsToSession();
        
        onContinue();
        return;
      }

      // Otherwise, process with external API as usual
      const response = await fetch('/api/documents/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session_id: sessionId,
          resume_url: resumeUrl,
          job_description_url: jobDescUrl
        })
      });

      if (!response.ok) {
        throw new Error(`Processing failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Processing failed');
      }

      // Mark files as completed
      setUploadedFiles(prev => ({
        resume: prev.resume ? { ...prev.resume, status: 'completed' } : undefined,
        job_description: prev.job_description ? { ...prev.job_description, status: 'completed' } : undefined
      }));

      console.log("✅ Documents processed and stored internally - proceeding to interview");
      
      // Analysis is stored internally, just proceed to interview
      // The session settings will pick up the analysis via variable processors
      onContinue();

    } catch (error) {
      console.error('Error processing documents:', error);
      setProcessingError(error instanceof Error ? error.message : 'Processing failed');
    } finally {
      setIsProcessing(false);
    }
  };



  // Check if we can proceed
  const hasUploadedFiles = uploadedFiles.resume || uploadedFiles.job_description;
  const hasTextInput = (inputMode.resume === 'text' && resumeText.trim()) || 
                       (inputMode.job_description === 'text' && jobDescText.trim());
  const hasExistingDocs = (inputMode.resume === 'existing' && selectedDocuments.resume) ||
                          (inputMode.job_description === 'existing' && selectedDocuments.job_description);
  const hasAnyContent = hasUploadedFiles || hasTextInput || hasExistingDocs;
  
  // Only check upload status for actual uploaded files
  const uploadedFilesList = Object.values(uploadedFiles).filter(Boolean);
  const allFilesUploaded = uploadedFilesList.length === 0 || uploadedFilesList.every(file => 
    file?.status === 'uploaded' || file?.status === 'completed'
  );
  
  const canProcess = hasAnyContent && allFilesUploaded && !isProcessing;

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'uploading': return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'uploaded': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing': return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Upload className="w-4 h-4 text-gray-400" />;
    }
  };

  // Show loading state until initial setup is complete
  if (!initialSetupComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-5 pt-16 pb-7">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600 dark:text-gray-400">Loading document options...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header with Dashboard Button */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 h-16">
        <div className="container mx-auto px-6 h-full flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Upload Documents</h1>
          
          {/* Dashboard Button - Top Right */}
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
      </header>
      
      <div className="container mx-auto px-5 pt-8 pb-7">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Upload Documents
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            This interview case benefits from analyzing your resume and the job description. 
            Upload one or both documents for a more personalized interview experience.
          </p>
        </motion.div>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:items-start">
          {/* Resume Upload */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="h-full min-h-[500px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Resume
                  {getStatusIcon(uploadedFiles.resume?.status)}
                </CardTitle>
                <CardDescription>
                  Upload your resume file or paste the text to get personalized questions
                </CardDescription>
                
                {/* Toggle buttons for input mode */}
                <div className="flex gap-2 mt-2 flex-wrap">
                  {userDocuments.resumes.length > 0 && (
                    <Button
                      variant={inputMode.resume === 'existing' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setInputMode(prev => ({ ...prev, resume: 'existing' }))}
                      disabled={loadingDocuments}
                    >
                      <History className="w-4 h-4 mr-1" />
                      Use Existing ({userDocuments.resumes.length})
                    </Button>
                  )}
                  <Button
                    variant={inputMode.resume === 'file' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setInputMode(prev => ({ ...prev, resume: 'file' }))}
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    Upload File
                  </Button>
                  <Button
                    variant={inputMode.resume === 'text' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setInputMode(prev => ({ ...prev, resume: 'text' }))}
                  >
                    <Type className="w-4 h-4 mr-1" />
                    Paste Text
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                {inputMode.resume === 'existing' ? (
                  <div className="space-y-4">
                    {loadingDocuments ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                        <span className="ml-2 text-gray-600">Loading your documents...</span>
                      </div>
                    ) : userDocuments.resumes.length > 0 ? (
                      <>
                        <Select
                          value={selectedDocuments.resume || ''}
                          onValueChange={(value) => handleExistingDocumentSelect(value, 'resume')}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a resume from your library" />
                          </SelectTrigger>
                          <SelectContent>
                            {userDocuments.resumes.map((doc) => (
                              <SelectItem key={doc.id} value={doc.id}>
                                <div className="flex flex-col gap-1 w-full">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium">
                                      {doc.alias || doc.title}
                                    </span>
                                    <span className="text-xs text-gray-500 ml-2">
                                      {doc.last_used_at 
                                        ? new Date(doc.last_used_at).toLocaleDateString()
                                        : new Date(doc.created_at).toLocaleDateString()
                                      }
                                    </span>
                                  </div>
                                  {doc.alias && doc.alias !== doc.title && (
                                    <span className="text-xs text-gray-400">
                                      File: {doc.original_filename}
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        {selectedDocuments.resume && (
                          <div className="space-y-4">
                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                              <div className="flex items-center gap-2 text-green-700">
                                <CheckCircle className="w-4 h-4" />
                                <span className="font-medium">Resume selected</span>
                              </div>
                              {resumeText && (
                                <div className="mt-2 text-sm text-green-600">
                                  ⚡ Text content loaded for review
                                </div>
                              )}
                            </div>
                            
                            {/* PDF/DOC Viewer for visual reference */}
                            {selectedDocuments.resume && (() => {
                              const selectedDoc = userDocuments.resumes.find(doc => doc.id === selectedDocuments.resume);
                              const isPdf = selectedDoc?.mime_type === 'application/pdf';
                              const isViewable = isPdf && selectedDoc?.signed_url;
                              
                              return isViewable ? (
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-gray-700">
                                    Original Document (for reference)
                                  </label>
                                  <div className="border rounded-lg overflow-hidden bg-white">
                                    <iframe
                                      src={selectedDoc.signed_url}
                                      className="w-full h-96"
                                      title="Resume PDF Preview"
                                    />
                                  </div>
                                  <p className="text-xs text-gray-500">
                                    Visual reference - text version below will be used for processing
                                  </p>
                                </div>
                              ) : null;
                            })()}
                            
                            {/* Show extracted text for review or message if no text */}
                            {resumeText ? (
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                  Resume Content (for review)
                                </label>
                                <Textarea
                                  value={resumeText}
                                  onChange={(e) => {
                                    const newValue = e.target.value;
                                    setResumeText(newValue);
                                    // Check if text has been modified from original
                                    const isModified = newValue !== originalText.resume;
                                    setTextModified(prev => ({ ...prev, resume: isModified }));
                                  }}
                                  className="min-h-[200px] max-h-[400px] resize-none"
                                  style={{
                                    height: Math.min(Math.max(200, (resumeText.split('\n').length + 1) * 24), 400) + 'px'
                                  }}
                                  placeholder="Resume content will appear here..."
                                />
                                <p className="text-xs text-gray-500">
                                  You can edit this content if needed before proceeding
                                </p>
                                
                                {/* Show alias input when text is modified */}
                                {textModified.resume && (
                                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg space-y-3">
                                    <div className="flex items-center gap-2 text-yellow-700">
                                      <AlertCircle className="w-4 h-4" />
                                      <span className="text-sm font-medium">Content Modified</span>
                                    </div>
                                    <p className="text-xs text-yellow-600">
                                      Since you've modified the content, this will be saved as a new document. Please provide an alias:
                                    </p>
                                    <div className="space-y-2">
                                      <Input
                                        placeholder="e.g., 'Modified Software Engineer Resume 2024'"
                                        value={documentAlias.resume}
                                        onChange={(e) => setDocumentAlias(prev => ({ ...prev, resume: e.target.value }))}
                                        className="text-sm"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center gap-2 text-blue-700">
                                  <FileText className="w-4 h-4" />
                                  <span className="text-sm">
                                    This document will be processed to extract text content during the interview setup.
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No resumes found in your library</p>
                        <p className="text-sm">Upload a new resume to get started</p>
                      </div>
                    )}
                  </div>
                ) : inputMode.resume === 'file' ? (
                  <div className="space-y-4">
                  <div
                    {...resumeDropzone.getRootProps()}
                    className={cn(
                      "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                      resumeDropzone.isDragActive ? "border-blue-500 bg-blue-50 dark:bg-blue-950" : "border-gray-300 dark:border-gray-600",
                      uploadedFiles.resume?.status === 'error' ? "border-red-300 bg-red-50 dark:bg-red-950" : ""
                    )}
                  >
                    <input {...resumeDropzone.getInputProps()} />
                    
                    {uploadedFiles.resume ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-2">
                          {getStatusIcon(uploadedFiles.resume.status)}
                          <span className="font-medium">{uploadedFiles.resume.file.name}</span>
                        </div>
                        {uploadedFiles.resume.status === 'error' && (
                          <p className="text-red-600 text-sm">{uploadedFiles.resume.error}</p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-8 h-8 mx-auto text-gray-400" />
                        <p className="text-gray-600 dark:text-gray-400">
                          Drag your resume here or click to browse
                        </p>
                        <p className="text-sm text-gray-500">
                          PDF, DOC, DOCX, or TXT (max 10MB)
                        </p>
                      </div>
                    )}
                    </div>
                    
                    {/* Alias input for file mode - moved outside dropzone */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Alias (optional)
                      </label>
                      <Input
                        placeholder="e.g., 'Software Engineer Resume 2024'"
                        value={documentAlias.resume}
                        onChange={(e) => setDocumentAlias(prev => ({ ...prev, resume: e.target.value }))}
                        className="text-sm"
                      />
                      <p className="text-xs text-gray-500">
                        Give this resume a memorable name for easy selection later
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Paste your resume content here..."
                      value={resumeText}
                      onChange={(e) => setResumeText(e.target.value)}
                      className="min-h-[200px] max-h-[400px] resize-none"
                      style={{
                        height: Math.min(Math.max(200, (resumeText.split('\n').length + 1) * 24), 400) + 'px'
                      }}
                    />
                    
                    {/* Alias input for text mode */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Alias (optional)
                      </label>
                      <Input
                        placeholder="e.g., 'Software Engineer Resume 2024'"
                        value={documentAlias.resume}
                        onChange={(e) => setDocumentAlias(prev => ({ ...prev, resume: e.target.value }))}
                        className="text-sm"
                      />
                      <p className="text-xs text-gray-500">
                        Give this resume a memorable name for easy selection later
                      </p>
                    </div>
                    
                    {resumeText.trim() && (
                      <div className="flex items-center gap-2 text-sm text-green-600 mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <CheckCircle className="w-4 h-4" />
                        Resume text ready ({resumeText.trim().split('\n').length} lines)
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Job Description Upload */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="h-full min-h-[500px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Job Description
                  {getStatusIcon(uploadedFiles.job_description?.status)}
                </CardTitle>
                <CardDescription>
                  Upload job description file or paste the text to get tailored questions
                </CardDescription>
                
                {/* Toggle buttons for input mode */}
                <div className="flex gap-2 mt-2 flex-wrap">
                  {userDocuments.job_descriptions.length > 0 && (
                    <Button
                      variant={inputMode.job_description === 'existing' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setInputMode(prev => ({ ...prev, job_description: 'existing' }))}
                      disabled={loadingDocuments}
                    >
                      <History className="w-4 h-4 mr-1" />
                      Use Existing ({userDocuments.job_descriptions.length})
                    </Button>
                  )}
                  <Button
                    variant={inputMode.job_description === 'file' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setInputMode(prev => ({ ...prev, job_description: 'file' }))}
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    Upload File
                  </Button>
                  <Button
                    variant={inputMode.job_description === 'text' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setInputMode(prev => ({ ...prev, job_description: 'text' }))}
                  >
                    <Type className="w-4 h-4 mr-1" />
                    Paste Text
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                {inputMode.job_description === 'existing' ? (
                  <div className="space-y-4">
                    {loadingDocuments ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                        <span className="ml-2 text-gray-600">Loading your documents...</span>
                      </div>
                    ) : userDocuments.job_descriptions.length > 0 ? (
                      <>
                        <Select
                          value={selectedDocuments.job_description || ''}
                          onValueChange={(value) => handleExistingDocumentSelect(value, 'job_description')}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a job description from your library" />
                          </SelectTrigger>
                          <SelectContent>
                            {userDocuments.job_descriptions.map((doc) => (
                              <SelectItem key={doc.id} value={doc.id}>
                                <div className="flex flex-col gap-1 w-full">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium">
                                      {doc.alias || doc.title}
                                    </span>
                                    <span className="text-xs text-gray-500 ml-2">
                                      {doc.last_used_at 
                                        ? new Date(doc.last_used_at).toLocaleDateString()
                                        : new Date(doc.created_at).toLocaleDateString()
                                      }
                                    </span>
                                  </div>
                                  {doc.alias && doc.alias !== doc.title && (
                                    <span className="text-xs text-gray-400">
                                      File: {doc.original_filename}
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        {selectedDocuments.job_description && (
                          <div className="space-y-4">
                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                              <div className="flex items-center gap-2 text-green-700">
                                <CheckCircle className="w-4 h-4" />
                                <span className="font-medium">Job description selected</span>
                              </div>
                              {jobDescText && (
                                <div className="mt-2 text-sm text-green-600">
                                  ⚡ Text content loaded for review
                                </div>
                              )}
                            </div>
                            
                            {/* PDF/DOC Viewer for visual reference */}
                            {selectedDocuments.job_description && (() => {
                              const selectedDoc = userDocuments.job_descriptions.find(doc => doc.id === selectedDocuments.job_description);
                              const isPdf = selectedDoc?.mime_type === 'application/pdf';
                              const isViewable = isPdf && selectedDoc?.signed_url;
                              
                              return isViewable ? (
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-gray-700">
                                    Original Document (for reference)
                                  </label>
                                  <div className="border rounded-lg overflow-hidden bg-white">
                                    <iframe
                                      src={selectedDoc.signed_url}
                                      className="w-full h-96"
                                      title="Job Description PDF Preview"
                                    />
                                  </div>
                                  <p className="text-xs text-gray-500">
                                    Visual reference - text version below will be used for processing
                                  </p>
                                </div>
                              ) : null;
                            })()}
                            
                            {/* Show extracted text for review or message if no text */}
                            {jobDescText ? (
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                  Job Description Content (for review)
                                </label>
                                <Textarea
                                  value={jobDescText}
                                  onChange={(e) => {
                                    const newValue = e.target.value;
                                    setJobDescText(newValue);
                                    // Check if text has been modified from original
                                    const isModified = newValue !== originalText.job_description;
                                    setTextModified(prev => ({ ...prev, job_description: isModified }));
                                  }}
                                  className="min-h-[200px] max-h-[400px] resize-none"
                                  style={{
                                    height: Math.min(Math.max(200, (jobDescText.split('\n').length + 1) * 24), 400) + 'px'
                                  }}
                                  placeholder="Job description content will appear here..."
                                />
                                <p className="text-xs text-gray-500">
                                  You can edit this content if needed before proceeding
                                </p>
                                
                                {/* Show alias input when text is modified */}
                                {textModified.job_description && (
                                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg space-y-3">
                                    <div className="flex items-center gap-2 text-yellow-700">
                                      <AlertCircle className="w-4 h-4" />
                                      <span className="text-sm font-medium">Content Modified</span>
                                    </div>
                                    <p className="text-xs text-yellow-600">
                                      Since you've modified the content, this will be saved as a new document. Please provide an alias:
                                    </p>
                                    <div className="space-y-2">
                                      <Input
                                        placeholder="e.g., 'Modified Senior Developer Role 2024'"
                                        value={documentAlias.job_description}
                                        onChange={(e) => setDocumentAlias(prev => ({ ...prev, job_description: e.target.value }))}
                                        className="text-sm"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center gap-2 text-blue-700">
                                  <FileText className="w-4 h-4" />
                                  <span className="text-sm">
                                    This document will be processed to extract text content during the interview setup.
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No job descriptions found in your library</p>
                        <p className="text-sm">Upload a new job description to get started</p>
                      </div>
                    )}
                  </div>
                ) : inputMode.job_description === 'file' ? (
                  <div className="space-y-4">
                  <div
                    {...jobDescriptionDropzone.getRootProps()}
                    className={cn(
                      "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                      jobDescriptionDropzone.isDragActive ? "border-blue-500 bg-blue-50 dark:bg-blue-950" : "border-gray-300 dark:border-gray-600",
                      uploadedFiles.job_description?.status === 'error' ? "border-red-300 bg-red-50 dark:bg-red-950" : ""
                    )}
                  >
                    <input {...jobDescriptionDropzone.getInputProps()} />
                    
                    {uploadedFiles.job_description ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-2">
                          {getStatusIcon(uploadedFiles.job_description.status)}
                          <span className="font-medium">{uploadedFiles.job_description.file.name}</span>
                        </div>
                        {uploadedFiles.job_description.status === 'error' && (
                          <p className="text-red-600 text-sm">{uploadedFiles.job_description.error}</p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-8 h-8 mx-auto text-gray-400" />
                        <p className="text-gray-600 dark:text-gray-400">
                          Drag job description here or click to browse
                        </p>
                        <p className="text-sm text-gray-500">
                          PDF, DOC, DOCX, or TXT (max 10MB)
                        </p>
                      </div>
                    )}
                    </div>
                    
                    {/* Alias input for file mode - moved outside dropzone */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Alias (optional)
                      </label>
                      <Input
                        placeholder="e.g., 'Senior Developer Role 2024'"
                        value={documentAlias.job_description}
                        onChange={(e) => setDocumentAlias(prev => ({ ...prev, job_description: e.target.value }))}
                        className="text-sm"
                      />
                      <p className="text-xs text-gray-500">
                        Give this job description a memorable name for easy selection later
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Paste the job description here..."
                      value={jobDescText}
                      onChange={(e) => setJobDescText(e.target.value)}
                      className="min-h-[200px] max-h-[400px] resize-none"
                      style={{
                        height: Math.min(Math.max(200, (jobDescText.split('\n').length + 1) * 24), 400) + 'px'
                      }}
                    />
                    
                    {/* Alias input for text mode */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Alias (optional)
                      </label>
                      <Input
                        placeholder="e.g., 'Senior Developer Role 2024'"
                        value={documentAlias.job_description}
                        onChange={(e) => setDocumentAlias(prev => ({ ...prev, job_description: e.target.value }))}
                        className="text-sm"
                      />
                      <p className="text-xs text-gray-500">
                        Give this job description a memorable name for easy selection later
                      </p>
                    </div>
                    
                    {jobDescText.trim() && (
                      <div className="flex items-center gap-2 text-sm text-green-600 mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <CheckCircle className="w-4 h-4" />
                        Job description ready ({jobDescText.trim().split('\n').length} lines)
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
          </div>

          {/* Processing Error */}
          <div className="mt-6">
          <AnimatePresence>
            {processingError && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="border-red-200 bg-red-50 dark:bg-red-950">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                      <AlertCircle className="w-4 h-4" />
                      <span className="font-medium">Processing Error:</span>
                      <span>{processingError}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
          </div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex gap-4 justify-center mt-6"
          >
            <Button
              variant="outline"
              onClick={onContinue}
              disabled={isProcessing}
              className="px-8"
            >
              Skip Documents
            </Button>
            
            <Button
              onClick={handleProcessDocuments}
              disabled={!canProcess}
              className="px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing Documents...
                </>
              ) : (
                'Continue with Documents'
              )}
            </Button>
          </motion.div>

          
        </div>
      </div>
    </div>
  );
}
