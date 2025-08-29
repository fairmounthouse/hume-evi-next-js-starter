"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { FileText, Download, Loader2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils";
import ScrollFadeIndicator from "./ScrollFadeIndicator";

interface SessionDocument {
  id: string;
  session_id?: string;
  document_type: 'resume' | 'job_description';
  original_filename: string;
  file_size_bytes: number;
  mime_type: string;
  file_path: string;
  file_url: string;
  extracted_text?: string; // Legacy field
  extracted_text_file_path?: string; // New: path to .txt file
  extracted_text_file_url?: string; // New: URL to .txt file
  upload_status?: string;
  created_at: string;
  signed_url?: string;
  source: 'user_document' | 'session_document';
  title?: string; // For user documents
  user_id?: string; // For user documents
  alias?: string;
  last_used_at?: string;
}

interface SessionDocumentsProps {
  sessionId: string;
  className?: string;
}

export default function SessionDocuments({ sessionId, className }: SessionDocumentsProps) {
  const [documents, setDocuments] = useState<SessionDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [selectedDoc, setSelectedDoc] = useState<SessionDocument | null>(null);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, [sessionId]);

  const fetchDocuments = async () => {
    if (!sessionId) return;
    
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch(`/api/sessions/documents?sessionId=${sessionId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch documents: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        const baseDocuments = result.documents || [];
        setDocuments(baseDocuments);
      } else {
        throw new Error(result.error || 'Failed to fetch documents');
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      setError(error instanceof Error ? error.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getDocumentTypeLabel = (type: string): string => {
    switch (type) {
      case 'resume': return 'Resume';
      case 'job_description': return 'Job Description';
      default: return type;
    }
  };

  const handleViewDocument = async (doc: SessionDocument) => {
    // Fetch extracted text if available
    let docWithText = { ...doc };
    
    if (doc.extracted_text_file_url && !doc.extracted_text) {
      try {
        console.log("📄 Fetching extracted text from:", doc.extracted_text_file_url);
        const response = await fetch(doc.extracted_text_file_url);
        if (response.ok) {
          const extractedText = await response.text();
          docWithText.extracted_text = extractedText;
          console.log("✅ Fetched extracted text:", extractedText.substring(0, 100) + "...");
        } else {
          console.warn("⚠️ Failed to fetch extracted text:", response.statusText);
        }
      } catch (error) {
        console.error("❌ Error fetching extracted text:", error);
      }
    }
    
    setSelectedDoc(docWithText);
    setShowPopup(true);
  };

  const handleDownloadDocument = (doc: SessionDocument) => {
    if (doc.signed_url) {
      // Open download in new tab
      window.open(doc.signed_url, '_blank');
    }
  };

  const closePopup = () => {
    setShowPopup(false);
    setSelectedDoc(null);
  };

  if (loading) {
    return (
      <div className={cn("flex items-center gap-2 text-gray-500", className)}>
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading documents...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("flex items-center gap-2 text-red-600", className)}>
        <AlertCircle className="w-4 h-4" />
        <span className="text-sm">{error}</span>
      </div>
    );
  }

  if (documents.length === 0) {
    return null; // Don't show the component if no documents
  }

  return (
    <>
      {/* Compact Document Buttons - No label text, just buttons */}
      <div className={cn("flex items-center gap-2", className)}>
        {documents.map((doc) => (
          <Button
            key={doc.id}
            variant="outline"
            size="sm"
            onClick={() => handleViewDocument(doc)}
            className="flex items-center gap-1"
          >
            <FileText className="w-3 h-3" />
            {getDocumentTypeLabel(doc.document_type)}
          </Button>
        ))}
        
        {/* Visual separator after document buttons */}
        {documents.length > 0 && (
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
        )}
      </div>

      {/* Document Popup Modal */}
      <AnimatePresence>
        {showPopup && selectedDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={closePopup}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  <h3 className="text-lg font-semibold">
                    {selectedDoc.alias || selectedDoc.title || selectedDoc.original_filename}
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    {getDocumentTypeLabel(selectedDoc.document_type)}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadDocument(selectedDoc)}
                    className="flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    Download
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={closePopup}
                    className="flex items-center gap-1"
                  >
                    ✕
                  </Button>
                </div>
              </div>

              {/* Modal Body */}
              <ScrollFadeIndicator 
                className="max-h-[60vh] p-4"
                fadeHeight={40}
                fadeColor="white"
              >
                <div className="space-y-4">
                  {/* Document Info */}
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <div>Size: {formatFileSize(selectedDoc.file_size_bytes)}</div>
                    <div>
                      {selectedDoc.last_used_at 
                        ? `Last used: ${new Date(selectedDoc.last_used_at).toLocaleDateString()}`
                        : `Uploaded: ${new Date(selectedDoc.created_at).toLocaleDateString()}`
                      }
                    </div>
                  </div>

                  {/* Document Content */}
                  {selectedDoc.extracted_text ? (
                    <div>
                      <h4 className="font-medium mb-2">Content:</h4>
                      <ScrollFadeIndicator 
                        className="max-h-96 bg-gray-50 dark:bg-gray-800 rounded-lg border p-4 text-sm whitespace-pre-wrap"
                        fadeHeight={30}
                        fadeColor="rgb(249 250 251)"
                      >
                        {selectedDoc.extracted_text}
                      </ScrollFadeIndicator>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No text content available for preview</p>
                      <p className="text-xs">You can download the original file to view it</p>
                    </div>
                  )}
                </div>
              </ScrollFadeIndicator>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}