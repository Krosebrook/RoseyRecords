import Layout from "@/components/Layout";
import { Heart, Music, Play, User } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { usePageTitle } from "@/hooks/use-page-title";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SongListItem } from "@shared/schema";
import { memo } from "react";

function useLikedSongs() {
  return useQuery({
    queryKey: ['/api/songs/liked'],
    queryFn: async () => {
      const res = await fetch('/api/songs/liked', { credentials: "include" });
      if (res.status === 401) return [];
      if (!res.ok) throw new Error("Failed to fetch liked songs");
      return res.json() as Promise<SongListItem[]>;
    },
  });
}

function useUnlikeSong() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (songId: number) => {
      const url = buildUrl(api.songs.like.path, { id: songId });
      const res = await fetch(url, {
        method: api.songs.like.method,
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error("Failed to unlike song");
      }
      return res.json() as Promise<{ liked: boolean; likeCount: number }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/songs/liked'] });
      queryClient.invalidateQueries({ queryKey: ['/api/songs/liked-ids'] });
      queryClient.invalidateQueries({ queryKey: [api.songs.listPublic.path] });
      toast({
        title: "Removed from Favorites",
        description: "Song removed from your favorites.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

const FavoriteSongCard = memo(function FavoriteSongCard({ song }: { song: SongListItem }) {
  const { mutate: unlikeSong, isPending } = useUnlikeSong();

  const handleUnlike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    unlikeSong(song.id);
  };

  return (
    <Link href={`/songs/${song.id}`} className="block group" data-testid={`card-song-${song.id}`}>
      <div className="glass-panel rounded-2xl p-5 h-full transition-all duration-300 hover:scale-[1.02] hover:border-primary/30 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-red-500/10 rounded-full blur-3xl group-hover:bg-red-500/20 transition-all duration-500" />
        
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/20 to-pink-500/20 flex items-center justify-center group-hover:from-red-500 group-hover:to-pink-500 transition-all duration-300">
              <Music className="w-6 h-6 text-red-400 group-hover:text-white transition-colors" />
            </div>
            
            <Button
              size="icon"
              variant="ghost"
              onClick={handleUnlike}
              disabled={isPending}
              data-testid={`button-unlike-${song.id}`}
            >
              <Heart className="w-5 h-5 fill-red-500 text-red-500" />
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
          
          <p className="text-muted-foreground text-sm line-clamp-3 mb-auto font-mono opacity-80">
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
          </div>
        </div>
      </div>
    </Link>
  );
});

export default function Favorites() {
  usePageTitle("Favorites");
  const { data: songs, isLoading } = useLikedSongs();

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2" data-testid="text-favorites-title">Favorites</h1>
          <p className="text-muted-foreground" data-testid="text-favorites-description">Songs you've liked from the community.</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="container-loading">
            {[1, 2, 3].map((i) => (
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
              <FavoriteSongCard key={song.id} song={song} />
            ))}
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-card/30 rounded-3xl border border-dashed border-border text-center" data-testid="container-empty">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
              <Heart className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">No favorites yet</h3>
            <p className="text-muted-foreground mb-8 max-w-sm">
              Like songs from the Explore page to save them here.
            </p>
            <Link href="/explore" className="text-primary hover:underline font-medium" data-testid="link-explore">
              Explore community songs
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}
