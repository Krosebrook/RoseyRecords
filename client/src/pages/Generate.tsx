import { useState } from "react";
import Layout from "@/components/Layout";
import { useChatGeneration } from "@/hooks/use-chat-generation";
import { useCreateSong } from "@/hooks/use-songs";
import { Wand2, Save, Mic, Disc, PlayCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const GENRES = ["Pop", "Hip Hop", "Rock", "R&B", "Country", "EDM", "Jazz", "Metal", "Lo-Fi"];
const MOODS = ["Happy", "Sad", "Energetic", "Chill", "Romantic", "Angry", "Melancholic", "Uplifting"];

export default function Generate() {
  const { generateLyrics, isGenerating, currentLyrics } = useChatGeneration();
  const { mutate: saveSong, isPending: isSaving } = useCreateSong();
  
  const [topic, setTopic] = useState("");
  const [genre, setGenre] = useState(GENRES[0]);
  const [mood, setMood] = useState(MOODS[0]);
  const [generatedContent, setGeneratedContent] = useState("");

  const handleGenerate = async () => {
    if (!topic) return;
    const result = await generateLyrics(topic, genre, mood);
    if (result) {
      setGeneratedContent(result);
    }
  };

  const handleSave = () => {
    if (!generatedContent || !topic) return;
    saveSong({
      title: topic,
      lyrics: generatedContent,
      genre,
      mood,
      isPublic: false
    });
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6">
        {/* Controls Panel */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          <div className="glass-panel p-6 rounded-2xl flex-1 flex flex-col gap-6 overflow-y-auto">
            <div>
              <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
                <Wand2 className="w-6 h-6 text-primary" />
                Generator
              </h2>
              <p className="text-sm text-muted-foreground">Configure your song parameters</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Topic / Theme</label>
                <input 
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. A neon city in rain..."
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-muted-foreground/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Genre</label>
                <div className="grid grid-cols-3 gap-2">
                  {GENRES.map(g => (
                    <button
                      key={g}
                      onClick={() => setGenre(g)}
                      className={`px-2 py-2 rounded-lg text-xs font-medium border transition-all ${
                        genre === g 
                          ? "bg-primary text-white border-primary" 
                          : "bg-background border-border hover:border-primary/50 text-muted-foreground"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Mood</label>
                <select 
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary outline-none"
                >
                  {MOODS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !topic}
              className={`mt-auto w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all ${
                isGenerating || !topic
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-gradient-to-r from-primary to-secondary text-white hover:scale-[1.02] neon-shadow"
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Writing...
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
        <div className="w-full lg:w-2/3 flex flex-col gap-6 h-full min-h-[500px]">
          <div className="glass-panel p-8 rounded-2xl flex-1 relative overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center border border-border">
                  <Disc className={`w-5 h-5 ${isGenerating ? 'animate-spin text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <h3 className="font-bold">{topic || "New Song"}</h3>
                  <p className="text-xs text-muted-foreground">{genre} • {mood}</p>
                </div>
              </div>

              {generatedContent && (
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-lg bg-background border border-border hover:border-primary hover:text-primary transition-all flex items-center gap-2 text-sm font-medium"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save to Library
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar relative">
              {(currentLyrics || generatedContent) ? (
                <pre className="whitespace-pre-wrap font-mono text-sm md:text-base leading-relaxed text-foreground/90">
                  {currentLyrics || generatedContent}
                </pre>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/30 select-none pointer-events-none">
                  <Mic className="w-24 h-24 mb-4 opacity-20" />
                  <p className="text-xl font-medium">Ready to compose</p>
                  <p className="text-sm">Configure parameters and hit generate</p>
                </div>
              )}
            </div>
            
            {/* Audio generation placeholder (Advanced feature) */}
            {generatedContent && (
              <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                     <PlayCircle className="w-5 h-5 text-primary" />
                   </div>
                   <div className="h-1 flex-1 w-32 bg-muted rounded-full overflow-hidden">
                     <div className="h-full w-0 bg-primary rounded-full" />
                   </div>
                </div>
                <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">Audio Preview (Coming Soon)</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
