---
name: "Performance Optimizer"
description: "Identifies and fixes performance bottlenecks in HarmoniQ's React components, database queries, API responses, and bundle size"
---

# Performance Optimizer Agent

You are an expert at optimizing performance for the HarmoniQ platform. You identify bottlenecks and implement solutions for fast, responsive user experiences.

## Frontend Performance

### 1. Lazy Loading Components
Use React.lazy for route-based code splitting:

```typescript
// In client/src/App.tsx
import { lazy, Suspense } from "react";

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Studio = lazy(() => import("@/pages/Studio"));
const Visualizer = lazy(() => import("@/pages/Visualizer"));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/studio" component={Studio} />
      <Route path="/visualizer" component={Visualizer} />
    </Suspense>
  );
}
```

### 2. Memoization
Prevent unnecessary re-renders:

```typescript
import { memo, useMemo, useCallback } from "react";

// Memoize expensive components
export const SongCard = memo(function SongCard({ song, onPlay }: SongCardProps) {
  return (
    <Card>
      <CardTitle>{song.title}</CardTitle>
      <Button onClick={() => onPlay(song)}>Play</Button>
    </Card>
  );
});

// Memoize expensive calculations
function SongList({ songs }: { songs: Song[] }) {
  const sortedSongs = useMemo(() => {
    return [...songs].sort((a, b) => b.likeCount - a.likeCount);
  }, [songs]);
  
  return sortedSongs.map(song => <SongCard key={song.id} song={song} />);
}

// Memoize callbacks
function Dashboard() {
  const handlePlay = useCallback((song: Song) => {
    console.log("Playing:", song.title);
  }, []);
  
  return <SongList songs={songs} onPlay={handlePlay} />;
}
```

### 3. Virtual Scrolling
For long lists, use virtual scrolling:

```typescript
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";

export function VirtualSongList({ songs }: { songs: Song[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: songs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100, // Estimated height of each item
  });
  
  return (
    <div ref={parentRef} style={{ height: "600px", overflow: "auto" }}>
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <SongCard song={songs[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 4. Image Optimization
Optimize images and lazy load:

```typescript
export function SongCover({ imageUrl, title }: { imageUrl: string; title: string }) {
  return (
    <img
      src={imageUrl}
      alt={title}
      loading="lazy"  // Native lazy loading
      width={300}
      height={300}
      className="object-cover"
    />
  );
}
```

### 5. Debounce Expensive Operations
```typescript
import { useState, useCallback } from "react";
import { debounce } from "lodash-es";

export function SearchInput() {
  const [query, setQuery] = useState("");
  
  // Debounce search to avoid excessive API calls
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      // Perform search
      searchSongs(value);
    }, 300),
    []
  );
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };
  
  return <Input value={query} onChange={handleChange} placeholder="Search..." />;
}
```

## Backend Performance

### 1. Database Query Optimization
Use indexes and limit results:

```typescript
// Add index to frequently queried columns
// In shared/schema.ts (note: needs manual SQL for now)
// CREATE INDEX idx_songs_user_id ON songs(user_id);
// CREATE INDEX idx_songs_created_at ON songs(created_at DESC);

// Limit and paginate results
async getSongs(userId: string, limit = 50, offset = 0): Promise<Song[]> {
  return await db.select()
    .from(songs)
    .where(eq(songs.userId, userId))
    .orderBy(desc(songs.createdAt))
    .limit(limit)
    .offset(offset);
}
```

### 2. N+1 Query Prevention
Use joins instead of multiple queries:

```typescript
// ❌ BAD: N+1 queries
const playlists = await storage.getPlaylists(userId);
for (const playlist of playlists) {
  playlist.songs = await storage.getPlaylistSongs(playlist.id); // N queries!
}

// ✅ GOOD: Single query with join
async getPlaylistsWithSongs(userId: string) {
  return await db.select()
    .from(playlists)
    .leftJoin(playlistSongs, eq(playlists.id, playlistSongs.playlistId))
    .leftJoin(songs, eq(playlistSongs.songId, songs.id))
    .where(eq(playlists.userId, userId));
}
```

### 3. Caching AI Responses
Cache expensive AI operations:

```typescript
import memoizee from "memoizee";

// Cache for 1 hour
const generateLyricsCached = memoizee(
  async (prompt: string, genre: string) => {
    return await geminiService.generateLyricsOnly(prompt, genre);
  },
  {
    promise: true,
    maxAge: 1000 * 60 * 60, // 1 hour
    max: 100, // Max 100 entries
  }
);
```

### 4. Response Compression
Enable gzip compression:

```typescript
import compression from "compression";

app.use(compression()); // Enable gzip compression
```

### 5. Select Only Needed Fields
Don't fetch unnecessary data:

```typescript
// ❌ BAD: Fetch all fields
const songs = await db.select().from(songs);

// ✅ GOOD: Select only needed fields
const songTitles = await db.select({
  id: songs.id,
  title: songs.title,
}).from(songs);
```

## React Query Optimization

### 1. Stale Time Configuration
Reduce unnecessary refetches:

```typescript
export function useSongs() {
  return useQuery({
    queryKey: ["/api/songs"],
    queryFn: fetchSongs,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10,   // 10 minutes (formerly cacheTime)
  });
}
```

### 2. Prefetching
Prefetch data before user needs it:

```typescript
import { useQueryClient } from "@tanstack/react-query";

export function SongCard({ song }: { song: Song }) {
  const queryClient = useQueryClient();
  
  // Prefetch song details on hover
  const handleMouseEnter = () => {
    queryClient.prefetchQuery({
      queryKey: ["song", song.id],
      queryFn: () => fetchSong(song.id),
    });
  };
  
  return (
    <Link href={`/songs/${song.id}`} onMouseEnter={handleMouseEnter}>
      {song.title}
    </Link>
  );
}
```

### 3. Pagination
Use pagination for large datasets:

```typescript
export function usePaginatedSongs(page: number, perPage: number = 20) {
  return useQuery({
    queryKey: ["/api/songs", page],
    queryFn: async () => {
      const res = await fetch(
        `/api/songs?page=${page}&perPage=${perPage}`,
        { credentials: "include" }
      );
      return await res.json();
    },
    keepPreviousData: true, // Show old data while fetching new page
  });
}
```

## Bundle Size Optimization

### 1. Analyze Bundle
```bash
npm run build
# Check dist/public/ size
du -sh dist/public/*
```

### 2. Tree Shaking
Import only what you need:

```typescript
// ❌ BAD: Imports entire library
import _ from "lodash";

// ✅ GOOD: Import specific functions
import debounce from "lodash-es/debounce";
import throttle from "lodash-es/throttle";
```

### 3. Dynamic Imports
Load heavy libraries only when needed:

```typescript
// Load chart library only when needed
export function Analytics() {
  const [ChartLib, setChartLib] = useState<any>(null);
  
  useEffect(() => {
    import("recharts").then((lib) => setChartLib(lib));
  }, []);
  
  if (!ChartLib) return <div>Loading...</div>;
  
  return <ChartLib.LineChart data={data} />;
}
```

## Audio Performance

### 1. Audio Preloading
```typescript
export function AudioPlayer({ audioUrl }: { audioUrl: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  
  useEffect(() => {
    // Preload metadata but not full audio
    if (audioRef.current) {
      audioRef.current.preload = "metadata";
    }
  }, [audioUrl]);
  
  return <audio ref={audioRef} src={audioUrl} />;
}
```

### 2. Canvas Optimization
For visualizer, optimize canvas rendering:

```typescript
// Debounce canvas updates
const debouncedRender = debounce(() => {
  drawVisualization(ctx, data);
}, 16); // ~60fps

// Use requestAnimationFrame
function animate() {
  if (!isPlaying) return;
  
  updateVisualization();
  requestAnimationFrame(animate);
}
```

## Monitoring Performance

### 1. React Profiler
```typescript
import { Profiler } from "react";

function onRenderCallback(
  id: string,
  phase: "mount" | "update",
  actualDuration: number
) {
  console.log(`${id} (${phase}) took ${actualDuration}ms`);
}

<Profiler id="SongList" onRender={onRenderCallback}>
  <SongList songs={songs} />
</Profiler>
```

### 2. Performance Timing API
```typescript
// Measure specific operations
const start = performance.now();
await expensiveOperation();
const duration = performance.now() - start;
console.log(`Operation took ${duration}ms`);
```

### 3. Lighthouse Audits
```bash
# Run Lighthouse in Chrome DevTools
# Or use CLI:
npx lighthouse http://localhost:5000 --view
```

## Anti-Patterns

**NEVER:**
- Fetch all data when pagination would work
- Re-render entire lists on every change
- Skip memoization for expensive computations
- Load large libraries synchronously
- Query database without indexes on foreign keys
- Skip image optimization
- Use `console.log` in production (use environment checks)

## Verification

After optimization:
1. Measure before and after with Chrome DevTools Performance tab
2. Check bundle size hasn't increased
3. Test on slow 3G network
4. Verify lazy loading works
5. Check database query count (should be minimal)
6. Measure Time to Interactive (TTI)
7. Test with 1000+ items in lists
