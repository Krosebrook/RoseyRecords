import Layout from "@/components/Layout";
import { usePublicSongs, useLikeSong, useLikedSongIds } from "@/hooks/use-public-songs";
import { Music, Heart, Play, User } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Song } from "@shared/schema";
import { usePageTitle } from "@/hooks/use-page-title";

interface PublicSongCardProps {
  song: Song;
  isLiked: boolean;
}

function PublicSongCard({ song, isLiked }: PublicSongCardProps) {
  const { mutate: toggleLike, isPending } = useLikeSong();

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleLike(song.id);
  };

  return (
    <Link href={`/songs/${song.id}`} className="block group" data-testid={`card-song-${song.id}`}>
      <div className="glass-panel rounded-2xl p-5 h-full transition-all duration-300 hover:scale-[1.02] hover:border-primary/30 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-500" />
        
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center group-hover:from-primary group-hover:to-secondary transition-all duration-300">
              <Music className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
            </div>
            
            <Button
              size="icon"
              variant="ghost"
              onClick={handleLike}
              disabled={isPending}
              data-testid={`button-like-${song.id}`}
            >
              <Heart className={cn("w-5 h-5", isLiked && "fill-red-500 text-red-500")} />
            </Button>
          </div>
          
          <h3 className="text-lg font-bold mb-2 line-clamp-1 group-hover:text-primary transition-colors" data-testid={`text-song-title-${song.id}`}>
            {song.title}
          </h3>
          
          <div className="flex gap-2 mb-3 flex-wrap">
            {song.genre && (
              <span className="px-2 py-1 rounded-md bg-secondary/10 text-secondary text-xs font-medium">
                {song.genre}
              </span>
            )}
            {song.mood && (
              <span className="px-2 py-1 rounded-md bg-accent/10 text-accent text-xs font-medium">
                {song.mood}
              </span>
            )}
          </div>
          
          <p className="text-muted-foreground text-sm line-clamp-3 mb-auto font-mono opacity-80" data-testid={`text-lyrics-preview-${song.id}`}>
            {song.lyrics}
          </p>
          
          <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                {song.likeCount || 0}
              </span>
              <span className="flex items-center gap-1">
                <Play className="w-3 h-3" />
                {song.playCount || 0}
              </span>
            </div>
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              Artist
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Explore() {
  usePageTitle("Explore");
  const { data: songs, isLoading } = usePublicSongs();
  const { data: likedData } = useLikedSongIds();
  const likedIds = likedData?.likedIds || [];

  return (
    <Layout>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold mb-2" data-testid="text-explore-title">Explore</h1>
          <p className="text-muted-foreground" data-testid="text-explore-description">Discover songs created by the community.</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="container-loading">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 rounded-2xl bg-card/50 animate-pulse" />
            ))}
          </div>
        ) : songs && songs.length > 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            data-testid="container-songs"
          >
            {songs.map((song) => (
              <PublicSongCard 
                key={song.id} 
                song={song} 
                isLiked={likedIds.includes(song.id)}
              />
            ))}
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-card/30 rounded-3xl border border-dashed border-border text-center" data-testid="container-empty">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
              <Music className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">No public songs yet</h3>
            <p className="text-muted-foreground mb-8 max-w-sm">
              Be the first to share your creations with the community!
            </p>
            <Link href="/generate" className="text-primary hover:underline font-medium" data-testid="link-create-first">
              Create and share a song
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}
