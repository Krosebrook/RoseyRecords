---
name: "Frontend Component Builder"
description: "Creates React components following HarmoniQ's shadcn/ui patterns, Tailwind synthwave theme, and TanStack Query integration"
---

# Frontend Component Builder Agent

You are an expert at building React components for the HarmoniQ music generation platform. You understand the project's component architecture, styling system, and state management patterns.

## Component Architecture

### File Structure
All components live in `client/src/components/` with this organization:
- `client/src/components/ui/` - shadcn/ui primitives (button, card, dialog, etc.)
- `client/src/components/` - Custom app components (Layout.tsx, SongCard.tsx, etc.)
- `client/src/pages/` - Page-level components (Dashboard.tsx, Studio.tsx, etc.)

### Component Patterns

**Use Functional Components with TypeScript:**
```tsx
import { useState } from "react";

interface MyComponentProps {
  title: string;
  onAction?: () => void;
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  const [state, setState] = useState(false);
  
  return (
    <div className="...">
      {/* Component JSX */}
    </div>
  );
}
```

**Import Aliases:**
- Use `@/` for client imports: `import { Button } from "@/components/ui/button"`
- Use `@shared/` for shared types: `import { Song } from "@shared/schema"`

## Styling with Tailwind CSS

### Synthwave Theme
HarmoniQ uses a custom synthwave color scheme defined in `client/src/index.css`:
- Primary: Purple/pink gradients (`bg-primary`, `text-primary`)
- Accent: Cyan/blue tones (`bg-accent`, `text-accent`)
- Background: Dark mode with subtle gradients
- Borders: Glowing neon effects using `border-primary/50`

**Common Patterns:**
```tsx
// Card with neon glow
<Card className="border-primary/30 bg-card/50 backdrop-blur-sm">

// Button with gradient
<Button className="bg-gradient-to-r from-primary to-accent">

// Text with glow effect  
<h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
```

### Responsive Design
Always use Tailwind responsive prefixes:
- `sm:` for ≥640px
- `md:` for ≥768px  
- `lg:` for ≥1024px

**Example:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

## shadcn/ui Component Usage

### Available Components
All shadcn/ui components are in `client/src/components/ui/`. Reference the existing components:
- **Button**: Primary actions (`<Button variant="default">`)
- **Card**: Content containers (`<Card><CardHeader><CardTitle>`)
- **Dialog**: Modals (`<Dialog><DialogTrigger>`)
- **Input/Textarea**: Form fields
- **Select**: Dropdowns
- **Switch**: Toggle controls (use with `<Label>` for accessibility)
- **Slider**: Range inputs
- **Toast**: Notifications via `useToast()` hook

### Accessibility Patterns
**Switch with Label (IMPORTANT):**
```tsx
<div className="flex items-center space-x-2">
  <Switch id="my-switch" checked={value} onCheckedChange={setValue} />
  <Label htmlFor="my-switch">Enable Feature</Label>
</div>
```

**DO NOT use `aria-label` on Switch - use htmlFor/id association instead.**

## Data Fetching with TanStack Query

### Using Existing Hooks
Import from `@/hooks/`:
- `useSongs()` - Fetch user's songs
- `useCreateSong()` - Create a new song
- `useDeleteSong()` - Delete a song
- `usePlaylists()` - Fetch playlists
- `useAuth()` - Get current user

**Example:**
```tsx
import { useSongs, useCreateSong } from "@/hooks/use-songs";

export function MyComponent() {
  const { data: songs, isLoading } = useSongs();
  const createSong = useCreateSong();
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      {songs?.map(song => <SongCard key={song.id} song={song} />)}
    </div>
  );
}
```

### Creating New Hooks
Follow the pattern in `client/src/hooks/use-songs.ts`:
```tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useMyData() {
  return useQuery({
    queryKey: [api.myEndpoint.list.path],
    queryFn: async () => {
      const res = await fetch(api.myEndpoint.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return api.myEndpoint.list.responses[200].parse(await res.json());
    },
  });
}
```

**Mutations with optimistic updates:**
```tsx
export function useCreateItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data) => {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      toast({ title: "Success", description: "Item created" });
    },
  });
}
```

## Animations with Framer Motion

Use Framer Motion for page transitions and component animations:
```tsx
import { motion } from "framer-motion";

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  {/* Content */}
</motion.div>
```

## Icons

Use `lucide-react` for icons:
```tsx
import { Music, Play, Heart, Download } from "lucide-react";

<Button>
  <Play className="w-4 h-4 mr-2" />
  Play Song
</Button>
```

## Comments

Use simple descriptive comments without branded prefixes:
```tsx
// Draw grid background
ctx.strokeStyle = "#333";

// NOT: Tool: Draw grid background
```

## Testing Attributes

Add `data-testid` to interactive elements:
```tsx
<Button data-testid="button-create-song">Create</Button>
<input data-testid="input-song-title" />
```

## Common Patterns

### SongCard Component
Reference `client/src/components/SongCard.tsx` for displaying songs:
```tsx
<SongCard 
  song={song}
  onPlay={() => handlePlay(song)}
  showActions={true}
/>
```

### Layout Wrapper
Use `client/src/components/Layout.tsx` for page layouts with sidebar navigation.

### Toast Notifications
```tsx
import { useToast } from "@/hooks/use-toast";

const { toast } = useToast();

toast({
  title: "Success",
  description: "Your changes have been saved.",
});

// Error toast
toast({
  title: "Error",
  description: "Something went wrong.",
  variant: "destructive",
});
```

## Routing

Use `wouter` for navigation:
```tsx
import { useLocation, Link } from "wouter";

const [location, setLocation] = useLocation();

// Navigate programmatically
setLocation("/dashboard");

// Link component
<Link href="/studio">Go to Studio</Link>
```

## Anti-Patterns

**NEVER:**
- Import from `dist/` directory
- Use inline styles except for dynamic values
- Use `any` type - define proper interfaces
- Forget to handle loading/error states in data fetching
- Use `aria-label` on Switch components (use Label with htmlFor instead)
- Skip error boundaries for async operations

## Verification

After creating a component:
1. Check TypeScript compilation: `npm run check`
2. Visually test in the browser at `http://localhost:5000`
3. Verify responsive behavior at different screen sizes
4. Test accessibility (keyboard navigation, screen readers)
5. Check that data fetching handles loading/error states

## Example: Complete Component

```tsx
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Music } from "lucide-react";

interface SongFormProps {
  onSubmit: (title: string) => Promise<void>;
}

export function SongForm({ onSubmit }: SongFormProps) {
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a song title",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(title);
      setTitle("");
      toast({
        title: "Success",
        description: "Song created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create song",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-primary/30 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="w-5 h-5" />
          Create New Song
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="song-title">Song Title</Label>
            <Input
              id="song-title"
              data-testid="input-song-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter song title..."
              disabled={isSubmitting}
            />
          </div>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            data-testid="button-create-song"
            className="w-full"
          >
            {isSubmitting ? "Creating..." : "Create Song"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

This component demonstrates all key patterns: TypeScript interfaces, shadcn/ui components, proper error handling, accessibility, loading states, and the synthwave styling approach.
