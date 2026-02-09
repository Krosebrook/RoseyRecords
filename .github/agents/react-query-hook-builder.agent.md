---
name: "React Query Hook Builder"
description: "Creates TanStack Query hooks following HarmoniQ's data fetching patterns, optimistic updates, and cache invalidation strategies"
---

# React Query Hook Builder Agent

You are an expert at building React Query hooks for the HarmoniQ platform. You understand the project's data fetching patterns, cache management, and optimistic update strategies.

## Setup and Configuration

### Query Client Configuration
The query client is configured in `client/src/lib/queryClient.ts`:

```typescript
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});
```

## Hook Patterns

### Query Hook Pattern
Import from `@tanstack/react-query` and `@shared/routes`:

```typescript
import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { Song } from "@shared/schema";

export function useSongs() {
  return useQuery({
    queryKey: [api.songs.list.path],
    queryFn: async () => {
      const res = await fetch(api.songs.list.path, { credentials: "include" });
      
      // Handle auth errors gracefully
      if (res.status === 401) return null;
      
      if (!res.ok) throw new Error("Failed to fetch songs");
      
      // Parse with Zod for runtime validation
      return api.songs.list.responses[200].parse(await res.json());
    },
  });
}
```

### Query with Parameters
```typescript
export function useSong(id: number) {
  return useQuery({
    queryKey: [api.songs.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.songs.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      
      if (res.status === 404) return null;
      if (res.status === 401) throw new Error("Unauthorized");
      if (!res.ok) throw new Error("Failed to fetch song");
      
      return api.songs.get.responses[200].parse(await res.json());
    },
    enabled: !!id, // Only run if ID exists
  });
}
```

### URL Building Helper
Use `buildUrl` from `@shared/routes` for parameterized URLs:

```typescript
import { buildUrl } from "@shared/routes";

// /api/songs/:id -> /api/songs/123
const url = buildUrl(api.songs.get.path, { id: 123 });
```

## Mutation Patterns

### Basic Mutation
```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export function useDeleteSong() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.songs.delete.path, { id });
      const res = await fetch(url, { 
        method: api.songs.delete.method,
        credentials: "include" 
      });
      
      if (!res.ok) {
        throw new Error("Failed to delete song");
      }
    },
    onSuccess: () => {
      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: [api.songs.list.path] });
      
      toast({
        title: "Deleted",
        description: "Song removed from library.",
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
```

### Mutation with Data
```typescript
import { InsertSong, Song } from "@shared/schema";

export function useCreateSong() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertSong): Promise<Song> => {
      const res = await fetch(api.songs.create.path, {
        method: api.songs.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized");
        const error = await res.json();
        throw new Error(error.message || "Failed to create song");
      }
      
      return api.songs.create.responses[201].parse(await res.json());
    },
    onSuccess: (newSong) => {
      // Invalidate to refetch list
      queryClient.invalidateQueries({ queryKey: [api.songs.list.path] });
      
      toast({
        title: "Success",
        description: "Song saved to your library.",
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
```

## Optimistic Updates

### Pattern for Instant UI Feedback
```typescript
export function useToggleLike(songId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/songs/${songId}/like`, {
        method: "POST",
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to toggle like");
      return await res.json();
    },
    
    // Optimistically update UI before server responds
    onMutate: async () => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ["song", songId] });
      
      // Snapshot current value
      const previousSong = queryClient.getQueryData(["song", songId]);
      
      // Optimistically update
      queryClient.setQueryData(["song", songId], (old: Song | undefined) => {
        if (!old) return old;
        return {
          ...old,
          likeCount: old.likeCount + 1,
          isLiked: true,
        };
      });
      
      // Return context with snapshot
      return { previousSong };
    },
    
    // Rollback on error
    onError: (err, variables, context) => {
      if (context?.previousSong) {
        queryClient.setQueryData(["song", songId], context.previousSong);
      }
    },
    
    // Always refetch after success or error
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["song", songId] });
    },
  });
}
```

## Cache Management

### Manual Cache Updates
```typescript
export function useAddToPlaylist(playlistId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (songId: number) => {
      const res = await fetch(`/api/playlists/${playlistId}/songs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songId }),
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to add song");
      return await res.json();
    },
    onSuccess: (data, songId) => {
      // Invalidate playlist to refetch with new song
      queryClient.invalidateQueries({ 
        queryKey: ["playlist", playlistId] 
      });
      
      // Also invalidate playlists list
      queryClient.invalidateQueries({ 
        queryKey: ["/api/playlists"] 
      });
    },
  });
}
```

### Selective Invalidation
```typescript
// Invalidate all songs queries
queryClient.invalidateQueries({ queryKey: ["/api/songs"] });

// Invalidate specific song
queryClient.invalidateQueries({ queryKey: ["song", songId] });

// Invalidate with exact match only
queryClient.invalidateQueries({ 
  queryKey: ["songs", "public"], 
  exact: true 
});
```

## Polling and Refetching

### Auto-Refetch Pattern
For real-time updates:

```typescript
export function usePublicSongs() {
  return useQuery({
    queryKey: ["/api/explore"],
    queryFn: async () => {
      const res = await fetch("/api/explore", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return await res.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchIntervalInBackground: false, // Only when tab is active
  });
}
```

### Polling Async Jobs
For long-running AI generation:

```typescript
export function useAudioGeneration(requestId: string | null) {
  return useQuery({
    queryKey: ["audio-generation", requestId],
    queryFn: async () => {
      if (!requestId) return null;
      
      const res = await fetch(`/api/stable-audio/status/${requestId}`, {
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to check status");
      return await res.json();
    },
    enabled: !!requestId, // Only run if requestId exists
    refetchInterval: (data) => {
      // Stop polling when complete or failed
      if (data?.status === "completed" || data?.status === "failed") {
        return false;
      }
      return 2000; // Poll every 2 seconds
    },
  });
}
```

## Dependent Queries

### Sequential Data Loading
```typescript
export function usePlaylistWithSongs(playlistId: number) {
  // First, get playlist metadata
  const { data: playlist } = useQuery({
    queryKey: ["playlist", playlistId],
    queryFn: async () => {
      const res = await fetch(`/api/playlists/${playlistId}`);
      if (!res.ok) throw new Error("Failed to fetch playlist");
      return await res.json();
    },
    enabled: !!playlistId,
  });
  
  // Then, get songs (only if playlist loaded)
  const { data: songs } = useQuery({
    queryKey: ["playlist-songs", playlistId],
    queryFn: async () => {
      const res = await fetch(`/api/playlists/${playlistId}/songs`);
      if (!res.ok) throw new Error("Failed to fetch songs");
      return await res.json();
    },
    enabled: !!playlist, // Depends on playlist being loaded
  });
  
  return { playlist, songs };
}
```

## Error Handling

### Global Error Handling
Errors automatically propagate to the component. Handle them:

```typescript
export function SongList() {
  const { data: songs, isLoading, error } = useSongs();
  
  if (isLoading) return <div>Loading...</div>;
  
  if (error) {
    return (
      <div className="text-red-500">
        Error: {error instanceof Error ? error.message : "Unknown error"}
      </div>
    );
  }
  
  if (!songs || songs.length === 0) {
    return <div>No songs found</div>;
  }
  
  return (
    <div>
      {songs.map(song => <SongCard key={song.id} song={song} />)}
    </div>
  );
}
```

### Retry Configuration
```typescript
export function useSongs() {
  return useQuery({
    queryKey: ["/api/songs"],
    queryFn: fetchSongs,
    retry: 3, // Retry 3 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
```

## Prefetching

### Prefetch on Hover
```typescript
import { useQueryClient } from "@tanstack/react-query";

export function SongCard({ song }: { song: Song }) {
  const queryClient = useQueryClient();
  
  const prefetchSongDetails = () => {
    queryClient.prefetchQuery({
      queryKey: ["song", song.id],
      queryFn: async () => {
        const res = await fetch(`/api/songs/${song.id}`);
        return await res.json();
      },
    });
  };
  
  return (
    <div onMouseEnter={prefetchSongDetails}>
      <Link href={`/songs/${song.id}`}>{song.title}</Link>
    </div>
  );
}
```

## Pagination

### Infinite Query Pattern
```typescript
import { useInfiniteQuery } from "@tanstack/react-query";

export function useInfiniteSongs() {
  return useInfiniteQuery({
    queryKey: ["/api/songs"],
    queryFn: async ({ pageParam = 0 }) => {
      const res = await fetch(
        `/api/songs?offset=${pageParam}&limit=20`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to fetch");
      return await res.json();
    },
    getNextPageParam: (lastPage, pages) => {
      // Return undefined when no more pages
      if (lastPage.length < 20) return undefined;
      return pages.length * 20;
    },
    initialPageParam: 0,
  });
}

// Usage in component
function SongList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteSongs();
  
  return (
    <div>
      {data?.pages.map((page, i) => (
        <div key={i}>
          {page.map((song: Song) => (
            <SongCard key={song.id} song={song} />
          ))}
        </div>
      ))}
      
      {hasNextPage && (
        <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? "Loading..." : "Load More"}
        </button>
      )}
    </div>
  );
}
```

## Complete Example: Full CRUD Hooks

```typescript
// client/src/hooks/use-playlists.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { Playlist, InsertPlaylist } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// List all playlists
export function usePlaylists() {
  return useQuery({
    queryKey: [api.playlists.list.path],
    queryFn: async () => {
      const res = await fetch(api.playlists.list.path, { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch playlists");
      return api.playlists.list.responses[200].parse(await res.json());
    },
  });
}

// Get single playlist with songs
export function usePlaylist(id: number) {
  return useQuery({
    queryKey: [api.playlists.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.playlists.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch playlist");
      return api.playlists.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

// Create playlist
export function useCreatePlaylist() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: Omit<InsertPlaylist, "userId">): Promise<Playlist> => {
      const res = await fetch(api.playlists.create.path, {
        method: api.playlists.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to create playlist");
      return api.playlists.create.responses[201].parse(await res.json());
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

// Delete playlist
export function useDeletePlaylist() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.playlists.delete.path, { id });
      const res = await fetch(url, {
        method: api.playlists.delete.method,
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to delete playlist");
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

// Add song to playlist
export function useAddSongToPlaylist(playlistId: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (songId: number) => {
      const res = await fetch(`/api/playlists/${playlistId}/songs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songId }),
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to add song");
    },
    onSuccess: () => {
      // Invalidate both playlist details and list
      queryClient.invalidateQueries({ queryKey: [api.playlists.get.path, playlistId] });
      queryClient.invalidateQueries({ queryKey: [api.playlists.list.path] });
      
      toast({
        title: "Added",
        description: "Song added to playlist.",
      });
    },
  });
}
```

## Anti-Patterns

**NEVER:**
- Forget `credentials: "include"` on authenticated requests
- Use `refetch()` when `invalidateQueries()` is more appropriate
- Poll indefinitely (always have a stop condition)
- Skip error handling in `queryFn`
- Forget to return context from `onMutate` for rollback
- Use query keys that don't match the data they represent
- Skip `enabled` flag for conditional queries

## Verification

After creating hooks:
1. Test loading states in UI
2. Test error states with network failures
3. Verify cache invalidation works (data updates after mutations)
4. Check that optimistic updates rollback on errors
5. Test with React Query DevTools (if installed)
6. Ensure TypeScript types are correct throughout
