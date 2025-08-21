"use client";

import { FileText } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/utils";

interface FloatingTranscriptButtonProps {
  onClick: () => void;
  className?: string;
}

export default function FloatingTranscriptButton({ 
  onClick, 
  className = "" 
}: FloatingTranscriptButtonProps) {
  return (
    <Button
      onClick={onClick}
      className={cn(
        "fixed bottom-6 right-6 z-30 shadow-lg hover:shadow-xl transition-all duration-200",
        "bg-blue-600 hover:bg-blue-700 text-white",
        "rounded-full px-4 py-3 flex items-center gap-2",
        "lg:px-4 lg:py-3 md:px-3 md:py-2 sm:px-3 sm:py-2",
        className
      )}
      size="default"
    >
      <FileText className="w-5 h-5 lg:w-5 lg:h-5 md:w-4 md:h-4 sm:w-4 sm:h-4" />
      <span className="font-medium lg:inline md:inline sm:hidden">
        View Transcript
      </span>
    </Button>
  );
}
