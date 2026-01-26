import { useState, useEffect, useRef } from "react";
import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Music, Headphones, Piano, Guitar, Loader2, Play, Pause, Volume2, VolumeX, Lightbulb, RefreshCw, Sparkles, Clock, Wand2, Download, SkipForward, Mic, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { GENRES, MOODS } from "@shared/schema";
import { usePageTitle } from "@/hooks/use-page-title";
import { Onboarding, STUDIO_ONBOARDING_STEPS } from "@/components/Onboarding";

interface ChordData {
  root: string;
  variety: string;
  numeral: string;
}

const PIANO_KEYS = [
  { note: "C", black: false },
  { note: "C#", black: true },
  { note: "D", black: false },
  { note: "D#", black: true },
  { note: "E", black: false },
  { note: "F", black: false },
  { note: "F#", black: true },
  { note: "G", black: false },
  { note: "G#", black: true },
  { note: "A", black: false },
  { note: "A#", black: true },
  { note: "B", black: false },
];

const MUSICAL_KEYS = ["C", "C#/Db", "D", "D#/Eb", "E", "F", "F#/Gb", "G", "G#/Ab", "A", "A#/Bb", "B"];

const DURATION_OPTIONS = [
  { value: 30, label: "30s" },
  { value: 60, label: "1 min" },
  { value: 120, label: "2 min" },
  { value: 180, label: "3 min" },
];

type GenerationMode = "sample" | "full";
type GenerationEngine = "replicate" | "stable";

export default function Studio() {
  usePageTitle("Studio");
  const { toast } = useToast();
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  const [audioPrompt, setAudioPrompt] = useState("");
  const [targetDuration, setTargetDuration] = useState("60");
  const [selectedGenre, setSelectedGenre] = useState("Electronic");
  const [selectedMood, setSelectedMood] = useState("Energetic");
  const [bpm, setBpm] = useState("");
  const [musicalKey, setMusicalKey] = useState("");
  
  const [generationMode, setGenerationMode] = useState<GenerationMode>("sample");
  const [generationEngine, setGenerationEngine] = useState<GenerationEngine>("stable");
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  
  const [sampleUrl, setSampleUrl] = useState<string | null>(null);
  const [fullTrackUrl, setFullTrackUrl] = useState<string | null>(null);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const [currentDuration, setCurrentDuration] = useState(0);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<number | null>(null);
  
  const [chordKey, setChordKey] = useState("C");
  const [chordMood, setChordMood] = useState("Happy");
  const [chordProgression, setChordProgression] = useState<ChordData[]>([]);
  const [isGeneratingChords, setIsGeneratingChords] = useState(false);
  
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [scaleResults, setScaleResults] = useState<{ scale: string; reasoning: string }[]>([]);
  const [isLookingUpScales, setIsLookingUpScales] = useState(false);
  
  const [productionTip, setProductionTip] = useState<string | null>(null);
  const [isGettingTip, setIsGettingTip] = useState(false);

  // Vocals state (Bark singing AI)
  interface BarkVoice {
    id: string;
    name: string;
    gender: string;
  }
  const [vocalsText, setVocalsText] = useState("");
  const [barkVoices, setBarkVoices] = useState<BarkVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState("v2/en_speaker_6");
  const [textTemp, setTextTemp] = useState(0.7);
  const [waveformTemp, setWaveformTemp] = useState(0.7);
  const [isGeneratingVocals, setIsGeneratingVocals] = useState(false);
  const [vocalsUrl, setVocalsUrl] = useState<string | null>(null);
  const [barkConfigured, setBarkConfigured] = useState(false);
  const vocalsAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingVocals, setIsPlayingVocals] = useState(false);

  // Mixing state
  const [instrumentalVolume, setInstrumentalVolume] = useState(0.7);
  const [vocalsVolume, setVocalsVolume] = useState(0.8);
  const [vocalsDelay, setVocalsDelay] = useState(0);
  const [isMixPlaying, setIsMixPlaying] = useState(false);
  const mixInstrumentalRef = useRef<HTMLAudioElement | null>(null);
  const mixVocalsRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }
    setIsPlaying(false);
    setPlaybackProgress(0);
    
    if (currentAudioUrl) {
      const audio = new Audio(currentAudioUrl);
      audio.onended = () => {
        setIsPlaying(false);
        setPlaybackProgress(0);
      };
      audio.onloadedmetadata = () => {
        setCurrentDuration(audio.duration);
      };
      audio.muted = isMuted;
      audioRef.current = audio;
    }
  }, [currentAudioUrl]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const startProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    progressIntervalRef.current = window.setInterval(() => {
      if (audioRef.current) {
        const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
        setPlaybackProgress(progress);
      }
    }, 100);
  };

  const handleGenerateSample = async () => {
    if (!audioPrompt) {
      toast({ variant: "destructive", title: "Error", description: "Please describe the music you want to create" });
      return;
    }
    
    setGenerationMode("sample");
    setIsGeneratingAudio(true);
    setGenerationProgress(0);
    setSampleUrl(null);
    setFullTrackUrl(null);
    setCurrentAudioUrl(null);
    
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => Math.min(prev + 5, 90));
    }, 500);
    
    try {
      const endpoint = generationEngine === "stable" 
        ? "/api/stable-audio/sample"
        : "/api/audio/generate";
      
      const response = await apiRequest("POST", endpoint, {
        prompt: audioPrompt,
        duration: 15,
        genre: selectedGenre,
        mood: selectedMood,
        bpm: bpm ? parseInt(bpm) : undefined,
        key: musicalKey || undefined,
        instrumental: true
      });
      
      const data = await response.json();
      
      if (data.audioUrl) {
        setGenerationProgress(100);
        setSampleUrl(data.audioUrl);
        setCurrentAudioUrl(data.audioUrl);
        setGenerationMode("sample");
        toast({ title: "Sample Ready!", description: "Listen to your 15-second preview" });
      }
    } catch (err) {
      console.error("Sample generation error:", err);
      toast({ variant: "destructive", title: "Generation Failed", description: "Could not generate sample. Make sure FAL_KEY is configured." });
    } finally {
      clearInterval(progressInterval);
      setIsGeneratingAudio(false);
      setGenerationProgress(0);
    }
  };

  const handleGenerateFullTrack = async () => {
    if (!audioPrompt) {
      toast({ variant: "destructive", title: "Error", description: "Please describe the music you want to create" });
      return;
    }
    
    setGenerationMode("full");
    setIsGeneratingAudio(true);
    setGenerationProgress(0);
    setFullTrackUrl(null);
    
    const duration = parseInt(targetDuration);
    const estimatedTime = duration > 47 ? 30000 : 15000;
    const progressIncrement = 100 / (estimatedTime / 500);
    
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => Math.min(prev + progressIncrement, 95));
    }, 500);
    
    try {
      const response = await apiRequest("POST", "/api/stable-audio/full", {
        prompt: audioPrompt,
        duration,
        genre: selectedGenre,
        mood: selectedMood,
        bpm: bpm ? parseInt(bpm) : undefined,
        key: musicalKey || undefined,
        instrumental: true,
        useV25: duration > 47
      });
      
      const data = await response.json();
      
      if (data.audioUrl) {
        setGenerationProgress(100);
        setFullTrackUrl(data.audioUrl);
        setCurrentAudioUrl(data.audioUrl);
        setGenerationMode("full");
        toast({ 
          title: "Full Track Ready!", 
          description: `Your ${formatDuration(duration)} track is ready to play` 
        });
      }
    } catch (err) {
      console.error("Full track generation error:", err);
      toast({ variant: "destructive", title: "Generation Failed", description: "Could not generate full track" });
    } finally {
      clearInterval(progressInterval);
      setIsGeneratingAudio(false);
      setGenerationProgress(0);
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current || !currentAudioUrl) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      startProgressTracking();
      setIsPlaying(true);
    }
  };

  const handleToggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current && audioRef.current.duration) {
      audioRef.current.currentTime = (value[0] / 100) * audioRef.current.duration;
      setPlaybackProgress(value[0]);
    }
  };

  const switchToSample = () => {
    if (sampleUrl) {
      setCurrentAudioUrl(sampleUrl);
      setGenerationMode("sample");
    }
  };

  const switchToFullTrack = () => {
    if (fullTrackUrl) {
      setCurrentAudioUrl(fullTrackUrl);
      setGenerationMode("full");
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  };

  const formatCurrentTime = () => {
    if (!audioRef.current) return "0:00";
    const current = audioRef.current.currentTime;
    const mins = Math.floor(current / 60);
    const secs = Math.floor(current % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleGenerateChords = async () => {
    setIsGeneratingChords(true);
    try {
      const response = await apiRequest("POST", "/api/music-theory/chord-progression", {
        mood: chordMood,
        key: chordKey
      });
      const data = await response.json();
      setChordProgression(data.progression || []);
    } catch (err) {
      console.error("Chord generation error:", err);
      toast({ variant: "destructive", title: "Error", description: "Could not generate chords" });
    } finally {
      setIsGeneratingChords(false);
    }
  };

  const handleReharmonize = async () => {
    if (chordProgression.length === 0) return;
    setIsGeneratingChords(true);
    try {
      const response = await apiRequest("POST", "/api/music-theory/reharmonize", {
        progression: chordProgression,
        key: chordKey
      });
      const data = await response.json();
      setChordProgression(data.progression || []);
      toast({ title: "Reharmonized", description: "Chord progression updated with new variations" });
    } catch (err) {
      console.error("Reharmonize error:", err);
      toast({ variant: "destructive", title: "Error", description: "Could not reharmonize" });
    } finally {
      setIsGeneratingChords(false);
    }
  };

  const handlePianoKeyClick = (note: string) => {
    setSelectedNotes(prev => 
      prev.includes(note) 
        ? prev.filter(n => n !== note)
        : [...prev, note]
    );
  };

  const handleLookupScales = async () => {
    if (selectedNotes.length < 2) {
      toast({ variant: "destructive", title: "Error", description: "Select at least 2 notes" });
      return;
    }
    
    setIsLookingUpScales(true);
    try {
      const response = await apiRequest("POST", "/api/music-theory/lookup-scales", {
        notes: selectedNotes
      });
      const data = await response.json();
      setScaleResults(data.results || []);
    } catch (err) {
      console.error("Scale lookup error:", err);
      toast({ variant: "destructive", title: "Error", description: "Could not identify scales" });
    } finally {
      setIsLookingUpScales(false);
    }
  };

  const handleGetProductionTip = async () => {
    setIsGettingTip(true);
    try {
      const response = await apiRequest("POST", "/api/generate/production-tips", {
        genre: selectedGenre,
        mood: selectedMood,
        energy: "medium"
      });
      const data = await response.json();
      setProductionTip(data.tip);
    } catch (err) {
      console.error("Production tip error:", err);
    } finally {
      setIsGettingTip(false);
    }
  };

  // Bark singing AI functions
  useEffect(() => {
    const checkBark = async () => {
      try {
        const res = await fetch("/api/bark/status", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setBarkConfigured(data.configured);
          if (data.configured) {
            fetchBarkVoices();
          }
        }
      } catch {
        setBarkConfigured(false);
      }
    };
    checkBark();
  }, []);

  const fetchBarkVoices = async () => {
    try {
      const res = await fetch("/api/bark/voices", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setBarkVoices(data.voices || []);
      }
    } catch (err) {
      console.error("Failed to fetch Bark voices:", err);
    }
  };

  const handleGenerateVocals = async () => {
    if (!vocalsText.trim()) {
      toast({ title: "Please enter lyrics to sing", variant: "destructive" });
      return;
    }

    if (vocalsText.length > 2000) {
      toast({ title: "Lyrics too long (max 2000 characters for singing)", variant: "destructive" });
      return;
    }

    setIsGeneratingVocals(true);
    try {
      const response = await apiRequest("POST", "/api/bark/generate", {
        lyrics: vocalsText.trim(),
        voicePreset: selectedVoice,
        textTemp,
        waveformTemp
      });
      const data = await response.json();
      setVocalsUrl(data.audioUrl);
      toast({ title: "Singing vocals generated!" });
    } catch (err) {
      console.error("Vocals generation error:", err);
      toast({ title: "Failed to generate singing vocals", variant: "destructive" });
    } finally {
      setIsGeneratingVocals(false);
    }
  };

  // Update vocals audio when URL changes
  useEffect(() => {
    if (vocalsAudioRef.current) {
      vocalsAudioRef.current.pause();
      vocalsAudioRef.current = null;
    }
    setIsPlayingVocals(false);
    
    if (vocalsUrl) {
      const audio = new Audio(vocalsUrl);
      audio.onended = () => setIsPlayingVocals(false);
      vocalsAudioRef.current = audio;
    }
    
    return () => {
      if (vocalsAudioRef.current) {
        vocalsAudioRef.current.pause();
        vocalsAudioRef.current = null;
      }
    };
  }, [vocalsUrl]);

  const toggleVocalsPlayback = () => {
    if (!vocalsUrl || !vocalsAudioRef.current) return;
    
    if (isPlayingVocals) {
      vocalsAudioRef.current.pause();
      setIsPlayingVocals(false);
    } else {
      vocalsAudioRef.current.play();
      setIsPlayingVocals(true);
    }
  };

  // Mixing functions
  const stopMixPlayback = () => {
    if (mixInstrumentalRef.current) {
      mixInstrumentalRef.current.pause();
      mixInstrumentalRef.current.currentTime = 0;
    }
    if (mixVocalsRef.current) {
      mixVocalsRef.current.pause();
      mixVocalsRef.current.currentTime = 0;
    }
    setIsMixPlaying(false);
  };

  const playMix = () => {
    const instrumentalUrl = fullTrackUrl || sampleUrl;
    if (!instrumentalUrl || !vocalsUrl) {
      toast({ title: "Generate both instrumental and vocals first", variant: "destructive" });
      return;
    }

    stopMixPlayback();

    const instrumental = new Audio(instrumentalUrl);
    const vocals = new Audio(vocalsUrl);
    
    instrumental.volume = instrumentalVolume;
    vocals.volume = vocalsVolume;
    
    mixInstrumentalRef.current = instrumental;
    mixVocalsRef.current = vocals;

    instrumental.play();
    
    if (vocalsDelay > 0) {
      setTimeout(() => {
        vocals.play();
      }, vocalsDelay * 1000);
    } else {
      vocals.play();
    }

    setIsMixPlaying(true);

    instrumental.onended = () => {
      stopMixPlayback();
    };
  };

  const handleDownloadMix = async () => {
    const instrumentalUrl = fullTrackUrl || sampleUrl;
    if (!instrumentalUrl || !vocalsUrl) {
      toast({ title: "Generate both instrumental and vocals first", variant: "destructive" });
      return;
    }
    
    toast({ 
      title: "Download Individual Tracks", 
      description: "Due to browser limitations, please download the instrumental and vocals separately, then combine them in any audio editor." 
    });
  };

  // Cleanup mix on unmount
  useEffect(() => {
    return () => {
      stopMixPlayback();
    };
  }, []);

  const handleShowTour = () => {
    setShowOnboarding(true);
  };

  return (
    <Layout>
      <Onboarding
        steps={STUDIO_ONBOARDING_STEPS}
        storageKey="harmoniq-studio-onboarding"
        isOpen={showOnboarding}
        onComplete={() => setShowOnboarding(false)}
        onSkip={() => setShowOnboarding(false)}
      />
      
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
              <Music className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold" data-testid="text-studio-title">Music Studio</h1>
              <p className="text-xs sm:text-sm text-muted-foreground" data-testid="text-studio-subtitle">AI-powered music creation - up to 3 minutes</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShowTour}
            className="text-muted-foreground hover:text-foreground self-end sm:self-auto"
            data-testid="button-studio-tour"
          >
            <HelpCircle className="w-4 h-4 mr-2" />
            Tour
          </Button>
        </div>

        <Tabs defaultValue="audio" className="space-y-4">
          <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
            <TabsList className="inline-flex w-auto min-w-full md:grid md:w-full md:max-w-[600px] md:grid-cols-4">
              <TabsTrigger value="audio" className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4" data-testid="tab-audio">
                <Headphones className="w-4 h-4" />
                <span className="whitespace-nowrap">Audio</span>
              </TabsTrigger>
              <TabsTrigger value="vocals" className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4" data-testid="tab-vocals">
                <Mic className="w-4 h-4" />
                <span className="whitespace-nowrap">Vocals</span>
              </TabsTrigger>
              <TabsTrigger value="mix" className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4" data-testid="tab-mix">
                <Sparkles className="w-4 h-4" />
                <span className="whitespace-nowrap">Mix</span>
              </TabsTrigger>
              <TabsTrigger value="theory" className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4" data-testid="tab-theory">
                <Piano className="w-4 h-4" />
                <span className="whitespace-nowrap">Theory</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="audio" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="w-5 h-5 text-primary" />
                    Create Music
                  </CardTitle>
                  <CardDescription data-testid="text-audio-description">
                    Generate a quick 15s sample first, then create the full track
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="audio-prompt">Describe your music</Label>
                    <Input
                      id="audio-prompt"
                      value={audioPrompt}
                      onChange={(e) => setAudioPrompt(e.target.value)}
                      placeholder="e.g. Upbeat electronic track with synth arpeggios and driving bass"
                      data-testid="input-audio-prompt"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Genre</Label>
                      <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                        <SelectTrigger data-testid="select-genre">
                          <SelectValue placeholder="Select genre" />
                        </SelectTrigger>
                        <SelectContent>
                          {GENRES.map(g => (
                            <SelectItem key={g} value={g}>{g}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Mood</Label>
                      <Select value={selectedMood} onValueChange={setSelectedMood}>
                        <SelectTrigger data-testid="select-mood">
                          <SelectValue placeholder="Select mood" />
                        </SelectTrigger>
                        <SelectContent>
                          {MOODS.map(m => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bpm">BPM (optional)</Label>
                      <Input
                        id="bpm"
                        type="number"
                        value={bpm}
                        onChange={(e) => setBpm(e.target.value)}
                        placeholder="e.g. 120"
                        min={60}
                        max={200}
                        data-testid="input-bpm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Key (optional)</Label>
                      <Select value={musicalKey || "any"} onValueChange={(v) => setMusicalKey(v === "any" ? "" : v)}>
                        <SelectTrigger data-testid="select-key">
                          <SelectValue placeholder="Any key" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Any key</SelectItem>
                          {MUSICAL_KEYS.map(k => (
                            <SelectItem key={k} value={k}>{k}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Full Track Duration</Label>
                    <Select value={targetDuration} onValueChange={setTargetDuration}>
                      <SelectTrigger data-testid="select-duration">
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        {DURATION_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value.toString()}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {isGeneratingAudio && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Generating...</span>
                        <span className="text-muted-foreground">{Math.round(generationProgress)}%</span>
                      </div>
                      <Progress value={generationProgress} className="h-2" />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={handleGenerateSample}
                      disabled={isGeneratingAudio || !audioPrompt}
                      variant="outline"
                      className="flex-1"
                      data-testid="button-generate-sample"
                    >
                      {isGeneratingAudio && generationMode === "sample" ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4 mr-2" />
                      )}
                      15s Sample
                    </Button>
                    <Button
                      onClick={handleGenerateFullTrack}
                      disabled={isGeneratingAudio || !audioPrompt}
                      className="flex-1"
                      data-testid="button-generate-full"
                    >
                      {isGeneratingAudio && generationMode === "full" ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Clock className="w-4 h-4 mr-2" />
                      )}
                      Full Track
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Volume2 className="w-5 h-5 text-primary" />
                    Audio Player
                  </CardTitle>
                  <CardDescription data-testid="text-player-description">
                    {currentAudioUrl 
                      ? `Playing: ${generationMode === "sample" ? "15s Sample" : "Full Track"}`
                      : "Generate music to start listening"
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AnimatePresence mode="wait">
                    {currentAudioUrl ? (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="space-y-4"
                      >
                        <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex flex-col items-center justify-center relative overflow-hidden p-4">
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent animate-pulse" />
                          
                          {sampleUrl && fullTrackUrl && (
                            <div className="flex gap-2 mb-4 z-10">
                              <Button
                                size="sm"
                                variant={generationMode === "sample" ? "default" : "outline"}
                                onClick={switchToSample}
                                data-testid="button-switch-sample"
                              >
                                Sample
                              </Button>
                              <Button
                                size="sm"
                                variant={generationMode === "full" ? "default" : "outline"}
                                onClick={switchToFullTrack}
                                data-testid="button-switch-full"
                              >
                                Full Track
                              </Button>
                            </div>
                          )}

                          <div className="flex gap-3 z-10">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={handlePlayPause}
                              className="rounded-full bg-primary/20 backdrop-blur hover-elevate"
                              data-testid="button-play-pause"
                            >
                              {isPlaying ? (
                                <Pause className="w-6 h-6" />
                              ) : (
                                <Play className="w-6 h-6" />
                              )}
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={handleToggleMute}
                              className="rounded-full bg-primary/10"
                              data-testid="button-mute"
                            >
                              {isMuted ? (
                                <VolumeX className="w-4 h-4" />
                              ) : (
                                <Volume2 className="w-4 h-4" />
                              )}
                            </Button>
                            {currentAudioUrl && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="rounded-full bg-primary/10"
                                asChild
                                data-testid="button-download"
                              >
                                <a href={currentAudioUrl} download={`harmoniq-${generationMode}-${Date.now()}.wav`}>
                                  <Download className="w-4 h-4" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Slider
                            value={[playbackProgress]}
                            onValueChange={handleSeek}
                            max={100}
                            step={0.1}
                            className="cursor-pointer"
                            data-testid="slider-progress"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span data-testid="text-current-time">{formatCurrentTime()}</span>
                            <span data-testid="text-duration">{formatDuration(currentDuration)}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary" data-testid="badge-genre">{selectedGenre}</Badge>
                          <Badge variant="secondary" data-testid="badge-mood">{selectedMood}</Badge>
                          {bpm && <Badge variant="outline" data-testid="badge-bpm">{bpm} BPM</Badge>}
                          {musicalKey && <Badge variant="outline" data-testid="badge-key">{musicalKey}</Badge>}
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="aspect-video bg-muted/30 rounded-lg flex items-center justify-center"
                      >
                        <div className="text-center text-muted-foreground">
                          <Headphones className="w-12 h-12 mx-auto mb-2 opacity-30" />
                          <p className="text-sm" data-testid="text-no-audio">No audio generated yet</p>
                          <p className="text-xs mt-1">Start with a 15s sample to preview</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Lightbulb className="w-5 h-5 text-yellow-500" />
                    <div>
                      <p className="font-medium text-sm" data-testid="text-tip-title">AI Production Tips</p>
                      {productionTip ? (
                        <p className="text-sm text-muted-foreground" data-testid="text-tip-content">{productionTip}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground" data-testid="text-tip-placeholder">Get AI-powered tips for your music</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleGetProductionTip}
                    disabled={isGettingTip}
                    data-testid="button-get-tip"
                  >
                    {isGettingTip ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vocals Tab */}
          <TabsContent value="vocals" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mic className="w-5 h-5 text-primary" />
                    AI Vocals
                  </CardTitle>
                  <CardDescription data-testid="text-vocals-description">
                    Generate realistic singing vocals from lyrics
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!barkConfigured ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Mic className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Bark AI is not configured</p>
                      <p className="text-sm mt-2">Add your REPLICATE_API_KEY to enable singing vocals</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="vocals-text">Lyrics to sing</Label>
                        <Textarea
                          id="vocals-text"
                          value={vocalsText}
                          onChange={(e) => setVocalsText(e.target.value)}
                          placeholder="Enter the lyrics you want the AI to sing..."
                          className="min-h-[120px] resize-none"
                          data-testid="input-vocals-text"
                        />
                        <p className="text-xs text-muted-foreground">{vocalsText.length}/2000 characters (shorter works best for singing)</p>
                      </div>

                      <div className="space-y-2">
                        <Label>Voice</Label>
                        <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                          <SelectTrigger data-testid="select-voice">
                            <SelectValue placeholder="Select a voice" />
                          </SelectTrigger>
                          <SelectContent>
                            {barkVoices.map(v => (
                              <SelectItem key={v.id} value={v.id}>
                                {v.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Text Temp: {textTemp.toFixed(2)}</Label>
                          <Slider
                            value={[textTemp]}
                            onValueChange={([v]) => setTextTemp(v)}
                            min={0.1}
                            max={1}
                            step={0.05}
                            data-testid="slider-text-temp"
                          />
                          <p className="text-xs text-muted-foreground">Higher = more expressive singing</p>
                        </div>
                        <div className="space-y-2">
                          <Label>Waveform Temp: {waveformTemp.toFixed(2)}</Label>
                          <Slider
                            value={[waveformTemp]}
                            onValueChange={([v]) => setWaveformTemp(v)}
                            min={0.1}
                            max={1}
                            step={0.05}
                            data-testid="slider-waveform-temp"
                          />
                          <p className="text-xs text-muted-foreground">Higher = more variation in voice</p>
                        </div>
                      </div>

                      <Button
                        onClick={handleGenerateVocals}
                        disabled={isGeneratingVocals || !vocalsText.trim()}
                        className="w-full"
                        data-testid="button-generate-vocals"
                      >
                        {isGeneratingVocals ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Generating Singing Vocals...
                          </>
                        ) : (
                          <>
                            <Mic className="w-4 h-4 mr-2" />
                            Generate Singing Vocals
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Vocals Preview Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Headphones className="w-5 h-5 text-primary" />
                    Preview
                  </CardTitle>
                  <CardDescription>Listen to your generated vocals</CardDescription>
                </CardHeader>
                <CardContent>
                  {vocalsUrl ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-4 bg-secondary/20 rounded-lg">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={toggleVocalsPlayback}
                          data-testid="button-play-vocals"
                        >
                          {isPlayingVocals ? (
                            <Pause className="w-5 h-5" />
                          ) : (
                            <Play className="w-5 h-5" />
                          )}
                        </Button>
                        <div className="flex-1">
                          <p className="font-medium">Generated Vocals</p>
                          <p className="text-sm text-muted-foreground">AI-generated singing</p>
                        </div>
                        <Button
                          size="icon"
                          variant="outline"
                          asChild
                          data-testid="button-download-vocals"
                        >
                          <a href={vocalsUrl} download="vocals.mp3">
                            <Download className="w-4 h-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground" data-testid="text-no-vocals">
                      <Mic className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No vocals generated yet</p>
                      <p className="text-sm mt-2">Enter lyrics and generate to hear AI singing</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="mix" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Mix & Preview
                </CardTitle>
                <CardDescription data-testid="text-mix-description">
                  Combine your instrumental and vocals into a complete song
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!(fullTrackUrl || sampleUrl) || !vocalsUrl ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Generate both instrumental and vocals first</p>
                    <p className="text-sm mt-2">Use the Audio and Vocals tabs to create your tracks</p>
                    <div className="flex gap-4 justify-center mt-4">
                      <Badge variant={(fullTrackUrl || sampleUrl) ? "default" : "secondary"}>
                        {(fullTrackUrl || sampleUrl) ? "Instrumental Ready" : "Need Instrumental"}
                      </Badge>
                      <Badge variant={vocalsUrl ? "default" : "secondary"}>
                        {vocalsUrl ? "Vocals Ready" : "Need Vocals"}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="p-4 bg-secondary/20 rounded-lg">
                          <div className="flex items-center gap-3 mb-3">
                            <Headphones className="w-5 h-5 text-primary" />
                            <span className="font-medium">Instrumental</span>
                            <Badge variant="outline" className="ml-auto">Ready</Badge>
                          </div>
                          <div className="space-y-2">
                            <Label>Volume: {Math.round(instrumentalVolume * 100)}%</Label>
                            <Slider
                              value={[instrumentalVolume]}
                              onValueChange={([v]) => {
                                setInstrumentalVolume(v);
                                if (mixInstrumentalRef.current) {
                                  mixInstrumentalRef.current.volume = v;
                                }
                              }}
                              min={0}
                              max={1}
                              step={0.05}
                              data-testid="slider-instrumental-volume"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="p-4 bg-secondary/20 rounded-lg">
                          <div className="flex items-center gap-3 mb-3">
                            <Mic className="w-5 h-5 text-primary" />
                            <span className="font-medium">Singing Vocals</span>
                            <Badge variant="outline" className="ml-auto">Ready</Badge>
                          </div>
                          <div className="space-y-2">
                            <Label>Volume: {Math.round(vocalsVolume * 100)}%</Label>
                            <Slider
                              value={[vocalsVolume]}
                              onValueChange={([v]) => {
                                setVocalsVolume(v);
                                if (mixVocalsRef.current) {
                                  mixVocalsRef.current.volume = v;
                                }
                              }}
                              min={0}
                              max={1}
                              step={0.05}
                              data-testid="slider-vocals-volume"
                            />
                          </div>
                          <div className="space-y-2 mt-4">
                            <Label>Delay: {vocalsDelay.toFixed(1)}s</Label>
                            <Slider
                              value={[vocalsDelay]}
                              onValueChange={([v]) => setVocalsDelay(v)}
                              min={0}
                              max={5}
                              step={0.1}
                              data-testid="slider-vocals-delay"
                            />
                            <p className="text-xs text-muted-foreground">Adjust when vocals start relative to instrumental</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 justify-center">
                      <Button
                        onClick={isMixPlaying ? stopMixPlayback : playMix}
                        size="lg"
                        data-testid="button-play-mix"
                      >
                        {isMixPlaying ? (
                          <>
                            <Pause className="w-5 h-5 mr-2" />
                            Stop Mix
                          </>
                        ) : (
                          <>
                            <Play className="w-5 h-5 mr-2" />
                            Play Mix
                          </>
                        )}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="lg"
                        asChild
                        data-testid="button-download-instrumental"
                      >
                        <a href={fullTrackUrl || sampleUrl || ""} download="instrumental.mp3">
                          <Download className="w-4 h-4 mr-2" />
                          Instrumental
                        </a>
                      </Button>

                      <Button
                        variant="outline"
                        size="lg"
                        asChild
                        data-testid="button-download-vocals-mix"
                      >
                        <a href={vocalsUrl} download="vocals.wav">
                          <Download className="w-4 h-4 mr-2" />
                          Vocals
                        </a>
                      </Button>
                    </div>

                    <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                      <p className="font-medium mb-2">Tip: Creating a final mixed track</p>
                      <p>Download both tracks and use a free audio editor like Audacity to combine them with precise timing control. This gives you full control over the final mix.</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="theory" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Guitar className="w-5 h-5 text-primary" />
                    Chord Progression
                  </CardTitle>
                  <CardDescription data-testid="text-chord-description">AI-generated chord progressions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Key</Label>
                      <Select value={chordKey} onValueChange={setChordKey}>
                        <SelectTrigger data-testid="select-chord-key">
                          <SelectValue placeholder="Select key" />
                        </SelectTrigger>
                        <SelectContent>
                          {MUSICAL_KEYS.map(k => (
                            <SelectItem key={k} value={k}>{k}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Mood</Label>
                      <Select value={chordMood} onValueChange={setChordMood}>
                        <SelectTrigger data-testid="select-chord-mood">
                          <SelectValue placeholder="Select mood" />
                        </SelectTrigger>
                        <SelectContent>
                          {MOODS.map(m => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleGenerateChords}
                      disabled={isGeneratingChords}
                      className="flex-1"
                      data-testid="button-generate-chords"
                    >
                      {isGeneratingChords ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4 mr-2" />
                      )}
                      Generate
                    </Button>
                    {chordProgression.length > 0 && (
                      <Button
                        variant="outline"
                        onClick={handleReharmonize}
                        disabled={isGeneratingChords}
                        data-testid="button-reharmonize"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Reharmonize
                      </Button>
                    )}
                  </div>

                  <AnimatePresence>
                    {chordProgression.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="grid grid-cols-4 gap-2"
                      >
                        {chordProgression.map((chord, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-center"
                            data-testid={`chord-${i}`}
                          >
                            <p className="font-bold text-lg" data-testid={`chord-root-${i}`}>{chord.root}</p>
                            <p className="text-xs text-muted-foreground" data-testid={`chord-variety-${i}`}>{chord.variety}</p>
                            <Badge variant="secondary" className="mt-1 text-[10px]">{chord.numeral}</Badge>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Piano className="w-5 h-5 text-primary" />
                    Scale Finder
                  </CardTitle>
                  <CardDescription data-testid="text-scale-description">Click notes to identify matching scales</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-center py-2">
                    <div className="relative flex">
                      {PIANO_KEYS.map((key, i) => (
                        <button
                          key={i}
                          onClick={() => handlePianoKeyClick(key.note)}
                          className={cn(
                            "transition-all",
                            key.black
                              ? cn(
                                  "absolute w-6 h-16 -ml-3 z-10 rounded-b-md",
                                  selectedNotes.includes(key.note) 
                                    ? "bg-primary" 
                                    : "bg-gray-800 hover:bg-gray-700"
                                )
                              : cn(
                                  "w-10 h-24 border border-border rounded-b-md",
                                  selectedNotes.includes(key.note) 
                                    ? "bg-primary text-white" 
                                    : "bg-white dark:bg-gray-100 text-gray-800 hover:bg-gray-100 dark:hover:bg-gray-200"
                                )
                          )}
                          style={key.black ? { left: `${(i - Math.floor((i + 1) / 7) * 5) * 40 - 12}px` } : {}}
                          data-testid={`piano-key-${key.note.replace('#', 'sharp')}`}
                        >
                          {!key.black && (
                            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-medium">
                              {key.note}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {selectedNotes.map(note => (
                        <Badge key={note} variant="secondary" data-testid={`selected-note-${note.replace('#', 'sharp')}`}>{note}</Badge>
                      ))}
                      {selectedNotes.length === 0 && (
                        <span className="text-xs text-muted-foreground" data-testid="text-no-notes">No notes selected</span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={handleLookupScales}
                      disabled={isLookingUpScales || selectedNotes.length < 2}
                      data-testid="button-lookup-scales"
                    >
                      {isLookingUpScales ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Find Scales"
                      )}
                    </Button>
                  </div>

                  <AnimatePresence>
                    {scaleResults.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2"
                      >
                        {scaleResults.map((result, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="p-3 rounded-lg bg-muted/50 border border-border"
                            data-testid={`scale-result-${i}`}
                          >
                            <p className="font-medium" data-testid={`scale-name-${i}`}>{result.scale}</p>
                            <p className="text-xs text-muted-foreground" data-testid={`scale-reasoning-${i}`}>{result.reasoning}</p>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
