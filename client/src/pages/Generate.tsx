import { useState } from "react";
import Layout from "@/components/Layout";
import { useChatGeneration } from "@/hooks/use-chat-generation";
import { useCreateSong } from "@/hooks/use-songs";
import { Wand2, Save, Mic, Disc, Loader2, Shuffle, Globe, Lock, Sparkles, Zap, Lightbulb, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GENRES, MOODS } from "@shared/schema";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { usePageTitle } from "@/hooks/use-page-title";
import { Onboarding, GENERATE_ONBOARDING_STEPS } from "@/components/Onboarding";
import { AiSuggestButton } from "@/components/AiSuggestButton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
      
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-4 md:gap-6 min-h-[calc(100vh-8rem)] lg:h-[calc(100vh-8rem)]">
        {/* Controls Panel */}
        <div className="w-full lg:w-[380px] flex flex-col gap-4">
          <div className="glass-panel p-4 md:p-6 rounded-2xl lg:flex-1 flex flex-col gap-4 md:gap-5 lg:overflow-y-auto custom-scrollbar">
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
                aria-label="Show help tour"
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
                <div
                  className="flex gap-2 p-1 bg-muted/50 rounded-xl"
                  role="radiogroup"
                  aria-label="AI Engine Selection"
                >
                  <button
                    type="button"
                    role="radio"
                    aria-checked={aiEngine === "openai"}
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
                    type="button"
                    role="radio"
                    aria-checked={aiEngine === "gemini"}
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
                  <label className="text-sm font-medium" htmlFor="topic-input">Topic / Theme</label>
                  <button 
                    onClick={handleRandomPrompt}
                    className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                    data-testid="button-random-prompt"
                  >
                    <Shuffle className="w-3 h-3" />
                    Random idea
                  </button>
                </div>
                <div className="flex items-start gap-1">
                  <textarea 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. A love song about meeting someone at a coffee shop on a rainy day..."
                    className="flex-1 px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-muted-foreground/50 resize-none h-24"
                    data-testid="input-topic"
                  />
                  <AiSuggestButton
                    field="topic"
                    onSuggestion={setTopic}
                    disabled={isGeneratingLocal}
                  />
                </div>
              </div>

              {/* Genre Selection */}
              <div className="space-y-2 relative">
                <Label htmlFor="genre-select">Genre</Label>
                <Select value={genre} onValueChange={setGenre}>
                  <SelectTrigger
                    id="genre-select"
                    className="w-full h-12 px-4 rounded-xl bg-background border border-border hover:border-primary/50 transition-all text-left"
                    data-testid="button-genre-select"
                  >
                    <SelectValue placeholder="Select genre" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {GENRES.map(g => (
                      <SelectItem
                        key={g}
                        value={g}
                        data-testid={`option-genre-${g.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Mood Selection */}
              <div className="space-y-2 relative">
                <Label htmlFor="mood-select">Mood</Label>
                <Select value={mood} onValueChange={setMood}>
                  <SelectTrigger
                    id="mood-select"
                    className="w-full h-12 px-4 rounded-xl bg-background border border-border hover:border-primary/50 transition-all text-left"
                    data-testid="button-mood-select"
                  >
                    <SelectValue placeholder="Select mood" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {MOODS.map(m => (
                      <SelectItem
                        key={m}
                        value={m}
                        data-testid={`option-mood-${m.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Visibility Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border">
                <div className="flex items-center gap-2">
                  {isPublic ? <Globe className="w-4 h-4 text-primary" /> : <Lock className="w-4 h-4 text-muted-foreground" />}
                  <span className="text-sm font-medium">{isPublic ? "Public" : "Private"}</span>
                </div>
                <Switch
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                  aria-label="Toggle public visibility"
                  data-testid="toggle-visibility"
                />
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
        <div className="w-full lg:flex-1 flex flex-col gap-4 min-h-[400px] lg:min-h-0 lg:h-full">
          <div className="glass-panel p-4 md:p-8 rounded-2xl flex-1 relative overflow-hidden flex flex-col">
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
