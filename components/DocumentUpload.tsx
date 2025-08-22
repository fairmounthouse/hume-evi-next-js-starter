"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Upload, FileText, CheckCircle, XCircle, Loader2, AlertCircle, Type } from "lucide-react";
import { Textarea } from "./ui/textarea";
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

export default function DocumentUpload({ sessionId, onContinue }: DocumentUploadProps) {
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
    resume: 'file' | 'text';
    job_description: 'file' | 'text';
  }>({
    resume: 'file',
    job_description: 'file'
  });

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
    maxSize: 10 * 1024 * 1024 // 10MB
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
    maxSize: 10 * 1024 * 1024 // 10MB
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

  // Process documents with external API
  const handleProcessDocuments = async () => {
    setIsProcessing(true);
    setProcessingError("");

    try {
      let resumeUrl = uploadedFiles.resume?.url || null;
      let jobDescUrl = uploadedFiles.job_description?.url || null;

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
        job_description_url: jobDescUrl
      });

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
  const hasAnyContent = hasUploadedFiles || hasTextInput;
  
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-5 pt-16 pb-7">
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

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Resume Upload */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
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
                <div className="flex gap-2 mt-2">
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
              <CardContent>
                {inputMode.resume === 'file' ? (
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
                ) : (
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Paste your resume content here..."
                      value={resumeText}
                      onChange={(e) => setResumeText(e.target.value)}
                      className="min-h-[200px]"
                    />
                    {resumeText.trim() && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
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
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
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
                <div className="flex gap-2 mt-2">
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
              <CardContent>
                {inputMode.job_description === 'file' ? (
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
                ) : (
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Paste the job description here..."
                      value={jobDescText}
                      onChange={(e) => setJobDescText(e.target.value)}
                      className="min-h-[200px]"
                    />
                    {jobDescText.trim() && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        Job description ready ({jobDescText.trim().split('\n').length} lines)
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Processing Error */}
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

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex gap-4 justify-center"
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

          {/* Status Summary */}
          {hasAnyContent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <span>Resume:</span>
                      <Badge variant={
                        uploadedFiles.resume ? "default" : 
                        (inputMode.resume === 'text' && resumeText.trim()) ? "default" : "secondary"
                      }>
                        {uploadedFiles.resume ? uploadedFiles.resume.status : 
                         (inputMode.resume === 'text' && resumeText.trim()) ? "text ready" : "not uploaded"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Job Description:</span>
                      <Badge variant={
                        uploadedFiles.job_description ? "default" : 
                        (inputMode.job_description === 'text' && jobDescText.trim()) ? "default" : "secondary"
                      }>
                        {uploadedFiles.job_description ? uploadedFiles.job_description.status : 
                         (inputMode.job_description === 'text' && jobDescText.trim()) ? "text ready" : "not uploaded"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
