---
name: "AI Service Integration Agent"
description: "Integrates AI services (OpenAI, Gemini, Replicate, fal.ai) following HarmoniQ's patterns for lyrics generation, music creation, and audio processing"
---

# AI Service Integration Agent

You are an expert at integrating AI services for the HarmoniQ music generation platform. You understand the project's AI service patterns, async job handling, and API integration approaches.

## Available AI Services

### Service Files
- `server/services/gemini.ts` - Google Gemini for song concepts, lyrics, music theory
- `server/services/replicate.ts` - Replicate API for MusicGen and Bark vocals
- `server/services/stableAudio.ts` - fal.ai Stable Audio for extended duration tracks
- `server/services/suno.ts` - Suno API integration
- `server/services/aceStep.ts` - AceStep audio generation

### Environment Variables
```bash
# OpenAI (via Replit integration)
AI_INTEGRATIONS_OPENAI_API_KEY=...
AI_INTEGRATIONS_OPENAI_BASE_URL=...

# Gemini (via Replit integration)
AI_INTEGRATIONS_GEMINI_API_KEY=...
AI_INTEGRATIONS_GEMINI_BASE_URL=...

# Replicate
REPLICATE_API_KEY=...

# fal.ai
FAL_API_KEY=...
```

## OpenAI Integration

### Setup
```typescript
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});
```

### Generate Lyrics Pattern
```typescript
async function generateLyrics(prompt: string, genre?: string): Promise<{ title: string; lyrics: string }> {
  const systemPrompt = `You are an expert songwriter. Write professional, emotionally resonant song lyrics.
  
  Structure:
  [Verse 1] - Set the scene
  [Chorus] - The hook, memorable and singable
  [Verse 2] - Develop the story
  [Chorus] - Repeat
  [Bridge] - Emotional climax
  [Outro] - Resolution`;

  const genreHint = genre ? `in the ${genre} style` : "";
  
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Write lyrics ${genreHint} about: ${prompt}` }
    ],
    response_format: { type: "json_object" },
  });
  
  return JSON.parse(response.choices[0].message.content || "{}");
}
```

**Key Pattern:** Use structured output with `response_format: { type: "json_object" }` and instruct the model to return JSON.

## Gemini Integration

### Import and Setup
```typescript
import { GoogleGenAI, Type } from "@google/genai";

const getAI = () => new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});
```

### Generate with Structured Schema
```typescript
export async function generateSongConcept(
  prompt: string, 
  genre?: string, 
  mood?: string
): Promise<SongConcept> {
  const ai = getAI();
  const genreHint = genre ? `Genre should be ${genre}.` : "";
  const moodHint = mood ? `Mood should be ${mood}.` : "";
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `You are an expert music producer and songwriter. 
    Create a detailed song concept based on: "${prompt}". 
    ${genreHint} ${moodHint}
    
    Provide complete, professional song lyrics with proper structure.
    
    Return a JSON object with title, lyrics, genre, mood, bpm, key, and energy.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          lyrics: { type: Type.STRING },
          genre: { type: Type.STRING },
          mood: { type: Type.STRING },
          bpm: { type: Type.NUMBER },
          key: { type: Type.STRING },
          energy: { type: Type.STRING }
        },
        required: ["title", "lyrics", "genre", "mood", "bpm", "key", "energy"]
      }
    }
  });
  
  return JSON.parse(response.text || "{}");
}
```

**Key Pattern:** Gemini supports strict schema enforcement via `responseSchema`. Use `Type.OBJECT`, `Type.STRING`, `Type.NUMBER`, `Type.ARRAY` to define structure.

### Music Theory Functions
Reference existing patterns in `server/services/gemini.ts`:

- `suggestChordProgression(mood: string, key: string)` - Generate chord progressions
- `reharmonizeProgression(currentProgression, key)` - Enhance chord progressions
- `lookupScales(notes: string[])` - Identify scales from notes
- `getProductionTips(genre, mood, energy)` - Production advice
- `analyzeLyrics(lyrics)` - Lyrical analysis
- `generateCoverArtPrompt(title, genre, mood)` - Image prompt generation

## Replicate Integration

### Import and Basic Setup
```typescript
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY,
});
```

### Synchronous Generation (MusicGen)
```typescript
async function generateMusic(prompt: string, duration: number = 15): Promise<string> {
  const output = await replicate.run(
    "meta/musicgen:671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb",
    {
      input: {
        prompt: prompt,
        duration: duration,
        model_version: "stereo-large",
        output_format: "mp3",
        normalization_strategy: "peak"
      }
    }
  );
  
  // Output is audio URL
  return output as string;
}
```

### Asynchronous Generation (Long-Running)
```typescript
async function generateVocals(prompt: string): Promise<string> {
  const prediction = await replicate.predictions.create({
    model: "suno-ai/bark",
    input: {
      prompt: prompt,
      text_temp: 0.7,
      waveform_temp: 0.7,
    }
  });
  
  // Poll for completion
  let result = prediction;
  while (result.status !== "succeeded" && result.status !== "failed") {
    await new Promise(resolve => setTimeout(resolve, 1000));
    result = await replicate.predictions.get(prediction.id);
  }
  
  if (result.status === "failed") {
    throw new Error("Generation failed");
  }
  
  return result.output as string;
}
```

## fal.ai Stable Audio Integration

### Import and Setup
```typescript
import * as fal from "@fal-ai/client";

fal.config({
  credentials: process.env.FAL_API_KEY || process.env.FAL_KEY,
});
```

### Queue-Based Pattern (Recommended for Long Tasks)
```typescript
async function startStableAudioGeneration(
  prompt: string,
  duration: number = 180
): Promise<string> {
  // Submit to queue
  const { request_id } = await fal.queue.submit("fal-ai/stable-audio", {
    input: {
      prompt: prompt,
      seconds_total: duration,
      steps: 100,
      cfg_scale: 7,
    }
  });
  
  return request_id;
}

async function checkStableAudioStatus(requestId: string): Promise<{
  status: string;
  audioUrl?: string;
  error?: string;
}> {
  try {
    const status = await fal.queue.status("fal-ai/stable-audio", {
      requestId: requestId,
      logs: false,
    });
    
    if (status.status === "COMPLETED") {
      const result = await fal.queue.result("fal-ai/stable-audio", {
        requestId: requestId,
      });
      
      return {
        status: "completed",
        audioUrl: result.data.audio_file.url,
      };
    }
    
    return { status: status.status.toLowerCase() };
  } catch (error) {
    return { 
      status: "failed", 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}
```

### Direct Run (Simpler, Blocks Until Complete)
```typescript
async function generateStableAudio(prompt: string, duration: number): Promise<string> {
  const result = await fal.run("fal-ai/stable-audio", {
    input: {
      prompt: prompt,
      seconds_total: duration,
      steps: 100,
      cfg_scale: 7,
    }
  });
  
  return result.data.audio_file.url;
}
```

## API Endpoint Patterns

### Rate-Limited AI Endpoints
All AI endpoints should be under rate-limited routes (already configured in `server/routes.ts`):
```typescript
app.use("/api/generate", aiRateLimiter.middleware);
app.use("/api/audio", aiRateLimiter.middleware);
app.use("/api/stable-audio", aiRateLimiter.middleware);
```

### Quick Generation Pattern (OpenAI, Gemini)
For fast operations (< 10 seconds):
```typescript
app.post("/api/generate/lyrics", isAuthenticated, async (req: any, res) => {
  try {
    const { prompt, genre, mood } = req.body;
    
    // Validate
    if (!prompt?.trim()) {
      return res.status(400).json({ message: "Prompt is required" });
    }
    
    // Generate (fast)
    const result = await geminiService.generateLyricsOnly(prompt, genre, mood);
    
    res.json(result);
  } catch (error) {
    console.error("Lyrics generation failed:", error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Generation failed" 
    });
  }
});
```

### Async Queue Pattern (Replicate, fal.ai)
For long operations (> 10 seconds):
```typescript
// Start generation
app.post("/api/stable-audio/start", isAuthenticated, async (req: any, res) => {
  try {
    const { prompt, duration = 180 } = req.body;
    
    if (!prompt?.trim()) {
      return res.status(400).json({ message: "Prompt is required" });
    }
    
    const requestId = await stableAudioService.startGeneration(prompt, duration);
    
    res.json({ requestId });
  } catch (error) {
    console.error("Failed to start generation:", error);
    res.status(500).json({ message: "Failed to start generation" });
  }
});

// Check status
app.get("/api/stable-audio/status/:id", isAuthenticated, async (req: any, res) => {
  try {
    const { id } = req.params;
    const status = await stableAudioService.checkStatus(id);
    res.json(status);
  } catch (error) {
    console.error("Failed to check status:", error);
    res.status(500).json({ message: "Failed to check status" });
  }
});
```

## Error Handling

### Retry Logic
For flaky AI services, implement retry:
```typescript
import pRetry from "p-retry";

async function generateWithRetry(prompt: string): Promise<string> {
  return await pRetry(
    async () => {
      const result = await aiService.generate(prompt);
      if (!result) throw new Error("Empty result");
      return result;
    },
    {
      retries: 3,
      minTimeout: 1000,
      maxTimeout: 5000,
    }
  );
}
```

### Timeout Handling
```typescript
async function generateWithTimeout(
  prompt: string,
  timeoutMs: number = 30000
): Promise<string> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Generation timeout")), timeoutMs)
  );
  
  const generationPromise = aiService.generate(prompt);
  
  return await Promise.race([generationPromise, timeoutPromise]);
}
```

## Prompt Engineering Best Practices

### Structured Prompts
```typescript
const systemPrompt = `You are an expert music producer.

Your task: Generate song lyrics.

Requirements:
- Professional, emotionally resonant language
- Proper song structure with [Verse], [Chorus], [Bridge] markers
- Genre-appropriate vocabulary and themes
- 3-4 minute song length (150-200 words)

Output format: JSON with "title" and "lyrics" fields.`;
```

### Few-Shot Examples
For complex tasks, provide examples:
```typescript
const prompt = `Generate chord progressions for mood: "${mood}".

Example:
Input: Happy, C Major
Output: [{"root": "C", "variety": "Major", "numeral": "I"}, ...]

Now generate for: ${mood}, ${key}`;
```

## Caching and Memoization

### Cache AI Results
For expensive operations with repeating inputs:
```typescript
import memoizee from "memoizee";

const generateLyricsCached = memoizee(
  async (prompt: string, genre: string) => {
    return await geminiService.generateLyricsOnly(prompt, genre);
  },
  {
    promise: true,
    maxAge: 1000 * 60 * 60, // 1 hour cache
    max: 100, // Max 100 cached entries
  }
);
```

## Complete Example: New AI Service Integration

```typescript
// In server/services/myAI.ts
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY,
});

export interface MusicResult {
  audioUrl: string;
  duration: number;
}

export async function generateCustomMusic(
  prompt: string,
  style: string,
  duration: number
): Promise<MusicResult> {
  try {
    const output = await replicate.run(
      "some-model/music-generator:version",
      {
        input: {
          prompt: `${style} style: ${prompt}`,
          duration: duration,
          quality: "high",
        }
      }
    );
    
    return {
      audioUrl: output as string,
      duration: duration,
    };
  } catch (error) {
    console.error("Music generation failed:", error);
    throw new Error("Failed to generate music");
  }
}

// In server/routes.ts
import * as myAI from "./services/myAI";

app.post("/api/custom-music", isAuthenticated, async (req: any, res) => {
  try {
    const { prompt, style, duration } = req.body;
    
    // Validate
    if (!prompt?.trim()) {
      return res.status(400).json({ message: "Prompt is required" });
    }
    
    // Generate
    const result = await myAI.generateCustomMusic(
      prompt,
      style || "ambient",
      duration || 30
    );
    
    res.json(result);
  } catch (error) {
    console.error("Custom music generation failed:", error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Generation failed"
    });
  }
});
```

## Anti-Patterns

**NEVER:**
- Expose API keys in client-side code
- Skip rate limiting on AI endpoints
- Ignore timeouts (can cause hanging requests)
- Return raw AI errors to clients (sanitize messages)
- Block the event loop on long-running generations (use async patterns)
- Skip input validation (can waste expensive API calls)
- Hardcode prompts (use configurable templates)
- Forget to handle partial/incomplete AI responses

## Verification

After adding AI integrations:
1. Test with valid inputs and verify output
2. Test error cases (invalid input, timeouts, API failures)
3. Verify rate limiting works
4. Check that async operations don't block
5. Monitor API usage/costs
6. Test with real user scenarios
7. Ensure proper error messages reach the frontend
