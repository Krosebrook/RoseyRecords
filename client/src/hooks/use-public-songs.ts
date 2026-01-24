import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function usePublicSongs() {
  return useQuery({
    queryKey: [api.songs.listPublic.path],
    queryFn: async () => {
      const res = await fetch(api.songs.listPublic.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch public songs");
      return api.songs.listPublic.responses[200].parse(await res.json());
    },
  });
}

export function useLikedSongIds() {
  return useQuery({
    queryKey: ['/api/songs/liked-ids'],
    queryFn: async () => {
      const res = await fetch('/api/songs/liked-ids', { credentials: "include" });
      if (!res.ok) return { likedIds: [] as number[] };
      return res.json() as Promise<{ likedIds: number[] }>;
    },
  });
}

export function useLikeSong() {
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
        if (res.status === 401) throw new Error("Please sign in to like songs");
        throw new Error("Failed to like song");
      }
      return res.json() as Promise<{ liked: boolean; likeCount: number }>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.songs.listPublic.path] });
      queryClient.invalidateQueries({ queryKey: [api.songs.list.path] });
      queryClient.invalidateQueries({ queryKey: ['/api/songs/liked-ids'] });
      toast({
        title: data.liked ? "Added to Favorites" : "Removed from Favorites",
        description: data.liked ? "Song added to your favorites." : "Song removed from favorites.",
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
