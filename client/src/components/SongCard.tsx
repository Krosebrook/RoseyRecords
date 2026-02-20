import { Link } from "wouter";
import { Music, Calendar, Trash2, Globe, Lock } from "lucide-react";
import { type Song } from "@shared/schema";
import { format } from "date-fns";
import { useDeleteSong } from "@/hooks/use-songs";
import { Button } from "@/components/ui/button";
import { memo } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SongCardProps {
  song: Song;
}

export const SongCard = memo(function SongCard({ song }: SongCardProps) {
  const { mutate: deleteSong, isPending } = useDeleteSong();

  return (
    <div className="relative group block h-full" data-testid={`card-song-${song.id}`}>
      {/* Main card link overlay */}
      <Link
        href={`/songs/${song.id}`}
        className="absolute inset-0 z-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl"
      >
        <span className="sr-only">View song {song.title}</span>
      </Link>

      <div className="glass-panel rounded-2xl p-6 h-full transition-all duration-300 group-hover:scale-[1.02] group-hover:border-primary/30 relative overflow-hidden pointer-events-none">
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-500" />
        
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors duration-300">
              <Music className="w-6 h-6" />
            </div>
            
            <div className="flex items-center gap-1 relative z-20 pointer-events-auto">
              {song.isPublic ? (
                <span className="p-2 text-primary" role="img" aria-label="Public song">
                  <Globe className="w-4 h-4" aria-hidden="true" />
                </span>
              ) : (
                <span className="p-2 text-muted-foreground" role="img" aria-label="Private song">
                  <Lock className="w-4 h-4" aria-hidden="true" />
                </span>
              )}

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => e.stopPropagation()}
                    disabled={isPending}
                    className="opacity-0 group-hover:opacity-100 focus:opacity-100 focus-visible:opacity-100 transition-opacity"
                    data-testid={`button-delete-${song.id}`}
                    aria-label={`Delete song ${song.title}`}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Song</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{song.title}"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteSong(song.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
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
    </div>
  );
});
