import { useState, useCallback } from "react";
import Layout from "@/components/Layout";
import { usePageTitle } from "@/hooks/use-page-title";
import { SlidersHorizontal, Play, Pause, SkipBack, SkipForward, Volume2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface TrackChannel {
  id: string;
  name: string;
  volume: number;
  isSolo: boolean;
  isMuted: boolean;
  levelMeter: number;
  eqBars: number[];
}

const DEFAULT_TRACKS: TrackChannel[] = [
  { id: "vocals", name: "Vocals", volume: 70, isSolo: true, isMuted: false, levelMeter: 65, eqBars: [60, 80, 45, 70, 55] },
  { id: "drums", name: "Drums", volume: 85, isSolo: false, isMuted: false, levelMeter: 85, eqBars: [75, 50, 90, 60, 70] },
  { id: "bass", name: "Bass", volume: 50, isSolo: false, isMuted: true, levelMeter: 45, eqBars: [40, 55, 35, 50, 45] },
  { id: "synth", name: "Synth", volume: 60, isSolo: false, isMuted: false, levelMeter: 60, eqBars: [80, 65, 90, 50, 75] },
  { id: "keys", name: "Keys", volume: 45, isSolo: false, isMuted: false, levelMeter: 40, eqBars: [35, 70, 55, 80, 45] },
  { id: "fx", name: "FX", volume: 30, isSolo: false, isMuted: false, levelMeter: 25, eqBars: [20, 90, 30, 60, 85] },
];

type MasteringPreset = "balanced" | "warm" | "club";

function EqVisualizer({ bars, isMuted }: { bars: number[]; isMuted: boolean }) {
  return (
    <div className="w-full h-12 flex items-end justify-center gap-0.5 bg-black/20 rounded-lg p-1.5">
      {bars.map((height, i) => (
        <motion.div
          key={i}
          className={cn(
            "w-1 rounded-full",
            isMuted ? "bg-muted-foreground/20" : i % 2 === 0 ? "bg-primary" : "bg-secondary"
          )}
          animate={isMuted ? { height: "20%" } : { height: [`${20}%`, `${height}%`, `${20}%`] }}
          transition={{
            duration: 0.8 + i * 0.15,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.1,
          }}
        />
      ))}
    </div>
  );
}

function ChannelStrip({
  track,
  onToggleSolo,
  onToggleMute,
}: {
  track: TrackChannel;
  onToggleSolo: (id: string) => void;
  onToggleMute: (id: string) => void;
}) {
  return (
    <div
      className="flex-1 min-w-[90px] max-w-[120px] flex flex-col items-center glass-panel rounded-2xl p-3 gap-2"
      data-testid={`channel-${track.id}`}
    >
      <EqVisualizer bars={track.eqBars} isMuted={track.isMuted} />

      <div className="flex-1 relative flex flex-col items-center py-4 w-full min-h-[180px]">
        <div className="absolute right-1 top-0 bottom-0 w-1 bg-black/40 rounded-full overflow-hidden">
          <motion.div
            className={cn("absolute bottom-0 w-full rounded-full", track.isMuted ? "bg-muted-foreground/20" : "bg-secondary/60")}
            animate={{ height: track.isMuted ? "0%" : `${track.levelMeter}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <div className="h-full w-1.5 bg-muted rounded-full relative flex flex-col justify-end">
          <motion.div
            className={cn("w-full rounded-full", track.isMuted ? "bg-muted-foreground/30" : "bg-primary neon-shadow")}
            animate={{ height: `${track.volume}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
          <motion.div
            className="absolute left-1/2 -translate-x-1/2 w-8 h-4 bg-white rounded-sm shadow-lg border border-primary/50 cursor-grab active:cursor-grabbing"
            animate={{ bottom: `${track.volume - 2}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </div>
      </div>

      <div className="text-center mb-1">
        <span className="text-xs font-mono text-secondary">{(-60 + track.volume * 0.6).toFixed(1)} dB</span>
      </div>

      <div className="flex flex-col gap-1.5 w-full">
        <button
          onClick={() => onToggleSolo(track.id)}
          className={cn(
            "w-full py-1.5 rounded-md text-[10px] font-bold tracking-tight uppercase transition-all",
            track.isSolo
              ? "bg-primary/20 border border-primary text-primary"
              : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
          )}
          data-testid={`button-solo-${track.id}`}
        >
          Solo
        </button>
        <button
          onClick={() => onToggleMute(track.id)}
          className={cn(
            "w-full py-1.5 rounded-md text-[10px] font-bold tracking-tight uppercase transition-all",
            track.isMuted
              ? "bg-destructive/20 border border-destructive text-destructive"
              : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
          )}
          data-testid={`button-mute-${track.id}`}
        >
          Mute
        </button>
      </div>

      <p className="mt-2 text-[10px] font-bold uppercase text-muted-foreground tracking-wider truncate w-full text-center">
        {track.name}
      </p>
    </div>
  );
}

function AIMasteringSection({ onMaster }: { onMaster: (preset: MasteringPreset) => void }) {
  const [activePreset, setActivePreset] = useState<MasteringPreset>("balanced");
  const masteringProgress = 72;
  const circumference = 2 * Math.PI * 58;
  const offset = circumference - (masteringProgress / 100) * circumference;

  return (
    <section className="glass-panel rounded-2xl p-6 bg-gradient-to-b from-primary/10 to-transparent border border-primary/10" data-testid="container-ai-mastering">
      <div className="flex flex-col items-center">
        <div className="flex items-center justify-between w-full mb-4">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-yellow-400">AI Mastering Engine</span>
          <div className="flex gap-1">
            <div className="w-1 h-1 rounded-full bg-yellow-400" />
            <div className="w-1 h-1 rounded-full bg-yellow-400/30" />
            <div className="w-1 h-1 rounded-full bg-yellow-400/30" />
          </div>
        </div>

        <div className="relative group cursor-pointer">
          <svg className="w-32 h-32 -rotate-90">
            <circle
              className="text-white/5"
              cx="64" cy="64" r="58"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="4"
            />
            <circle
              className="text-yellow-400 drop-shadow-[0_0_8px_rgba(255,215,0,0.6)]"
              cx="64" cy="64" r="58"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <button
              onClick={() => onMaster(activePreset)}
              className="w-24 h-24 rounded-full bg-background border-2 border-yellow-400 flex flex-col items-center justify-center gap-1 transition-transform active:scale-95 shadow-[0_0_15px_rgba(255,215,0,0.3)] hover:shadow-[0_0_25px_rgba(255,215,0,0.5)]"
              data-testid="button-ai-master"
            >
              <Sparkles className="w-7 h-7 text-yellow-400" />
              <span className="text-[10px] font-black uppercase text-center leading-none">
                Master<br />with AI
              </span>
            </button>
          </div>
        </div>

        <div className="mt-6 w-full max-w-xs bg-white/5 rounded-full p-1 flex items-center justify-between border border-white/10">
          {(["balanced", "warm", "club"] as const).map((preset) => (
            <button
              key={preset}
              onClick={() => setActivePreset(preset)}
              className={cn(
                "flex-1 py-2 px-3 rounded-full text-[10px] font-bold uppercase transition-all",
                activePreset === preset
                  ? "bg-yellow-400 text-background"
                  : "text-muted-foreground hover:text-foreground"
              )}
              data-testid={`preset-${preset}`}
            >
              {preset === "club" ? "Club Ready" : preset.charAt(0).toUpperCase() + preset.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Mixer() {
  usePageTitle("Mixing & AI Mastering");
  const { toast } = useToast();
  const [tracks, setTracks] = useState<TrackChannel[]>(DEFAULT_TRACKS);
  const [isPlaying, setIsPlaying] = useState(true);
  const [masterVolume] = useState(82);
  const [currentTrack] = useState({ name: "Neon Horizons", artist: "Ready for Mastering" });

  const handleToggleSolo = useCallback((id: string) => {
    setTracks((prev) => prev.map((t) => (t.id === id ? { ...t, isSolo: !t.isSolo } : t)));
  }, []);

  const handleToggleMute = useCallback((id: string) => {
    setTracks((prev) => prev.map((t) => (t.id === id ? { ...t, isMuted: !t.isMuted } : t)));
  }, []);

  const handleFinalizeMix = () => {
    toast({
      title: "Finalizing Mix",
      description: "Your mix is being processed. This may take a moment.",
    });
  };

  const handleAIMaster = (preset: MasteringPreset) => {
    toast({
      title: "AI Mastering Started",
      description: `Applying "${preset}" mastering preset to your mix...`,
    });
  };

  return (
    <Layout>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-mixer-title">
              <SlidersHorizontal className="w-6 h-6 text-primary" />
              Mixing & AI Mastering
            </h1>
          </div>
          <Button onClick={handleFinalizeMix} className="font-bold neon-shadow" data-testid="button-finalize-mix">
            Finalize
          </Button>
        </div>

        <AIMasteringSection onMaster={handleAIMaster} />

        <div className="glass-panel rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Final Output Level</span>
            <span className="text-xs font-mono text-secondary">-1.4 dB</span>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary via-secondary to-yellow-400 rounded-full neon-shadow"
              animate={{ width: `${92}%` }}
              transition={{ duration: 0.5 }}
              data-testid="meter-final-output"
            />
          </div>
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="flex gap-3 min-w-max items-stretch" style={{ minHeight: "380px" }}>
            {tracks.map((track) => (
              <ChannelStrip
                key={track.id}
                track={track}
                onToggleSolo={handleToggleSolo}
                onToggleMute={handleToggleMute}
              />
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Volume2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold leading-none mb-1" data-testid="text-now-playing-name">{currentTrack.name}</p>
              <p className="text-[10px] text-muted-foreground leading-none">{currentTrack.artist}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="text-muted-foreground hover:text-foreground transition-colors" data-testid="button-skip-back" aria-label="Skip backward" title="Skip backward">
              <SkipBack className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:scale-105 transition-transform"
              data-testid="button-play-pause"
              aria-label={isPlaying ? "Pause" : "Play"}
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-background fill-current" />
              ) : (
                <Play className="w-5 h-5 text-background fill-current ml-0.5" />
              )}
            </button>
            <button className="text-muted-foreground hover:text-foreground transition-colors" data-testid="button-skip-forward" aria-label="Skip forward" title="Skip forward">
              <SkipForward className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
