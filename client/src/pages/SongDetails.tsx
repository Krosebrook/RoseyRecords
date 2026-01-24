import { useRoute, Link } from "wouter";
import Layout from "@/components/Layout";
import { useSong, useDeleteSong } from "@/hooks/use-songs";
import { ArrowLeft, Calendar, Trash2, Tag, Music, Share2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function SongDetails() {
  const [, params] = useRoute("/songs/:id");
  const id = parseInt(params?.id || "0");
  const { data: song, isLoading, error } = useSong(id);
  const { mutate: deleteSong, isPending: isDeleting } = useDeleteSong();
  const { toast } = useToast();

  if (isLoading) return <Layout><div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div></Layout>;
  
  if (error || !song) return (
    <Layout>
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <h2 className="text-2xl font-bold">Song Not Found</h2>
        <Link href="/dashboard" className="text-primary hover:underline">Back to Dashboard</Link>
      </div>
    </Layout>
  );

  const handleDelete = () => {
    if (confirm("Are you sure? This cannot be undone.")) {
      deleteSong(id);
      // Ideally redirect after, but mutation hook handles query invalidation
      window.location.href = "/dashboard";
    }
  };

  const handleCopyLyrics = () => {
    navigator.clipboard.writeText(song.lyrics);
    toast({ title: "Copied!", description: "Lyrics copied to clipboard." });
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          
          <div className="glass-panel p-8 rounded-3xl relative overflow-hidden">
             {/* Background blur splash */}
             <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="flex flex-col md:flex-row justify-between items-start gap-6 relative z-10">
              <div>
                <h1 className="text-4xl md:text-5xl font-black mb-4 font-display tracking-tight text-white">{song.title}</h1>
                <div className="flex flex-wrap gap-3 items-center text-sm">
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20">
                    <Music className="w-3.5 h-3.5" /> {song.genre}
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                    <Tag className="w-3.5 h-3.5" /> {song.mood}
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-muted-foreground border border-white/5">
                    <Calendar className="w-3.5 h-3.5" /> {song.createdAt ? format(new Date(song.createdAt), 'MMMM d, yyyy') : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={handleCopyLyrics}
                  className="p-3 rounded-xl bg-background/50 hover:bg-background border border-white/10 transition-all hover:border-white/20 tooltip"
                  title="Copy Lyrics"
                >
                  <Share2 className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="p-3 rounded-xl bg-destructive/10 hover:bg-destructive text-destructive hover:text-white border border-destructive/20 transition-all"
                  title="Delete Song"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-white/10">
              <pre className="whitespace-pre-wrap font-mono text-lg leading-relaxed text-foreground/90 max-w-2xl">
                {song.lyrics}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
