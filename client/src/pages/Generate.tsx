import { useState } from "react";
import Layout from "@/components/Layout";
import { useChatGeneration } from "@/hooks/use-chat-generation";
import { useCreateSong } from "@/hooks/use-songs";
import { Wand2, Save, Mic, Disc, Loader2, Shuffle, Globe, Lock, ChevronDown, Check, Sparkles, Zap, Music, Lightbulb, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GENRES, MOODS } from "@shared/schema";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { usePageTitle } from "@/hooks/use-page-title";
import { Onboarding, GENERATE_ONBOARDING_STEPS } from "@/components/Onboarding";

type AIEngine = "openai" | "gemini";

export default function Generate() {
  usePageTitle("Create Lyrics");
  const { generateLyrics, getRandomPrompt, isGenerating, currentLyrics, setCurrentLyrics } = useChatGeneration();
  const { mutate: saveSong, isPending: isSaving } = useCreateSong();
  const { toast } = useToast();
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  const [topic, setTopic] = useState("");
  const [generatedTitle, setGeneratedTitle] = useState("");
  const [genre, setGenre] = useState<string>("Pop");
  const [mood, setMood] = useState<string>("Happy");
  const [generatedContent, setGeneratedContent] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);
  const [showMoodDropdown, setShowMoodDropdown] = useState(false);
  
  const [aiEngine, setAiEngine] = useState<AIEngine>("openai");
  const [isGeneratingLocal, setIsGeneratingLocal] = useState(false);
  const [productionTip, setProductionTip] = useState<string | null>(null);
  const [songMetadata, setSongMetadata] = useState<{
    bpm?: number;
    key?: string;
    energy?: string;
  } | null>(null);

  const handleGenerate = async () => {
    if (!topic) return;
    setIsGeneratingLocal(true);
    setProductionTip(null);
    setSongMetadata(null);
    
    try {
      if (aiEngine === "openai") {
        const result = await generateLyrics(topic, genre, mood);
        if (result) {
          setGeneratedContent(result.lyrics);
          setGeneratedTitle(result.title);
        }
      } else {
        const response = await apiRequest("POST", "/api/generate/song-concept", {
          prompt: topic,
          genre,
          mood
        });
        const data = await response.json();
        setGeneratedContent(data.lyrics);
        setGeneratedTitle(data.title);
        setSongMetadata({
          bpm: data.bpm,
          key: data.key,
          energy: data.energy
        });
        
        try {
          const tipResponse = await apiRequest("POST", "/api/generate/production-tips", {
            genre: data.genre || genre,
            mood: data.mood || mood,
            energy: data.energy || "medium"
          });
          const tipData = await tipResponse.json();
          setProductionTip(tipData.tip);
        } catch (e) {
          console.error("Failed to get production tip:", e);
        }
      }
    } catch (error) {
      console.error("Generation error:", error);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: "Please try again."
      });
    } finally {
      setIsGeneratingLocal(false);
    }
  };

  const handleRandomPrompt = async () => {
    const prompt = await getRandomPrompt();
    if (prompt) {
      setTopic(prompt);
    }
  };

  const handleSave = () => {
    if (!generatedContent) return;
    saveSong({
      title: generatedTitle || topic,
      lyrics: generatedContent,
      description: topic,
      genre,
      mood,
      isPublic
    }, {
      onSuccess: () => {
        toast({
          title: "Saved!",
          description: `"${generatedTitle || topic}" has been added to your library.`,
        });
      }
    });
  };

  const loading = isGenerating || isGeneratingLocal;

  const handleShowTour = () => {
    setShowOnboarding(true);
  };

  return (
    <Layout>
      <Onboarding
        steps={GENERATE_ONBOARDING_STEPS}
        storageKey="harmoniq-generate-onboarding"
        isOpen={showOnboarding}
        onComplete={() => setShowOnboarding(false)}
        onSkip={() => setShowOnboarding(false)}
      />
      
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
        {/* Controls Panel */}
        <div className="w-full lg:w-[380px] flex flex-col gap-4">
          <div className="glass-panel p-6 rounded-2xl flex-1 flex flex-col gap-5 overflow-y-auto custom-scrollbar">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1 flex items-center gap-2" data-testid="text-generator-title">
                  <Wand2 className="w-6 h-6 text-primary" />
                  Lyric Generator
                </h2>
                <p className="text-sm text-muted-foreground">Describe your song idea</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleShowTour}
                className="text-muted-foreground hover:text-foreground h-8 w-8"
                data-testid="button-generate-tour"
              >
                <HelpCircle className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {/* AI Engine Toggle */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  AI Engine
                </label>
                <div className="flex gap-2 p-1 bg-muted/50 rounded-xl">
                  <button
                    onClick={() => setAiEngine("openai")}
                    className={cn(
                      "flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2",
                      aiEngine === "openai"
                        ? "bg-primary text-white shadow-md"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    data-testid="button-engine-openai"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    OpenAI
                  </button>
                  <button
                    onClick={() => setAiEngine("gemini")}
                    className={cn(
                      "flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2",
                      aiEngine === "gemini"
                        ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    data-testid="button-engine-gemini"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Gemini
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {aiEngine === "gemini" 
                    ? "Full song concept with BPM, key, and production tips" 
                    : "Fast lyrics generation with GPT-4o"}
                </p>
              </div>

              {/* Topic Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Topic / Theme</label>
                  <button 
                    onClick={handleRandomPrompt}
                    className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                    data-testid="button-random-prompt"
                  >
                    <Shuffle className="w-3 h-3" />
                    Random idea
                  </button>
                </div>
                <textarea 
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. A love song about meeting someone at a coffee shop on a rainy day..."
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-muted-foreground/50 resize-none h-24"
                  data-testid="input-topic"
                />
              </div>

              {/* Genre Selection */}
              <div className="space-y-2 relative">
                <label className="text-sm font-medium">Genre</label>
                <button
                  onClick={() => { setShowGenreDropdown(!showGenreDropdown); setShowMoodDropdown(false); }}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border hover:border-primary/50 transition-all flex items-center justify-between text-left"
                  data-testid="button-genre-select"
                >
                  <span className={genre ? "text-foreground" : "text-muted-foreground"}>
                    {genre || "Select genre"}
                  </span>
                  <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", showGenreDropdown && "rotate-180")} />
                </button>
                
                <AnimatePresence>
                  {showGenreDropdown && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute z-50 w-full mt-1 p-2 rounded-xl bg-card border border-border shadow-xl max-h-64 overflow-y-auto custom-scrollbar"
                    >
                      <div className="grid grid-cols-2 gap-1">
                        {GENRES.map(g => (
                          <button
                            key={g}
                            onClick={() => { setGenre(g); setShowGenreDropdown(false); }}
                            className={cn(
                              "px-3 py-2 rounded-lg text-xs font-medium transition-all text-left flex items-center gap-2",
                              genre === g 
                                ? "bg-primary text-white" 
                                : "hover:bg-muted text-muted-foreground hover:text-foreground"
                            )}
                            data-testid={`option-genre-${g.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            {genre === g && <Check className="w-3 h-3" />}
                            {g}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mood Selection */}
              <div className="space-y-2 relative">
                <label className="text-sm font-medium">Mood</label>
                <button
                  onClick={() => { setShowMoodDropdown(!showMoodDropdown); setShowGenreDropdown(false); }}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border hover:border-primary/50 transition-all flex items-center justify-between text-left"
                  data-testid="button-mood-select"
                >
                  <span className={mood ? "text-foreground" : "text-muted-foreground"}>
                    {mood || "Select mood"}
                  </span>
                  <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", showMoodDropdown && "rotate-180")} />
                </button>
                
                <AnimatePresence>
                  {showMoodDropdown && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute z-50 w-full mt-1 p-2 rounded-xl bg-card border border-border shadow-xl max-h-64 overflow-y-auto custom-scrollbar"
                    >
                      <div className="grid grid-cols-2 gap-1">
                        {MOODS.map(m => (
                          <button
                            key={m}
                            onClick={() => { setMood(m); setShowMoodDropdown(false); }}
                            className={cn(
                              "px-3 py-2 rounded-lg text-xs font-medium transition-all text-left flex items-center gap-2",
                              mood === m 
                                ? "bg-primary text-white" 
                                : "hover:bg-muted text-muted-foreground hover:text-foreground"
                            )}
                            data-testid={`option-mood-${m.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            {mood === m && <Check className="w-3 h-3" />}
                            {m}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Visibility Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border">
                <div className="flex items-center gap-2">
                  {isPublic ? <Globe className="w-4 h-4 text-primary" /> : <Lock className="w-4 h-4 text-muted-foreground" />}
                  <span className="text-sm font-medium">{isPublic ? "Public" : "Private"}</span>
                </div>
                <button
                  onClick={() => setIsPublic(!isPublic)}
                  className={cn(
                    "w-12 h-6 rounded-full transition-all relative",
                    isPublic ? "bg-primary" : "bg-muted"
                  )}
                  data-testid="toggle-visibility"
                >
                  <span className={cn(
                    "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                    isPublic ? "right-1" : "left-1"
                  )} />
                </button>
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={loading || !topic}
              size="lg"
              className="mt-auto w-full font-bold"
              data-testid="button-generate"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  {aiEngine === "gemini" ? "Creating Song Concept..." : "Generating..."}
                </>
              ) : (
                <>
                  {aiEngine === "gemini" ? <Sparkles className="w-5 h-5 mr-2" /> : <Wand2 className="w-5 h-5 mr-2" />}
                  Generate {aiEngine === "gemini" ? "Song Concept" : "Lyrics"}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Output Panel */}
        <div className="w-full lg:flex-1 flex flex-col gap-4 h-full min-h-[500px]">
          <div className="glass-panel p-6 md:p-8 rounded-2xl flex-1 relative overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center border border-border">
                  <Disc className={cn("w-5 h-5", loading ? "animate-spin text-primary" : "text-muted-foreground")} />
                </div>
                <div>
                  <h3 className="font-bold" data-testid="text-song-title">
                    {generatedTitle || topic || "New Song"}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{genre}</span>
                    <span>•</span>
                    <span>{mood}</span>
                    {songMetadata?.bpm && (
                      <>
                        <span>•</span>
                        <span>{songMetadata.bpm} BPM</span>
                      </>
                    )}
                    {songMetadata?.key && (
                      <>
                        <span>•</span>
                        <span>{songMetadata.key}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {generatedContent && (
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  data-testid="button-save"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Save to Library
                </Button>
              )}
            </div>

            {/* Production Tip */}
            <AnimatePresence>
              {productionTip && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-4 p-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20"
                >
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Production Tip</p>
                      <p className="text-sm text-foreground/80">{productionTip}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar relative" data-testid="container-lyrics">
              {(currentLyrics || generatedContent) ? (
                <motion.pre 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="whitespace-pre-wrap font-mono text-sm md:text-base leading-relaxed text-foreground/90"
                >
                  {currentLyrics || generatedContent}
                </motion.pre>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/30 select-none pointer-events-none">
                  <Mic className="w-24 h-24 mb-4 opacity-20" />
                  <p className="text-xl font-medium">Ready to compose</p>
                  <p className="text-sm">Enter your idea and hit generate</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
