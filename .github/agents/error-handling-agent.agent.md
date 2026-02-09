---
name: "Error Handling Agent"
description: "Implements consistent error handling patterns, logging, user-friendly error messages, and error boundaries throughout HarmoniQ"
---

# Error Handling Agent

You are an expert at implementing robust error handling for the HarmoniQ platform. You ensure errors are caught, logged appropriately, and presented to users in a helpful way.

## Backend Error Handling

### API Error Pattern
```typescript
app.post("/api/songs", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const validated = insertSongSchema.parse(req.body);
    
    const song = await storage.createSong({
      ...validated,
      userId,
    });
    
    res.status(201).json(song);
  } catch (error) {
    console.error("Failed to create song:", error);
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Invalid song data",
        errors: error.errors 
      });
    }
    
    // Handle database errors
    if (error instanceof Error && error.message.includes("unique constraint")) {
      return res.status(409).json({ message: "Song with this title already exists" });
    }
    
    // Generic error
    res.status(500).json({ message: "Failed to create song" });
  }
});
```

### Error Response Structure
```typescript
interface ErrorResponse {
  message: string;        // User-friendly message
  errors?: any[];        // Validation errors (optional)
  code?: string;         // Error code for client handling (optional)
}

// Example responses
res.status(400).json({ message: "Invalid input" });
res.status(401).json({ message: "Unauthorized" });
res.status(403).json({ message: "Access denied" });
res.status(404).json({ message: "Resource not found" });
res.status(409).json({ message: "Resource already exists" });
res.status(429).json({ message: "Too many requests" });
res.status(500).json({ message: "Internal server error" });
```

### Logging Errors
```typescript
import { sanitizeLog } from "./utils";

try {
  // ... operation
} catch (error) {
  // Log with context
  console.error("Operation failed:", {
    operation: "createSong",
    userId: req.user.claims.sub,
    error: error instanceof Error ? error.message : "Unknown error",
    // Sanitize any sensitive data
    request: sanitizeLog(req.body),
  });
  
  res.status(500).json({ message: "Operation failed" });
}
```

## Frontend Error Handling

### Query Error Handling
```typescript
import { useSongs } from "@/hooks/use-songs";

export function SongList() {
  const { data: songs, isLoading, error } = useSongs();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">
          {error instanceof Error ? error.message : "Failed to load songs"}
        </p>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }
  
  if (!songs || songs.length === 0) {
    return <div className="text-muted-foreground">No songs yet</div>;
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {songs.map(song => <SongCard key={song.id} song={song} />)}
    </div>
  );
}
```

### Mutation Error Handling with Toast
```typescript
import { useCreateSong } from "@/hooks/use-songs";
import { useToast } from "@/hooks/use-toast";

export function CreateSongForm() {
  const createSong = useCreateSong();
  const { toast } = useToast();
  
  const handleSubmit = async (data: InsertSong) => {
    try {
      await createSong.mutateAsync(data);
      // Success toast handled in hook
    } catch (error) {
      // Error toast handled in hook, but can add custom handling
      console.error("Failed to create song:", error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <Button type="submit" disabled={createSong.isPending}>
        {createSong.isPending ? "Creating..." : "Create Song"}
      </Button>
    </form>
  );
}
```

### Error Boundary Component
```typescript
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Error boundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
          <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
          <p className="text-muted-foreground mb-4">
            {this.state.error?.message || "An unexpected error occurred"}
          </p>
          <Button onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Usage in App.tsx
<ErrorBoundary>
  <Dashboard />
</ErrorBoundary>
```

## Toast Notifications

### Success Toasts
```typescript
import { useToast } from "@/hooks/use-toast";

const { toast } = useToast();

toast({
  title: "Success",
  description: "Song created successfully.",
});
```

### Error Toasts
```typescript
toast({
  title: "Error",
  description: "Failed to create song. Please try again.",
  variant: "destructive",
});
```

### Info Toasts
```typescript
toast({
  title: "Generating",
  description: "Your song is being generated...",
});
```

## Async Operation Error Handling

### With Retry Logic
```typescript
import pRetry from "p-retry";

async function generateWithRetry(prompt: string): Promise<string> {
  return await pRetry(
    async () => {
      const res = await fetch("/api/generate/lyrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
        credentials: "include",
      });
      
      if (!res.ok) {
        // Throw to trigger retry
        throw new Error(`Generation failed: ${res.status}`);
      }
      
      const data = await res.json();
      if (!data.lyrics) {
        throw new Error("Empty response");
      }
      
      return data.lyrics;
    },
    {
      retries: 3,
      minTimeout: 1000,
      maxTimeout: 5000,
      onFailedAttempt: (error) => {
        console.log(`Attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`);
      },
    }
  );
}
```

### Timeout Handling
```typescript
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Operation timed out")), timeoutMs)
  );
  
  return Promise.race([promise, timeoutPromise]);
}

// Usage
try {
  const result = await withTimeout(generateLyrics(prompt), 30000);
} catch (error) {
  if (error instanceof Error && error.message.includes("timed out")) {
    toast({
      title: "Timeout",
      description: "Generation took too long. Please try again.",
      variant: "destructive",
    });
  }
}
```

## Form Validation Errors

### Display Field Errors
```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const songSchema = z.object({
  title: z.string().min(1, "Title is required"),
  lyrics: z.string().min(10, "Lyrics must be at least 10 characters"),
});

type SongFormData = z.infer<typeof songSchema>;

export function SongForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<SongFormData>({
    resolver: zodResolver(songSchema),
  });
  
  const onSubmit = (data: SongFormData) => {
    // Handle submission
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input id="title" {...register("title")} />
        {errors.title && (
          <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
        )}
      </div>
      
      <div>
        <Label htmlFor="lyrics">Lyrics</Label>
        <Textarea id="lyrics" {...register("lyrics")} />
        {errors.lyrics && (
          <p className="text-sm text-red-500 mt-1">{errors.lyrics.message}</p>
        )}
      </div>
      
      <Button type="submit">Create Song</Button>
    </form>
  );
}
```

## Network Error Handling

### Detect Offline State
```typescript
import { useEffect, useState } from "react";

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);
  
  return isOnline;
}

// Usage
export function App() {
  const isOnline = useOnlineStatus();
  
  if (!isOnline) {
    return (
      <div className="bg-yellow-500 text-black p-4 text-center">
        You are offline. Some features may not work.
      </div>
    );
  }
  
  return <MainApp />;
}
```

### Fetch Error Handling
```typescript
async function fetchWithErrorHandling(url: string, options?: RequestInit) {
  try {
    const res = await fetch(url, options);
    
    // Handle specific status codes
    if (res.status === 401) {
      throw new Error("Please log in to continue");
    }
    
    if (res.status === 403) {
      throw new Error("You don't have permission to access this resource");
    }
    
    if (res.status === 404) {
      throw new Error("Resource not found");
    }
    
    if (res.status === 429) {
      throw new Error("Too many requests. Please try again later.");
    }
    
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: "Request failed" }));
      throw new Error(error.message || "Request failed");
    }
    
    return await res.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error("Network error. Please check your connection.");
    }
    throw error;
  }
}
```

## Anti-Patterns

**NEVER:**
- Swallow errors silently (always log or handle)
- Expose stack traces or internal details to users
- Use generic "An error occurred" without context
- Forget to handle loading and error states in UI
- Skip validation error messages
- Return 500 for user input errors (use 400)
- Log sensitive data in error messages

## Verification

After implementing error handling:
1. Test all error paths (network failures, validation errors, etc.)
2. Verify user-friendly error messages are shown
3. Check that errors are logged appropriately
4. Test error boundaries catch rendering errors
5. Verify retry logic works for transient failures
6. Check that sensitive data isn't exposed in errors
7. Test offline behavior
8. Verify toast notifications appear correctly
