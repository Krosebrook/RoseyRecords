import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, Upload, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { usePageTitle } from "@/hooks/use-page-title";

export default function Visualizer() {
  usePageTitle("Audio Visualizer");
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationRef = useRef<number>(0);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [audioFile, setAudioFile] = useState<string | null>(null);
  const [audioName, setAudioName] = useState("No audio loaded");

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current && audioRef.current) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      
      const source = audioContext.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      sourceRef.current = source;
    }
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2 - 40;

    ctx.clearRect(0, 0, width, height);

    // Draw grid background
    ctx.strokeStyle = "rgba(0, 255, 255, 0.1)";
    ctx.lineWidth = 1;
    
    // Horizontal lines
    for (let y = 0; y < height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Vertical lines (perspective)
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, height * 0.6);
      ctx.lineTo(centerX + (x - centerX) * 0.3, height);
      ctx.stroke();
    }

    // Draw circular visualizer
    const innerRadius = 80;
    const outerRadius = 160;
    const segments = 64;
    const segmentAngle = (Math.PI * 2) / segments;
    const gap = 0.02;

    for (let i = 0; i < segments; i++) {
      const dataIndex = Math.floor((i / segments) * bufferLength);
      const value = dataArray[dataIndex] / 255;
      const barHeight = value * (outerRadius - innerRadius) + 10;
      
      const startAngle = i * segmentAngle - Math.PI / 2;
      const endAngle = startAngle + segmentAngle - gap;
      
      // Gradient from orange to red
      const hue = 20 - value * 20;
      const saturation = 100;
      const lightness = 50 + value * 20;
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, innerRadius, startAngle, endAngle);
      ctx.arc(centerX, centerY, innerRadius + barHeight, endAngle, startAngle, true);
      ctx.closePath();
      
      const gradient = ctx.createRadialGradient(centerX, centerY, innerRadius, centerX, centerY, outerRadius);
      gradient.addColorStop(0, `hsl(${hue + 20}, ${saturation}%, ${lightness}%)`);
      gradient.addColorStop(1, `hsl(${hue}, ${saturation}%, ${lightness - 10}%)`);
      ctx.fillStyle = gradient;
      ctx.fill();
      
      // Glow effect
      ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
      ctx.shadowBlur = 10 * value;
    }
    ctx.shadowBlur = 0;

    // Draw outer ring segments (decorative)
    const outerSegments = 16;
    const outerSegmentAngle = (Math.PI * 2) / outerSegments;
    for (let i = 0; i < outerSegments; i++) {
      const dataIndex = Math.floor((i / outerSegments) * bufferLength);
      const value = dataArray[dataIndex] / 255;
      
      const startAngle = i * outerSegmentAngle - Math.PI / 2;
      const endAngle = startAngle + outerSegmentAngle * 0.6;
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius + 20 + value * 30, startAngle, endAngle);
      ctx.strokeStyle = `hsla(${30 - value * 30}, 100%, 60%, ${0.3 + value * 0.7})`;
      ctx.lineWidth = 8;
      ctx.stroke();
    }

    // Draw frequency spectrum bars at bottom
    const barWidth = width / bufferLength * 2;
    const spectrumY = height * 0.65;
    const maxBarHeight = height * 0.25;

    for (let i = 0; i < bufferLength; i++) {
      const value = dataArray[i] / 255;
      const barHeight = value * maxBarHeight;
      const x = (i / bufferLength) * width;
      
      // Gradient from cyan to orange to red
      const hue = 180 - (i / bufferLength) * 180;
      
      // Main bars
      const barGradient = ctx.createLinearGradient(x, spectrumY, x, spectrumY + barHeight);
      barGradient.addColorStop(0, `hsla(${hue}, 100%, 70%, 0.9)`);
      barGradient.addColorStop(1, `hsla(${hue}, 100%, 50%, 0.6)`);
      
      ctx.fillStyle = barGradient;
      ctx.fillRect(x, spectrumY, barWidth - 1, barHeight);
      
      // Reflection
      const reflectionGradient = ctx.createLinearGradient(x, spectrumY + barHeight, x, spectrumY + barHeight + barHeight * 0.5);
      reflectionGradient.addColorStop(0, `hsla(${hue}, 100%, 50%, 0.3)`);
      reflectionGradient.addColorStop(1, `hsla(${hue}, 100%, 50%, 0)`);
      
      ctx.fillStyle = reflectionGradient;
      ctx.fillRect(x, spectrumY + barHeight, barWidth - 1, barHeight * 0.5);
    }

    // Draw waveform overlay
    const waveformY = height * 0.72;
    ctx.beginPath();
    ctx.moveTo(0, waveformY);
    
    for (let i = 0; i < bufferLength; i++) {
      const value = dataArray[i] / 255;
      const x = (i / bufferLength) * width;
      const y = waveformY - value * 30;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    const waveGradient = ctx.createLinearGradient(0, waveformY - 30, width, waveformY);
    waveGradient.addColorStop(0, "rgba(255, 150, 100, 0.8)");
    waveGradient.addColorStop(0.5, "rgba(255, 100, 100, 0.8)");
    waveGradient.addColorStop(1, "rgba(200, 100, 255, 0.8)");
    
    ctx.strokeStyle = waveGradient;
    ctx.lineWidth = 2;
    ctx.stroke();

    animationRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const resizeCanvas = () => {
        const container = canvas.parentElement;
        if (container) {
          canvas.width = container.clientWidth;
          canvas.height = container.clientHeight;
        }
      };
      resizeCanvas();
      window.addEventListener("resize", resizeCanvas);
      return () => window.removeEventListener("resize", resizeCanvas);
    }
  }, []);

  useEffect(() => {
    if (isPlaying) {
      draw();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, draw]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handlePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio || !audioFile) return;

    initAudioContext();
    
    if (audioContextRef.current?.state === "suspended") {
      await audioContextRef.current.resume();
    }

    if (isPlaying) {
      audio.pause();
    } else {
      await audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioFile(url);
      setAudioName(file.name);
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const toggleLoop = () => {
    setIsLooping(!isLooping);
    if (audioRef.current) {
      audioRef.current.loop = !isLooping;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex flex-col">
      {/* Header */}
      <header className="p-3 md:p-4 border-b border-cyan-900/30">
        <h1 
          className="text-lg sm:text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-500 to-purple-500"
          style={{ fontFamily: "'Orbitron', sans-serif" }}
          data-testid="visualizer-title"
        >
          HarmoniQ Audio Visualizer
        </h1>
      </header>

      {/* Canvas Container */}
      <div className="flex-1 relative overflow-hidden">
        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 w-full h-full"
          data-testid="visualizer-canvas"
        />
        
        {!audioFile && (
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center p-8 rounded-xl bg-gradient-to-br from-purple-900/30 to-cyan-900/30 border border-cyan-500/20 backdrop-blur-sm"
            >
              <Upload className="w-16 h-16 mx-auto mb-4 text-cyan-400" />
              <p className="text-cyan-300 mb-4">Upload an audio file to visualize</p>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  data-testid="input-audio-upload"
                />
                <span className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold hover:from-orange-400 hover:to-red-400 transition-all">
                  <Upload className="w-5 h-5" />
                  Choose Audio File
                </span>
              </label>
            </motion.div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-3 md:p-6 bg-gradient-to-t from-[#0a0a1a] to-transparent">
        {/* Progress bar */}
        <div className="mb-3 md:mb-4">
          <div className="flex items-center gap-2 md:gap-3 mb-2">
            <span className="text-[10px] md:text-xs text-cyan-400 w-10 md:w-12">{formatTime(currentTime)}</span>
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSeek}
              className="flex-1"
              data-testid="slider-progress"
            />
            <span className="text-[10px] md:text-xs text-cyan-400 w-10 md:w-12 text-right">{formatTime(duration)}</span>
          </div>
          
          {/* Track markers - hidden on very small screens */}
          <div className="hidden sm:flex justify-between px-12">
            {[0, 0.25, 0.5, 0.75, 1].map((pos, i) => (
              <div 
                key={i}
                className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 border-2 border-cyan-300/50"
              />
            ))}
          </div>
        </div>

        {/* Control buttons */}
        <div className="flex items-center justify-center gap-2 md:gap-4">
          <label className="cursor-pointer">
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="p-2 md:p-3 rounded-full bg-cyan-900/30 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-800/30 transition-colors">
              <Upload className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </label>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 md:p-3 rounded-full bg-cyan-900/30 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-800/30 h-auto w-auto"
            data-testid="button-mute"
          >
            {isMuted ? <VolumeX className="w-4 h-4 md:w-5 md:h-5" /> : <Volume2 className="w-4 h-4 md:w-5 md:h-5" />}
          </Button>

          <Slider
            value={[volume * 100]}
            max={100}
            onValueChange={(v) => setVolume(v[0] / 100)}
            className="w-16 md:w-24"
            data-testid="slider-volume"
          />

          <Button
            size="icon"
            onClick={handlePlayPause}
            disabled={!audioFile}
            className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-orange-500 to-red-600 border-2 border-orange-400/50 text-white hover:from-orange-400 hover:to-red-500 disabled:opacity-50"
            data-testid="button-play-pause"
          >
            {isPlaying ? <Pause className="w-5 h-5 md:w-6 md:h-6" /> : <Play className="w-5 h-5 md:w-6 md:h-6 ml-0.5" />}
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={toggleLoop}
            className={`p-2 md:p-3 rounded-full border transition-colors h-auto w-auto ${
              isLooping 
                ? "bg-orange-500/30 border-orange-500/50 text-orange-400" 
                : "bg-cyan-900/30 border-cyan-500/30 text-cyan-400 hover:bg-cyan-800/30"
            }`}
            data-testid="button-loop"
          >
            <RotateCcw className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
        </div>

        {/* Audio name */}
        <p className="text-center mt-3 md:mt-4 text-xs md:text-sm text-cyan-400/70 truncate px-4" data-testid="text-audio-name">
          {audioName}
        </p>
      </div>

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={audioFile || undefined}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        data-testid="audio-element"
      />
    </div>
  );
}
