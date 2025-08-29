"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Camera, 
  Mic, 
  Volume2, 
  Settings, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  Play,
  Square,
  X
} from "lucide-react";
import { cn } from "@/utils";
import { toast } from "sonner";

interface MediaDeviceInfo {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
}

interface DeviceSetupProps {
  onContinue: (devices: {
    cameraId: string;
    microphoneId: string;
    speakerId: string;
  }) => void;
  onClose?: () => void;
  isModal?: boolean;
}

export default function DeviceSetup({ onContinue, onClose, isModal = false }: DeviceSetupProps) {
  // Device lists
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [speakers, setSpeakers] = useState<MediaDeviceInfo[]>([]);
  
  // Selected devices
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const [selectedMicrophone, setSelectedMicrophone] = useState<string>("");
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>("");
  
  // Preview states
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [isTestingAudio, setIsTestingAudio] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  
  // Permission states
  const [hasVideoPermission, setHasVideoPermission] = useState<boolean | null>(null);
  const [hasAudioPermission, setHasAudioPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize devices and permissions
  useEffect(() => {
    initializeDevices();
    return () => {
      cleanup();
    };
  }, []);

  // Update video element when stream changes or ref becomes available
  useEffect(() => {
    if (videoStream && videoRef.current) {
      const videoElement = videoRef.current;
      videoElement.srcObject = videoStream;
      videoElement.play().catch(e => console.warn("Video autoplay failed:", e));
    }
  }, [videoStream]);

  // Also try to connect when component re-renders (ref becomes available)
  useEffect(() => {
    if (videoStream && videoRef.current && !videoRef.current.srcObject) {
      const videoElement = videoRef.current;
      videoElement.srcObject = videoStream;
      videoElement.play().catch(e => console.warn("Video autoplay failed:", e));
    }
  });

  const cleanup = () => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
    }
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(e => console.warn("AudioContext close failed:", e));
      audioContextRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const initializeDevices = async () => {
    setIsLoading(true);
    try {
      // Request permissions first
      await requestPermissions();
      
      // Enumerate devices and select defaults
      await enumerateDevices();
      
    } catch (error) {
      console.error("Failed to initialize devices:", error);
      toast.error("Failed to access media devices");
    } finally {
      setIsLoading(false);
    }
  };

  const requestPermissions = async () => {
    try {
      // Request video permission
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasVideoPermission(true);
        videoStream.getTracks().forEach(track => track.stop());
      } catch {
        setHasVideoPermission(false);
      }

      // Request audio permission
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setHasAudioPermission(true);
        audioStream.getTracks().forEach(track => track.stop());
      } catch {
        setHasAudioPermission(false);
      }
    } catch (error) {
      console.error("Permission request failed:", error);
    }
  };

  const enumerateDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      const videoInputs = devices
        .filter(device => device.kind === 'videoinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${devices.filter(d => d.kind === 'videoinput').indexOf(device) + 1}`,
          kind: device.kind
        }));

      const audioInputs = devices
        .filter(device => device.kind === 'audioinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Microphone ${devices.filter(d => d.kind === 'audioinput').indexOf(device) + 1}`,
          kind: device.kind
        }));

      const audioOutputs = devices
        .filter(device => device.kind === 'audiooutput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Speaker ${devices.filter(d => d.kind === 'audiooutput').indexOf(device) + 1}`,
          kind: device.kind
        }));

      setCameras(videoInputs);
      setMicrophones(audioInputs);
      setSpeakers(audioOutputs);
      
      // Select default devices immediately after enumeration
      await selectDefaultDevices(videoInputs, audioInputs, audioOutputs);
      
    } catch (error) {
      console.error("Failed to enumerate devices:", error);
      toast.error("Failed to list available devices");
    }
  };

  const selectDefaultDevices = async (videoInputs: MediaDeviceInfo[], audioInputs: MediaDeviceInfo[], audioOutputs: MediaDeviceInfo[]) => {
    // Select first available devices as defaults
    if (videoInputs.length > 0) {
      const defaultCamera = videoInputs[0].deviceId;
      setSelectedCamera(defaultCamera);
      await startVideoPreview(defaultCamera);
    }
    
    if (audioInputs.length > 0) {
      const defaultMic = audioInputs[0].deviceId;
      setSelectedMicrophone(defaultMic);
      await startAudioPreview(defaultMic);
    }
    
    if (audioOutputs.length > 0) {
      const defaultSpeaker = audioOutputs[0].deviceId;
      setSelectedSpeaker(defaultSpeaker);
    }
  };

  const startVideoPreview = async (deviceId: string) => {
    try {
      // Stop existing stream
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          deviceId: deviceId ? { exact: deviceId } : undefined,
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });

      setVideoStream(stream);
      
    } catch (error) {
      console.error("Failed to start video preview:", error);
      toast.error("Failed to start camera preview");
    }
  };

  const startAudioPreview = async (deviceId: string) => {
    try {
      // Stop existing stream
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { 
          deviceId: deviceId ? { exact: deviceId } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      setAudioStream(stream);
      setupAudioLevelMonitoring(stream);
      
    } catch (error) {
      console.error("Failed to start audio preview:", error);
      toast.error("Failed to start microphone preview");
    }
  };

  const setupAudioLevelMonitoring = (stream: MediaStream) => {
    try {
      // Clean up existing audio context first
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(e => console.warn("Previous AudioContext close failed:", e));
      }
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      const gain = audioContext.createGain();
      // Apply a modest boost so quieter mics register visibly on the meter
      gain.gain.value = 2.0;
      
      analyser.fftSize = 256;
      microphone.connect(gain);
      gain.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      monitorAudioLevel();
    } catch (error) {
      console.error("Failed to setup audio monitoring:", error);
    }
  };

  const monitorAudioLevel = () => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    // Slight non-linear scaling for better low-end sensitivity in UI meter
    const scaled = Math.min(1, Math.pow(average / 255, 0.8));
    setAudioLevel(scaled);
    
    animationFrameRef.current = requestAnimationFrame(monitorAudioLevel);
  };

  const testSpeaker = async () => {
    if (!selectedSpeaker) return;
    
    setIsTestingAudio(true);
    let testAudioContext: AudioContext | null = null;
    
    try {
      // Create a simple test tone
      testAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = testAudioContext.createOscillator();
      const gainNode = testAudioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(testAudioContext.destination);
      
      // Set audio output device if supported
      if ('setSinkId' in testAudioContext.destination) {
        try {
          await (testAudioContext.destination as any).setSinkId(selectedSpeaker);
        } catch (error) {
          console.warn("Failed to set audio output device:", error);
        }
      }
      
      oscillator.frequency.setValueAtTime(440, testAudioContext.currentTime); // A4 note
      gainNode.gain.setValueAtTime(0.1, testAudioContext.currentTime);
      
      oscillator.start();
      
      setTimeout(() => {
        oscillator.stop();
        if (testAudioContext && testAudioContext.state !== 'closed') {
          testAudioContext.close().catch(e => console.warn("Test AudioContext close failed:", e));
        }
        setIsTestingAudio(false);
      }, 1000);
      
    } catch (error) {
      console.error("Failed to test speaker:", error);
      toast.error("Failed to test speaker");
      if (testAudioContext && testAudioContext.state !== 'closed') {
        testAudioContext.close().catch(e => console.warn("Test AudioContext close failed:", e));
      }
      setIsTestingAudio(false);
    }
  };

  const handleCameraChange = async (deviceId: string) => {
    setSelectedCamera(deviceId);
    await startVideoPreview(deviceId);
  };

  const handleMicrophoneChange = async (deviceId: string) => {
    setSelectedMicrophone(deviceId);
    await startAudioPreview(deviceId);
  };

  const handleSpeakerChange = (deviceId: string) => {
    setSelectedSpeaker(deviceId);
  };

  const handleContinue = () => {
    cleanup();
    onContinue({
      cameraId: selectedCamera,
      microphoneId: selectedMicrophone,
      speakerId: selectedSpeaker
    });
  };

  const handleRefresh = () => {
    initializeDevices();
  };

  if (isLoading) {
    return (
      <div className={cn(
        "flex items-center justify-center",
        isModal ? "h-96" : "min-h-screen"
      )}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Settings className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Device Setup</h2>
        </div>
        <p className="text-gray-600">
          Configure your camera, microphone, and speakers for the best interview experience
        </p>
      </div>

      {/* Permission Warnings */}
      {(hasVideoPermission === false || hasAudioPermission === false) && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  Media permissions required
                </p>
                <p className="text-xs text-amber-700">
                  Please allow camera and microphone access for the best experience
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Video Setup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Camera className="w-5 h-5" />
              Camera
            </CardTitle>
            <CardDescription>
              Select and preview your camera
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Camera Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Camera Device
              </label>
              <Select value={selectedCamera} onValueChange={handleCameraChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select camera" />
                </SelectTrigger>
                <SelectContent>
                  {cameras.map((camera) => (
                    <SelectItem key={camera.deviceId} value={camera.deviceId}>
                      {camera.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Video Preview */}
            <div className="relative">
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                {videoStream ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                    style={{ 
                      backgroundColor: '#000',
                      transform: 'scaleX(-1)' // Mirror the video like a selfie camera
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <Camera className="w-8 h-8 text-gray-400 mx-auto" />
                      <p className="text-sm text-gray-500">
                        {hasVideoPermission === false 
                          ? "Camera permission denied" 
                          : isLoading 
                          ? "Loading camera..." 
                          : "No camera preview"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Status Badge */}
              <div className="absolute top-2 right-2">
                <Badge 
                  variant={hasVideoPermission && videoStream ? "default" : "secondary"}
                  className={cn(
                    "text-xs",
                    hasVideoPermission && videoStream 
                      ? "bg-green-100 text-green-800" 
                      : "bg-gray-100 text-gray-600"
                  )}
                >
                  {hasVideoPermission && videoStream ? (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Active
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Inactive
                    </>
                  )}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audio Setup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mic className="w-5 h-5" />
              Audio
            </CardTitle>
            <CardDescription>
              Configure your microphone and speakers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Microphone Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Microphone
              </label>
              <Select value={selectedMicrophone} onValueChange={handleMicrophoneChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select microphone" />
                </SelectTrigger>
                <SelectContent>
                  {microphones.map((mic) => (
                    <SelectItem key={mic.deviceId} value={mic.deviceId}>
                      {mic.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Audio Level Indicator */}
            {hasAudioPermission && audioStream && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Microphone Level
                </label>
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-gray-500" />
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-100"
                      style={{ width: `${Math.min(audioLevel * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-8">
                    {Math.round(audioLevel * 100)}%
                  </span>
                </div>
              </div>
            )}

            {/* Speaker Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Speakers
              </label>
              <div className="flex gap-2">
                <Select value={selectedSpeaker} onValueChange={handleSpeakerChange}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select speakers" />
                  </SelectTrigger>
                  <SelectContent>
                    {speakers.map((speaker) => (
                      <SelectItem key={speaker.deviceId} value={speaker.deviceId}>
                        {speaker.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={testSpeaker}
                  disabled={!selectedSpeaker || isTestingAudio}
                  className="px-3"
                >
                  {isTestingAudio ? (
                    <Square className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Click the play button to test your speakers
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4">
        <Button
          variant="outline"
          onClick={handleRefresh}
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Devices
        </Button>

        <div className="flex items-center gap-3">
          {isModal && onClose && (
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          )}
          <Button
            onClick={handleContinue}
            disabled={!selectedCamera && !selectedMicrophone}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Continue to Interview
          </Button>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6">
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="absolute top-4 right-4"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
            {content}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {content}
      </div>
    </div>
  );
}
