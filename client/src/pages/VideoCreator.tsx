import { useState } from "react";
import Layout from "@/components/Layout";
import { usePageTitle } from "@/hooks/use-page-title";
import { motion } from "framer-motion";
import { Video, Play, Pause, Check, Zap, BarChart3, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface VisualStyle {
  id: string;
  name: string;
  gradient: string;
}

const VISUAL_STYLES: VisualStyle[] = [
  { id: "cyberpunk", name: "Cyberpunk", gradient: "from-purple-600 via-pink-500 to-cyan-400" },
  { id: "dreamscape", name: "Dreamscape", gradient: "from-blue-400 via-purple-300 to-pink-200" },
  { id: "retro-wave", name: "Retro-Wave", gradient: "from-orange-500 via-pink-500 to-purple-600" },
  { id: "abstract", name: "Abstract Flow", gradient: "from-emerald-400 via-blue-500 to-purple-600" },
];

export default function VideoCreator() {
  usePageTitle("Video Creator");
  const { toast } = useToast();
  const [selectedStyle, setSelectedStyle] = useState("cyberpunk");
  const [beatSync, setBeatSync] = useState(82);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress] = useState(33);

  const handleGenerate = () => {
    toast({
      title: "Generating Video",
      description: `Creating ${VISUAL_STYLES.find(s => s.id === selectedStyle)?.name} style video with ${beatSync}% beat sync...`,
    });
  };

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-video-title">
            <Video className="w-6 h-6 text-primary" />
            Video Creator
          </h1>
          <Button variant="ghost" size="icon" data-testid="button-more-options">
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </div>

        <div className="glass-panel rounded-2xl overflow-hidden" data-testid="container-video-preview">
          <div className="relative aspect-video w-full bg-gradient-to-br from-purple-900/80 via-background to-primary/20">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/40 hover:scale-105 transition-transform"
                data-testid="button-play-preview"
              >
                {isPlaying ? (
                  <Pause className="w-8 h-8 text-white fill-current" />
                ) : (
                  <Play className="w-8 h-8 text-white fill-current ml-1" />
                )}
              </button>
            </div>

            <div className="absolute inset-x-0 bottom-0 p-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-1.5 flex-1 rounded-full bg-white/20 overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full relative"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute -right-1 -top-1 w-3.5 h-3.5 rounded-full bg-white border-2 border-primary" />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-white/80 text-xs font-medium">0:42</p>
                <p className="text-white/80 text-xs font-medium">2:15</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-end mb-4">
            <div>
              <h3 className="text-lg font-bold" data-testid="text-styles-heading">Visual Styles</h3>
              <p className="text-sm text-muted-foreground">Select AI aesthetic direction</p>
            </div>
            <button className="text-primary text-sm font-semibold" data-testid="button-view-all-styles">View All</button>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2">
            {VISUAL_STYLES.map((style) => (
              <button
                key={style.id}
                onClick={() => setSelectedStyle(style.id)}
                className="flex flex-col gap-3 min-w-[140px] snap-start group"
                data-testid={`style-${style.id}`}
              >
                <div
                  className={cn(
                    "relative w-full aspect-[3/4] rounded-xl bg-gradient-to-br transition-all",
                    style.gradient,
                    selectedStyle === style.id
                      ? "border-2 border-primary shadow-lg shadow-primary/20 scale-[1.02]"
                      : "opacity-70 grayscale-[20%] hover:opacity-90"
                  )}
                >
                  {selectedStyle === style.id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center"
                    >
                      <Check className="w-3 h-3 text-white" />
                    </motion.div>
                  )}
                </div>
                <p className={cn(
                  "text-sm font-medium text-center",
                  selectedStyle === style.id ? "text-primary font-bold" : "text-muted-foreground"
                )}>
                  {style.name}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <p className="text-base font-semibold" data-testid="text-beat-sync-label">Sync to Beat Intensity</p>
            </div>
            <span className="text-sm font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg" data-testid="text-beat-sync-value">
              {beatSync}%
            </span>
          </div>

          <div className="relative h-6 flex items-center">
            <div className="absolute h-2 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary/50 to-primary rounded-full"
                style={{ width: `${beatSync}%` }}
              />
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={beatSync}
              onChange={(e) => setBeatSync(Number(e.target.value))}
              className="absolute w-full h-6 opacity-0 cursor-pointer"
              data-testid="slider-beat-sync"
            />
            <div
              className="absolute w-6 h-6 rounded-full bg-primary shadow-[0_0_15px_rgba(127,19,236,0.5)] border-4 border-background pointer-events-none"
              style={{ left: `calc(${beatSync}% - 12px)` }}
            />
          </div>

          <div className="mt-4 flex justify-between text-[10px] text-muted-foreground/40 uppercase tracking-widest font-bold">
            <span>Chill</span>
            <span>Explosive</span>
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          size="lg"
          className="w-full h-16 rounded-full text-lg font-bold tracking-wide gap-3 neon-shadow"
          data-testid="button-generate-video"
        >
          <Zap className="w-5 h-5" />
          GENERATE VIDEO
        </Button>
      </div>
    </Layout>
  );
}
