"use client";
import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { Button } from "./ui/button";
import { Video, VideoOff, User } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/utils";
import { toast } from "sonner";

export interface VideoInputRef {
  getStream: () => MediaStream | null;
  startVideo: () => Promise<void>;
  stopVideo: () => void;
}

interface VideoInputProps {
  autoStart?: boolean;
}

const VideoInput = forwardRef<VideoInputRef, VideoInputProps>(({ autoStart = false }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  const startVideo = async () => {
    console.log("🎥 Starting video...");
    try {
      let stream: MediaStream;
      
      try {
        // Try to get real camera
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user"
          } 
        });
        console.log("✅ Got real camera stream:", stream);
        setUsingFallback(false);
        toast.success("Camera connected successfully!");
      } catch (cameraError) {
        console.warn("📷 Camera failed, trying basic video:", cameraError);
        
        try {
          // Try basic video request
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
          console.log("✅ Got basic camera stream:", stream);
          setUsingFallback(false);
          toast.success("Camera connected successfully!");
        } catch (basicError) {
          console.warn("📷 Both camera attempts failed, creating test pattern:", basicError);
          
          // Create a simple test pattern that definitely works
          const canvas = document.createElement('canvas');
          canvas.width = 1280;
          canvas.height = 720;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error("Canvas context not available");

          // Professional virtual camera background (like Zoom)
          const animate = () => {
            // Dark gradient background
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, '#1a1a1a');
            gradient.addColorStop(0.5, '#2d2d2d');
            gradient.addColorStop(1, '#1a1a1a');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Avatar circle (static, professional)
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const radius = 100;
            
            // Avatar background circle
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            ctx.fillStyle = '#4a5568';
            ctx.fill();
            
            // Avatar border
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            ctx.strokeStyle = '#718096';
            ctx.lineWidth = 4;
            ctx.stroke();
            
            // User icon (professional)
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 72px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('👤', centerX, centerY);
            
            // "Camera Off" text
            ctx.fillStyle = '#e2e8f0';
            ctx.font = 'bold 28px Arial';
            ctx.fillText('Camera Off', centerX, centerY + 160);
            
            // Subtle breathing effect (very gentle)
            const time = Date.now() * 0.001;
            const breatheAlpha = 0.4 + 0.2 * Math.sin(time * 1.5);
            ctx.globalAlpha = breatheAlpha;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius + 8, 0, 2 * Math.PI);
            ctx.strokeStyle = '#60a5fa';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.globalAlpha = 1.0;
            
            // Only animate once every 100ms to reduce CPU usage
            setTimeout(() => requestAnimationFrame(animate), 100);
          };
          
          animate();
          
          stream = canvas.captureStream(30);
          setUsingFallback(true);
          toast.info("Using virtual camera (no physical camera detected)");
          console.log("✅ Created animated test pattern stream:", stream);
        }
      }
      
      streamRef.current = stream;
      setIsVideoOn(true);
      setHasPermission(true);
      
      // Set video source
      setTimeout(() => {
        if (videoRef.current && streamRef.current) {
          videoRef.current.srcObject = streamRef.current;
          console.log("✅ Video element source set!");
        }
      }, 100);
      
    } catch (error) {
      console.error("❌ Video startup failed:", error);
      setHasPermission(false);
      toast.error("Unable to start video");
    }
  };

  const stopVideo = () => {
    console.log("🎥 Stopping video...");
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        console.log("🎥 Stopping track:", track.kind);
        track.stop();
      });
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsVideoOn(false);
    setUsingFallback(false);
  };

  const toggleVideo = () => {
    console.log("🎥 Toggle video clicked, current state:", { isVideoOn });
    if (isVideoOn) {
      stopVideo();
    } else {
      startVideo();
    }
  };

  // Expose controls through ref
  useImperativeHandle(ref, () => ({
    getStream: () => streamRef.current,
    startVideo,
    stopVideo,
  }));

  // Auto-start video if requested
  useEffect(() => {
    console.log("🎥 VideoInput autoStart effect:", { autoStart, isVideoOn });
    if (autoStart && !isVideoOn) {
      console.log("🚀 AUTO-STARTING CAMERA NOW!");
      toast.info("Starting camera...");
      startVideo();
    }
  }, [autoStart]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("🎥 VideoInput unmounting - cleaning up");
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
              className={cn(
                "w-full h-full min-h-[200px] max-h-[300px] object-cover",
                !usingFallback && "mirror" // Only mirror real camera
              )}
              style={{ 
                transform: !usingFallback ? "scaleX(-1)" : "none",
                backgroundColor: '#000' // Fallback background
              }}
              onLoadedMetadata={() => {
                console.log("🎥 Video element loaded metadata successfully");
              }}
              onError={(e) => {
                console.error("🎥 Video element error:", e);
              }}
            />
            
            {/* Status indicator */}
            <div className="absolute top-2 left-2">
              <div className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                usingFallback 
                  ? "bg-orange-500/20 text-orange-300 border border-orange-500/30"
                  : "bg-green-500/20 text-green-300 border border-green-500/30"
              )}>
                {usingFallback ? (
                  <>
                    <User className="h-3 w-3" />
                    Virtual
                  </>
                ) : (
                  <>
                    <Video className="h-3 w-3" />
                    Live
                  </>
                )}
              </div>
            </div>
            
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
                Camera is {hasPermission === false ? "unavailable" : "off"}
              </p>
              <button
                onClick={() => {
                  console.log("🎥 Camera button clicked!");
                  toggleVideo();
                }}
                className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors font-medium"
                style={{ cursor: "pointer" }}
              >
                <Video className="h-4 w-4 mr-1.5" />
                Start Video
              </button>
              {hasPermission === false && (
                <p className="text-xs text-muted-foreground mt-2">
                  Will use virtual camera if no physical camera is available
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

VideoInput.displayName = "VideoInput";

export default VideoInput;