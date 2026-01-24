import { Link } from "wouter";
import { Music, Calendar, Trash2, Globe, Lock } from "lucide-react";
import { type Song } from "@shared/schema";
import { format } from "date-fns";
import { useDeleteSong } from "@/hooks/use-songs";
import { Button } from "@/components/ui/button";

interface SongCardProps {
  song: Song;
}

export function SongCard({ song }: SongCardProps) {
  const { mutate: deleteSong, isPending } = useDeleteSong();

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this song?")) {
      deleteSong(song.id);
    }
  };

  return (
    <Link href={`/songs/${song.id}`} className="block group" data-testid={`card-song-${song.id}`}>
      <div className="glass-panel rounded-2xl p-6 h-full transition-all duration-300 hover:scale-[1.02] hover:border-primary/30 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-500" />
        
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors duration-300">
              <Music className="w-6 h-6" />
            </div>
            
            <div className="flex items-center gap-1">
              {song.isPublic ? (
                <span className="p-2 text-primary" title="Public">
                  <Globe className="w-4 h-4" />
                </span>
              ) : (
                <span className="p-2 text-muted-foreground" title="Private">
                  <Lock className="w-4 h-4" />
                </span>
              )}
              <Button
                size="icon"
                variant="ghost"
                onClick={handleDelete}
                disabled={isPending}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                data-testid={`button-delete-${song.id}`}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </div>
          
          <h3 className="text-xl font-bold mb-2 line-clamp-1 group-hover:text-primary transition-colors" data-testid={`text-title-${song.id}`}>
            {song.title}
          </h3>
          
          <div className="flex gap-2 mb-4 flex-wrap">
            {song.genre && (
              <span className="px-2 py-1 rounded-md bg-secondary/10 text-secondary text-xs font-medium uppercase tracking-wider">
                {song.genre}
              </span>
            )}
            {song.mood && (
              <span className="px-2 py-1 rounded-md bg-accent/10 text-accent text-xs font-medium uppercase tracking-wider">
                {song.mood}
              </span>
            )}
          </div>
          
          <p className="text-muted-foreground text-sm line-clamp-3 mb-auto font-mono opacity-80" data-testid={`text-lyrics-preview-${song.id}`}>
            {song.lyrics}
          </p>
          
          <div className="mt-6 pt-4 border-t border-border/50 flex items-center text-xs text-muted-foreground gap-2">
            <Calendar className="w-3 h-3" />
            {song.createdAt ? format(new Date(song.createdAt), 'MMM d, yyyy') : 'Unknown date'}
          </div>
        </div>
      </div>
    </Link>
  );
}
