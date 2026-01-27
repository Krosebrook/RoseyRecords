import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type PlaylistInput } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import type { Playlist, Song } from "@shared/schema";

export function usePlaylists() {
  return useQuery({
    queryKey: [api.playlists.list.path],
    queryFn: async () => {
      const res = await fetch(api.playlists.list.path, { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch playlists");
      return res.json() as Promise<Playlist[]>;
    },
  });
}

export function usePlaylist(id: number) {
  return useQuery({
    queryKey: [api.playlists.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.playlists.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (res.status === 401) throw new Error("Unauthorized");
      if (!res.ok) throw new Error("Failed to fetch playlist");
      return res.json() as Promise<Playlist & { songs: Song[] }>;
    },
    enabled: !!id,
  });
}

export function useCreatePlaylist() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: PlaylistInput) => {
      const res = await fetch(api.playlists.create.path, {
        method: api.playlists.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized");
        const error = await res.json();
        throw new Error(error.message || "Failed to create playlist");
      }
      return res.json() as Promise<Playlist>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.playlists.list.path] });
      toast({
        title: "Success",
        description: "Playlist created.",
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

export function useDeletePlaylist() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.playlists.delete.path, { id });
      const res = await fetch(url, { 
        method: api.playlists.delete.method,
        credentials: "include" 
      });
      
      if (!res.ok) {
        throw new Error("Failed to delete playlist");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.playlists.list.path] });
      toast({
        title: "Deleted",
        description: "Playlist removed.",
      });
    },
  });
}

export function useAddSongToPlaylist() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ playlistId, songId }: { playlistId: number; songId: number }) => {
      const url = buildUrl(api.playlists.addSong.path, { id: playlistId });
      const res = await fetch(url, {
        method: api.playlists.addSong.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songId }),
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error("Failed to add song to playlist");
      }
      return res.json();
    },
    onSuccess: (_, { playlistId }) => {
      queryClient.invalidateQueries({ queryKey: [api.playlists.get.path, playlistId] });
      toast({
        title: "Added",
        description: "Song added to playlist.",
      });
    },
  });
}

export function useRemoveSongFromPlaylist() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ playlistId, songId }: { playlistId: number; songId: number }) => {
      const url = buildUrl(api.playlists.removeSong.path, { id: playlistId, songId });
      const res = await fetch(url, {
        method: api.playlists.removeSong.method,
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error("Failed to remove song from playlist");
      }
    },
    onSuccess: (_, { playlistId }) => {
      queryClient.invalidateQueries({ queryKey: [api.playlists.get.path, playlistId] });
      toast({
        title: "Removed",
        description: "Song removed from playlist.",
      });
    },
  });
}
