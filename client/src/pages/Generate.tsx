import { useState } from "react";
import Layout from "@/components/Layout";
import { useChatGeneration } from "@/hooks/use-chat-generation";
import { useCreateSong } from "@/hooks/use-songs";
import { Wand2, Save, Mic, Disc, Loader2, Shuffle, Globe, Lock, ChevronDown, Check } from "lucide-react";
import { motion } from "framer-motion";
import { GENRES, MOODS } from "@shared/schema";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function Generate() {
  const { generateLyrics, getRandomPrompt, isGenerating, currentLyrics, setCurrentLyrics } = useChatGeneration();
  const { mutate: saveSong, isPending: isSaving } = useCreateSong();
  const { toast } = useToast();
  
  const [topic, setTopic] = useState("");
  const [generatedTitle, setGeneratedTitle] = useState("");
  const [genre, setGenre] = useState<string>("Pop");
  const [mood, setMood] = useState<string>("Happy");
  const [generatedContent, setGeneratedContent] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);
  const [showMoodDropdown, setShowMoodDropdown] = useState(false);

  const handleGenerate = async () => {
    if (!topic) return;
    const result = await generateLyrics(topic, genre, mood);
    if (result) {
      setGeneratedContent(result.lyrics);
      setGeneratedTitle(result.title);
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

  return (
    <Layout>
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
        {/* Controls Panel */}
        <div className="w-full lg:w-[380px] flex flex-col gap-4">
          <div className="glass-panel p-6 rounded-2xl flex-1 flex flex-col gap-5 overflow-y-auto custom-scrollbar">
            <div>
              <h2 className="text-2xl font-bold mb-1 flex items-center gap-2" data-testid="text-generator-title">
                <Wand2 className="w-6 h-6 text-primary" />
                Lyric Generator
              </h2>
              <p className="text-sm text-muted-foreground">Describe your song idea</p>
            </div>

            <div className="space-y-4">
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
                
                {showGenreDropdown && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
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
                
                {showMoodDropdown && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
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

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !topic}
              className={cn(
                "mt-auto w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all",
                isGenerating || !topic
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-gradient-to-r from-primary to-secondary text-white hover:scale-[1.02] neon-shadow"
              )}
              data-testid="button-generate"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  Generate Lyrics
                </>
              )}
            </button>
          </div>
        </div>

        {/* Output Panel */}
        <div className="w-full lg:flex-1 flex flex-col gap-4 h-full min-h-[500px]">
          <div className="glass-panel p-6 md:p-8 rounded-2xl flex-1 relative overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center border border-border">
                  <Disc className={cn("w-5 h-5", isGenerating ? "animate-spin text-primary" : "text-muted-foreground")} />
                </div>
                <div>
                  <h3 className="font-bold" data-testid="text-song-title">
                    {generatedTitle || topic || "New Song"}
                  </h3>
                  <p className="text-xs text-muted-foreground">{genre} • {mood}</p>
                </div>
              </div>

              {generatedContent && (
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-all flex items-center gap-2 text-sm font-medium"
                  data-testid="button-save"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save to Library
                </button>
              )}
            </div>

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
