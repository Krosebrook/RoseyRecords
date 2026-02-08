import Layout from "@/components/Layout";
import { usePlaylist, useRemoveSongFromPlaylist } from "@/hooks/use-playlists";
import { ListMusic, ArrowLeft, Trash2, Music, Play } from "lucide-react";
import { Link, useParams } from "wouter";
import { motion } from "framer-motion";
import { usePageTitle } from "@/hooks/use-page-title";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import type { Song } from "@shared/schema";
import { memo, useCallback } from "react";

interface PlaylistSongRowProps {
  song: Song;
  playlistId: number;
  onRemove: (id: number) => void;
}

const PlaylistSongRow = memo(function PlaylistSongRow({ song, playlistId, onRemove }: PlaylistSongRowProps) {
  return (
    <div className="flex items-center gap-4 p-4 glass-panel rounded-xl group" data-testid={`row-song-${song.id}`}>
      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
        <Music className="w-5 h-5 text-muted-foreground" />
      </div>
      
      <div className="flex-1 min-w-0">
        <Link href={`/songs/${song.id}`}>
          <h4 className="font-medium truncate hover:text-primary transition-colors" data-testid={`text-song-title-${song.id}`}>
            {song.title}
          </h4>
        </Link>
        <div className="flex gap-2 mt-1">
          {song.genre && (
            <span className="text-xs text-secondary">{song.genre}</span>
          )}
          {song.mood && (
            <span className="text-xs text-accent">{song.mood}</span>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Play className="w-3 h-3" />
          {song.playCount || 0}
        </span>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => onRemove(song.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          data-testid={`button-remove-${song.id}`}
        >
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
});

export default function PlaylistDetails() {
  const { id } = useParams<{ id: string }>();
  const playlistId = Number(id);
  const { data: playlist, isLoading } = usePlaylist(playlistId);
  const { mutate: removeSong } = useRemoveSongFromPlaylist();
  
  usePageTitle(playlist?.name || "Playlist");

  const handleRemove = useCallback((songId: number) => {
    if (confirm("Remove this song from the playlist?")) {
      removeSong({ playlistId, songId });
    }
  }, [playlistId, removeSong]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex flex-col gap-6">
          <div className="h-8 w-48 bg-card/50 animate-pulse rounded" />
          <div className="h-4 w-64 bg-card/50 animate-pulse rounded" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-card/50 animate-pulse" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (!playlist) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-20">
          <h2 className="text-xl font-bold mb-4">Playlist not found</h2>
          <Link href="/playlists">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Playlists
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div>
          <Link href="/playlists" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Playlists
          </Link>
          
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center shrink-0">
              <ListMusic className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold" data-testid="text-playlist-title">{playlist.name}</h1>
              {playlist.description && (
                <p className="text-muted-foreground mt-1">{playlist.description}</p>
              )}
              <p className="text-sm text-muted-foreground mt-2">
                {playlist.songs?.length || 0} songs • Created {playlist.createdAt ? format(new Date(playlist.createdAt), 'MMM d, yyyy') : 'Unknown'}
              </p>
            </div>
          </div>
        </div>

        {playlist.songs && playlist.songs.length > 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
            data-testid="container-songs"
          >
            {playlist.songs.map((song) => (
              <PlaylistSongRow 
                key={song.id} 
                song={song} 
                playlistId={playlistId}
                onRemove={handleRemove}
              />
            ))}
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 bg-card/30 rounded-3xl border border-dashed border-border text-center" data-testid="container-empty">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Music className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold mb-2">No songs in this playlist</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Add songs from your library or the explore page.
            </p>
            <Link href="/dashboard">
              <Button variant="outline">Browse your songs</Button>
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}
