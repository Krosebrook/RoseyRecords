import { useState, useEffect, useRef } from "react";
import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Music, Headphones, Piano, Guitar, Loader2, Play, Pause, Volume2, VolumeX, Lightbulb, RefreshCw, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { GENRES, MOODS } from "@shared/schema";

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

export default function Studio() {
  const { toast } = useToast();
  
  const [audioPrompt, setAudioPrompt] = useState("");
  const [audioDuration, setAudioDuration] = useState([10]);
  const [selectedGenre, setSelectedGenre] = useState("Electronic");
  const [selectedMood, setSelectedMood] = useState("Energetic");
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const [chordKey, setChordKey] = useState("C");
  const [chordMood, setChordMood] = useState("Happy");
  const [chordProgression, setChordProgression] = useState<ChordData[]>([]);
  const [isGeneratingChords, setIsGeneratingChords] = useState(false);
  
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [scaleResults, setScaleResults] = useState<{ scale: string; reasoning: string }[]>([]);
  const [isLookingUpScales, setIsLookingUpScales] = useState(false);
  
  const [productionTip, setProductionTip] = useState<string | null>(null);
  const [isGettingTip, setIsGettingTip] = useState(false);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
    
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.onended = () => setIsPlaying(false);
      audio.muted = isMuted;
      audioRef.current = audio;
    }
  }, [audioUrl]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleGenerateAudio = async () => {
    if (!audioPrompt) {
      toast({ variant: "destructive", title: "Error", description: "Please enter an audio prompt" });
      return;
    }
    
    setIsGeneratingAudio(true);
    setAudioUrl(null);
    
    try {
      const response = await apiRequest("POST", "/api/audio/generate", {
        prompt: audioPrompt,
        duration: audioDuration[0],
        genre: selectedGenre,
        mood: selectedMood,
        instrumental: true
      });
      
      const data = await response.json();
      
      if (data.audioUrl) {
        setAudioUrl(data.audioUrl);
        toast({ title: "Audio Generated", description: "Your music is ready to play!" });
      }
    } catch (err) {
      console.error("Audio generation error:", err);
      toast({ variant: "destructive", title: "Generation Failed", description: "Could not generate audio" });
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current || !audioUrl) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleToggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
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

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Music className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-studio-title">Music Studio</h1>
            <p className="text-sm text-muted-foreground" data-testid="text-studio-subtitle">AI-powered music creation tools</p>
          </div>
        </div>

        <Tabs defaultValue="audio" className="space-y-4">
          <TabsList className="grid w-full max-w-[400px] grid-cols-2">
            <TabsTrigger value="audio" className="flex items-center gap-2" data-testid="tab-audio">
              <Headphones className="w-4 h-4" />
              Audio Generation
            </TabsTrigger>
            <TabsTrigger value="theory" className="flex items-center gap-2" data-testid="tab-theory">
              <Piano className="w-4 h-4" />
              Music Theory
            </TabsTrigger>
          </TabsList>

          <TabsContent value="audio" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Headphones className="w-5 h-5 text-primary" />
                    Generate Music
                  </CardTitle>
                  <CardDescription data-testid="text-audio-description">Create AI-generated instrumental tracks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="audio-prompt">Describe your music</Label>
                    <Input
                      id="audio-prompt"
                      value={audioPrompt}
                      onChange={(e) => setAudioPrompt(e.target.value)}
                      placeholder="e.g. Upbeat electronic track with synth arpeggios"
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

                  <div className="space-y-2">
                    <Label data-testid="text-duration-label">Duration: {audioDuration[0]}s</Label>
                    <Slider
                      value={audioDuration}
                      onValueChange={setAudioDuration}
                      min={5}
                      max={30}
                      step={5}
                      className="w-full"
                      data-testid="slider-duration"
                    />
                  </div>

                  <Button
                    onClick={handleGenerateAudio}
                    disabled={isGeneratingAudio || !audioPrompt}
                    className="w-full"
                    data-testid="button-generate-audio"
                  >
                    {isGeneratingAudio ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Music
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Volume2 className="w-5 h-5 text-primary" />
                    Audio Player
                  </CardTitle>
                  <CardDescription data-testid="text-player-description">Listen to your generated music</CardDescription>
                </CardHeader>
                <CardContent>
                  <AnimatePresence mode="wait">
                    {audioUrl ? (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="space-y-4"
                      >
                        <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center relative overflow-hidden">
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent animate-pulse" />
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
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground text-center" data-testid="text-audio-info">
                          {selectedGenre} • {selectedMood} • {audioDuration[0]}s
                        </p>
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
