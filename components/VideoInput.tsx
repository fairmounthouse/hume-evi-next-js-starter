"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { Video, VideoOff } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/utils";
import { toast } from "sonner";

export default function VideoInput() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const startVideo = async () => {
    console.log("Starting video...");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        } 
      });
      
      console.log("Got stream:", stream);
      streamRef.current = stream;
      setIsVideoOn(true);
      setHasPermission(true);
      
      // Set video source after state update
      setTimeout(() => {
        if (videoRef.current && streamRef.current) {
          videoRef.current.srcObject = streamRef.current;
          console.log("Video started successfully!");
        }
      }, 100);
    } catch (error) {
      console.error("Error accessing camera:", error);
      setHasPermission(false);
      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          toast.error("Camera access denied. Please grant permission to use the camera.");
        } else if (error.name === "NotFoundError") {
          toast.error("No camera found. Please connect a camera and try again.");
        } else {
          toast.error("Unable to access camera: " + error.message);
        }
      }
    }
  };

  const stopVideo = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsVideoOn(false);
    }
  };

  const toggleVideo = () => {
    if (isVideoOn) {
      stopVideo();
    } else {
      startVideo();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopVideo();
    };
  }, []);

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {isVideoOn && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "relative overflow-hidden rounded-xl border border-border/50",
              "bg-card shadow-sm"
            )}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full min-h-[200px] max-h-[300px] object-cover mirror"
              style={{ transform: "scaleX(-1)" }} // Mirror the video for natural self-view
            />
            <div className="absolute bottom-2 right-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={toggleVideo}
                className="rounded-full shadow-md bg-background/80 backdrop-blur"
              >
                <VideoOff className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
        
        {!isVideoOn && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              "flex items-center justify-center p-8 rounded-xl border-2 border-dashed border-border",
              "bg-card shadow-lg"
            )}
          >
            <div className="text-center">
              <Video className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground mb-3">
                Camera is {hasPermission === false ? "blocked" : "off"}
              </p>
              <button
                onClick={() => {
                  console.log("Camera button clicked!");
                  toggleVideo();
                }}
                className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors font-medium"
                style={{ cursor: "pointer" }}
              >
                <Video className="h-4 w-4 mr-1.5" />
                Turn on camera
              </button>
              {hasPermission === false && (
                <p className="text-xs text-muted-foreground mt-2">
                  Please allow camera access in your browser settings
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
