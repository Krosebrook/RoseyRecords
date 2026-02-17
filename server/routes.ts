import type { Express, Response } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { generateLyricsSchema } from "@shared/schema";
import { z } from "zod";
import { registerAuthRoutes, setupAuth, isAuthenticated } from "./replit_integrations/auth";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes } from "./replit_integrations/image";
import { aiRateLimiter, writeRateLimiter } from "./middleware";
import OpenAI from "openai";
import { verifyAudioFileSignature, sanitizeLog } from "./utils";

// Helper to validate numeric IDs from route params
function parseNumericId(value: string, res: Response): number | null {
  const id = Number(value);
  if (isNaN(id) || !Number.isInteger(id) || id < 1) {
    res.status(400).json({ message: 'Invalid ID parameter' });
    return null;
  }
  return id;
}
import * as geminiService from "./services/gemini";
import * as replicateService from "./services/replicate";
import * as stableAudioService from "./services/stableAudio";
import * as sunoService from "./services/suno";
import * as aceStepService from "./services/aceStep";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

// Random prompt ideas for inspiration
const PROMPT_IDEAS = [
  "A love song about meeting someone at a coffee shop on a rainy day",
  "An upbeat anthem about chasing your dreams despite the odds",
  "A melancholic ballad about leaving your hometown",
  "A party song about a wild night in the city",
  "A peaceful acoustic track about watching the sunset",
  "A motivational hip-hop song about rising from nothing",
  "A rock anthem about standing up for what you believe in",
  "A dreamy pop song about summer memories",
  "A country song about life on the open road",
  "An electronic track about dancing till dawn",
];

const RANDOM_LYRICS_SAMPLES = [
  `Verse 1:
Walking down these empty streets at night
City lights reflecting in my eyes
Every step I take brings me closer
To the dreams I've been chasing all my life

Chorus:
We're unstoppable, we're infinite
Nothing can hold us down tonight
We're unstoppable, we're infinite
Burning brighter than the stars so bright`,

  `Verse 1:
Raindrops on my window, thoughts of you
Every song reminds me what we had
Now I'm standing here without a clue
Missing every moment, good and bad

Chorus:
Come back to me, I need you here
These empty nights are filled with tears
Come back to me, don't disappear
I'm lost without you, crystal clear`,
];

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // 1. Setup Auth (Must be first)
  await setupAuth(app);
  registerAuthRoutes(app);

  // Add rate limiting to AI endpoints
  app.use("/api/generate", aiRateLimiter.middleware);
  app.use("/api/audio", aiRateLimiter.middleware);
  app.use("/api/stable-audio", aiRateLimiter.middleware);
  app.use("/api/bark", aiRateLimiter.middleware);
  app.use("/api/suno", aiRateLimiter.middleware);
  app.use("/api/ace-step", aiRateLimiter.middleware);

  // Protect integration routes (chat & image)
  // These routes were previously unprotected, allowing unauthenticated access to AI resources
  app.use("/api/conversations", isAuthenticated, aiRateLimiter.middleware);
  app.use("/api/generate-image", isAuthenticated, aiRateLimiter.middleware);

  // 2. Setup Integrations
  registerChatRoutes(app);
  registerImageRoutes(app);

  // ==========================================
  // SONG ROUTES
  // ==========================================
  
  // GET /api/songs - User's songs
  app.get(api.songs.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const userSongs = await storage.getSongs(userId);
    res.json(userSongs);
  });

  // GET /api/songs/public - Public songs for explore
  app.get(api.songs.listPublic.path, async (req, res) => {
    const publicSongs = await storage.getPublicSongs();
    res.json(publicSongs);
  });

  // GET /api/songs/:id
  app.get(api.songs.get.path, isAuthenticated, async (req: any, res) => {
    const songId = parseNumericId(req.params.id, res);
    if (songId === null) return;
    
    const song = await storage.getSong(songId);
    
    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }
    
    // Allow access if public or user owns it
    const userId = req.user.claims.sub;
    if (!song.isPublic && song.userId !== userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    res.json(song);
  });

  // POST /api/songs
  app.post(api.songs.create.path, isAuthenticated, writeRateLimiter.middleware, async (req: any, res) => {
    try {
      const input = api.songs.create.input.parse(req.body);
      
      const song = await storage.createSong({
        ...input,
        userId: req.user.claims.sub
      });
      res.status(201).json(song);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // DELETE /api/songs/:id
  app.delete(api.songs.delete.path, isAuthenticated, writeRateLimiter.middleware, async (req: any, res) => {
    const songId = parseNumericId(req.params.id, res);
    if (songId === null) return;
    
    const userId = req.user.claims.sub;
    const song = await storage.getSong(songId);
    
    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }
    
    if (song.userId !== userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    await storage.deleteSong(songId);
    res.status(204).send();
  });

  // POST /api/songs/:id/like
  app.post(api.songs.like.path, isAuthenticated, writeRateLimiter.middleware, async (req: any, res) => {
    const songId = parseNumericId(req.params.id, res);
    if (songId === null) return;
    
    const userId = req.user.claims.sub;
    const song = await storage.getSong(songId);
    
    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }
    
    const result = await storage.toggleLike(userId, songId);
    res.json(result);
  });

  // POST /api/songs/:id/play
  app.post(api.songs.incrementPlay.path, async (req, res) => {
    const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const songId = parseNumericId(idParam, res);
    if (songId === null) return;
    
    const song = await storage.getSong(songId);
    
    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }
    
    const playCount = await storage.incrementPlayCount(songId);
    res.json({ playCount });
  });

  // GET /api/songs/liked-ids - Get user's liked song IDs
  app.get('/api/songs/liked-ids', isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const likedSongs = await storage.getLikedSongs(userId);
    const ids = likedSongs.map(s => s.id);
    res.json({ likedIds: ids });
  });

  // GET /api/songs/liked - Get user's liked songs with full details
  app.get('/api/songs/liked', isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const likedSongs = await storage.getLikedSongs(userId);
    res.json(likedSongs);
  });

  // ==========================================
  // PLAYLIST ROUTES
  // ==========================================

  // GET /api/playlists
  app.get(api.playlists.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const userPlaylists = await storage.getPlaylists(userId);
    res.json(userPlaylists);
  });

  // GET /api/playlists/:id
  app.get(api.playlists.get.path, isAuthenticated, async (req: any, res) => {
    const playlistId = parseNumericId(req.params.id, res);
    if (playlistId === null) return;
    
    const playlist = await storage.getPlaylistWithSongs(playlistId);
    
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }
    
    const userId = req.user.claims.sub;
    if (!playlist.isPublic && playlist.userId !== userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    res.json(playlist);
  });

  // POST /api/playlists
  app.post(api.playlists.create.path, isAuthenticated, writeRateLimiter.middleware, async (req: any, res) => {
    try {
      const input = api.playlists.create.input.parse(req.body);
      
      const playlist = await storage.createPlaylist({
        ...input,
        userId: req.user.claims.sub
      });
      res.status(201).json(playlist);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // DELETE /api/playlists/:id
  app.delete(api.playlists.delete.path, isAuthenticated, writeRateLimiter.middleware, async (req: any, res) => {
    const playlistId = parseNumericId(req.params.id, res);
    if (playlistId === null) return;
    
    const userId = req.user.claims.sub;
    const playlist = await storage.getPlaylist(playlistId);
    
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }
    
    if (playlist.userId !== userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    await storage.deletePlaylist(playlistId);
    res.status(204).send();
  });

  // POST /api/playlists/:id/songs
  app.post(api.playlists.addSong.path, isAuthenticated, writeRateLimiter.middleware, async (req: any, res) => {
    try {
      const playlistId = parseNumericId(req.params.id, res);
      if (playlistId === null) return;
      
      const { songId } = api.playlists.addSong.input.parse(req.body);
      
      const userId = req.user.claims.sub;
      const playlist = await storage.getPlaylist(playlistId);
      
      if (!playlist) {
        return res.status(404).json({ message: 'Playlist not found' });
      }
      
      if (playlist.userId !== userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      await storage.addSongToPlaylist(playlistId, songId);
      res.status(201).json({ success: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // DELETE /api/playlists/:id/songs/:songId
  app.delete(api.playlists.removeSong.path, isAuthenticated, writeRateLimiter.middleware, async (req: any, res) => {
    const playlistId = parseNumericId(req.params.id, res);
    if (playlistId === null) return;
    
    const songId = parseNumericId(req.params.songId, res);
    if (songId === null) return;
    
    const userId = req.user.claims.sub;
    const playlist = await storage.getPlaylist(playlistId);
    
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }
    
    if (playlist.userId !== userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    await storage.removeSongFromPlaylist(playlistId, songId);
    res.status(204).send();
  });

  // ==========================================
  // AI SUGGEST (text assist for inputs)
  // ==========================================

  const aiSuggestSchema = z.object({
    field: z.enum(["audio-prompt", "song-title", "lyrics", "topic", "music-tags"]),
    context: z.string().max(500).optional(),
  });

  app.post("/api/generate/ai-suggest", isAuthenticated, async (req: any, res) => {
    try {
      const parsed = aiSuggestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid request: field must be one of audio-prompt, song-title, lyrics, topic" });
      }
      const { field, context } = parsed.data;

      const prompts: Record<string, string> = {
        "audio-prompt": "Generate a creative, detailed music description prompt for an AI music generator. Include genre, mood, instruments, tempo, and atmosphere. Keep it to 1-2 sentences. Be vivid and specific.",
        "song-title": `Suggest a catchy, creative song title${context ? ` that fits this theme: "${context}"` : ""}. Return only the title, no quotes or explanation.`,
        "lyrics": `Write creative, original song lyrics (2 verses and a chorus)${context ? ` about: "${context}"` : " about an evocative, interesting topic"}. Format with clear sections using [Verse], [Chorus], [Bridge] markers. Make them emotional and catchy.`,
        "topic": "Suggest a creative, interesting topic or theme for a song. Be specific and evocative. Return only the topic in 1-2 sentences, no quotes.",
        "music-tags": `Generate comma-separated music style tags for an AI music generator${context ? ` based on: "${context}"` : ""}. Include genre, sub-genre, instruments, BPM, mood, vocalist type (male/female), and production style. Example: "indie pop, acoustic guitar, piano, female vocalist, 110 BPM, dreamy, lo-fi production". Return only the tags, no explanation.`,
      };

      const systemPrompt = prompts[field] || "Generate a creative suggestion for a music-related text input. Keep it concise.";

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: context ? `Context: ${context}\n\nGenerate a suggestion.` : "Generate a suggestion." },
        ],
        max_tokens: 500,
        temperature: 0.9,
      });

      const suggestion = completion.choices[0]?.message?.content?.trim() || "";
      res.json({ suggestion });
    } catch (error: any) {
      console.error("AI suggest error:", error);
      res.status(500).json({ message: "Failed to generate suggestion" });
    }
  });

  // ==========================================
  // GENERATION ROUTES
  // ==========================================

  // POST /api/generate/lyrics - Generate lyrics with AI
  app.post(api.generate.lyrics.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = generateLyricsSchema.parse(req.body);
      
      const systemPrompt = `You are a professional songwriter and lyricist. Generate creative, original song lyrics based on the user's request. 
Format the output as a complete song with clear sections (Verse 1, Chorus, Verse 2, etc.).
Make the lyrics emotional, relatable, and catchy.
Also suggest a fitting title for the song.`;

      let userPrompt = `Write song lyrics about: ${input.prompt}`;
      if (input.genre) userPrompt += `\nGenre: ${input.genre}`;
      if (input.mood) userPrompt += `\nMood: ${input.mood}`;
      if (input.style) userPrompt += `\nStyle: ${input.style}`;
      userPrompt += `\n\nRespond in JSON format: { "title": "Song Title", "lyrics": "Full lyrics here" }`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 2048,
      });

      const content = response.choices[0]?.message?.content || '{}';
      const result = JSON.parse(content);
      
      res.json({
        title: result.title || "Untitled Song",
        lyrics: result.lyrics || "Could not generate lyrics"
      });
    } catch (err) {
      console.error("Error generating lyrics:", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Failed to generate lyrics" });
    }
  });

  // GET /api/generate/random-prompt
  app.get(api.generate.randomPrompt.path, async (req, res) => {
    const randomIndex = Math.floor(Math.random() * PROMPT_IDEAS.length);
    res.json({ prompt: PROMPT_IDEAS[randomIndex] });
  });

  // GET /api/generate/random-lyrics
  app.get(api.generate.randomLyrics.path, async (req, res) => {
    const randomIndex = Math.floor(Math.random() * RANDOM_LYRICS_SAMPLES.length);
    res.json({ lyrics: RANDOM_LYRICS_SAMPLES[randomIndex] });
  });

  // ==========================================
  // GEMINI-POWERED MUSIC THEORY ROUTES
  // ==========================================

  // POST /api/generate/song-concept - Generate full song concept with Gemini
  app.post('/api/generate/song-concept', isAuthenticated, async (req: any, res) => {
    try {
      const { prompt, genre, mood } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }
      
      const concept = await geminiService.generateSongConcept(prompt, genre, mood);
      res.json(concept);
    } catch (err) {
      console.error("Error generating song concept:", err);
      res.status(500).json({ message: "Failed to generate song concept" });
    }
  });

  // POST /api/generate/lyrics-gemini - Generate lyrics with Gemini
  app.post('/api/generate/lyrics-gemini', isAuthenticated, async (req: any, res) => {
    try {
      const { prompt, genre, mood } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }
      
      const result = await geminiService.generateLyricsOnly(prompt, genre, mood);
      res.json(result);
    } catch (err) {
      console.error("Error generating lyrics with Gemini:", err);
      res.status(500).json({ message: "Failed to generate lyrics" });
    }
  });

  // POST /api/music-theory/chord-progression - Suggest chord progression
  app.post('/api/music-theory/chord-progression', isAuthenticated, async (req: any, res) => {
    try {
      const { mood, key } = req.body;
      
      if (!mood || !key) {
        return res.status(400).json({ message: "Mood and key are required" });
      }
      
      const progression = await geminiService.suggestChordProgression(mood, key);
      res.json({ progression });
    } catch (err) {
      console.error("Error generating chord progression:", err);
      res.status(500).json({ message: "Failed to generate chord progression" });
    }
  });

  // POST /api/music-theory/reharmonize - Reharmonize existing progression
  app.post('/api/music-theory/reharmonize', isAuthenticated, async (req: any, res) => {
    try {
      const { progression, key } = req.body;
      
      if (!progression || !key) {
        return res.status(400).json({ message: "Progression and key are required" });
      }
      
      const reharmonized = await geminiService.reharmonizeProgression(progression, key);
      res.json({ progression: reharmonized });
    } catch (err) {
      console.error("Error reharmonizing:", err);
      res.status(500).json({ message: "Failed to reharmonize" });
    }
  });

  // POST /api/music-theory/lookup-scales - Identify scales from notes
  app.post('/api/music-theory/lookup-scales', isAuthenticated, async (req: any, res) => {
    try {
      const { notes } = req.body;
      
      if (!notes || !Array.isArray(notes) || notes.length < 2) {
        return res.status(400).json({ message: "At least 2 notes are required" });
      }
      
      const results = await geminiService.lookupScales(notes);
      res.json({ results });
    } catch (err) {
      console.error("Error looking up scales:", err);
      res.status(500).json({ message: "Failed to identify scales" });
    }
  });

  // POST /api/generate/production-tips - Get AI production tips
  app.post('/api/generate/production-tips', isAuthenticated, async (req: any, res) => {
    try {
      const { genre, mood, energy } = req.body;
      
      if (!genre || !mood) {
        return res.status(400).json({ message: "Genre and mood are required" });
      }
      
      const tip = await geminiService.getProductionTips(genre, mood, energy || "medium");
      res.json({ tip });
    } catch (err) {
      console.error("Error getting production tips:", err);
      res.status(500).json({ message: "Failed to get production tips" });
    }
  });

  // POST /api/generate/analyze-lyrics - Analyze lyrics for themes and suggestions
  app.post('/api/generate/analyze-lyrics', isAuthenticated, async (req: any, res) => {
    try {
      const { lyrics } = req.body;
      
      if (!lyrics) {
        return res.status(400).json({ message: "Lyrics are required" });
      }
      
      const analysis = await geminiService.analyzeLyrics(lyrics);
      res.json(analysis);
    } catch (err) {
      console.error("Error analyzing lyrics:", err);
      res.status(500).json({ message: "Failed to analyze lyrics" });
    }
  });

  // POST /api/generate/cover-art-prompt - Generate album art prompt
  app.post('/api/generate/cover-art-prompt', isAuthenticated, async (req: any, res) => {
    try {
      const { title, genre, mood } = req.body;
      
      if (!title || !genre || !mood) {
        return res.status(400).json({ message: "Title, genre, and mood are required" });
      }
      
      const prompt = await geminiService.generateCoverArtPrompt(title, genre, mood);
      res.json({ prompt });
    } catch (err) {
      console.error("Error generating cover art prompt:", err);
      res.status(500).json({ message: "Failed to generate prompt" });
    }
  });

  // ==========================================
  // REPLICATE AUDIO GENERATION ROUTES
  // ==========================================

  // POST /api/audio/generate - Generate music with Replicate
  app.post('/api/audio/generate', isAuthenticated, async (req: any, res) => {
    try {
      const { prompt, duration, genre, mood, instrumental } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }
      
      const result = await replicateService.generateMusic({
        prompt,
        duration: duration || 10,
        genre,
        mood,
        instrumental: instrumental || false
      });
      
      res.json(result);
    } catch (err) {
      console.error("Error generating music:", err);
      if (err instanceof Error && err.message.includes("REPLICATE_API_KEY")) {
        return res.status(503).json({ message: "Audio generation is not configured" });
      }
      res.status(500).json({ message: "Failed to generate music" });
    }
  });

  // POST /api/audio/generate/start - Start async music generation
  app.post('/api/audio/generate/start', isAuthenticated, async (req: any, res) => {
    try {
      const { prompt, duration, genre, mood, instrumental } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }
      
      const predictionId = await replicateService.startMusicGeneration({
        prompt,
        duration: duration || 10,
        genre,
        mood,
        instrumental: instrumental || false
      });
      
      res.json({ predictionId });
    } catch (err) {
      console.error("Error starting music generation:", err);
      if (err instanceof Error && err.message.includes("REPLICATE_API_KEY")) {
        return res.status(503).json({ message: "Audio generation is not configured" });
      }
      res.status(500).json({ message: "Failed to start music generation" });
    }
  });

  // GET /api/audio/status/:predictionId - Check prediction status
  app.get('/api/audio/status/:predictionId', isAuthenticated, async (req: any, res) => {
    try {
      const { predictionId } = req.params;
      
      if (!predictionId) {
        return res.status(400).json({ message: "Prediction ID is required" });
      }
      
      const status = await replicateService.checkPredictionStatus(predictionId);
      res.json(status);
    } catch (err) {
      console.error("Error checking prediction status:", err);
      res.status(500).json({ message: "Failed to check status" });
    }
  });

  // POST /api/audio/sound-effect - Generate a sound effect
  app.post('/api/audio/sound-effect', isAuthenticated, async (req: any, res) => {
    try {
      const { prompt, duration } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }
      
      const result = await replicateService.generateSoundEffect(prompt, duration || 5);
      res.json(result);
    } catch (err) {
      console.error("Error generating sound effect:", err);
      if (err instanceof Error && err.message.includes("REPLICATE_API_KEY")) {
        return res.status(503).json({ message: "Audio generation is not configured" });
      }
      res.status(500).json({ message: "Failed to generate sound effect" });
    }
  });

  // ==========================================
  // STABLE AUDIO ROUTES (Extended Duration)
  // ==========================================

  // POST /api/stable-audio/sample - Generate a 15s sample preview
  app.post('/api/stable-audio/sample', isAuthenticated, async (req: any, res) => {
    try {
      const { prompt, genre, mood, bpm, key, instrumental } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }
      
      const result = await stableAudioService.generateSample({
        prompt,
        genre,
        mood,
        bpm,
        key,
        instrumental: instrumental ?? true
      });
      
      res.json(result);
    } catch (err) {
      console.error("Error generating sample:", err);
      if (err instanceof Error && err.message.includes("FAL_KEY")) {
        return res.status(503).json({ message: "Stable Audio is not configured. Please add FAL_KEY." });
      }
      res.status(500).json({ message: "Failed to generate sample" });
    }
  });

  // POST /api/stable-audio/full - Generate full track (up to 3 minutes)
  app.post('/api/stable-audio/full', isAuthenticated, async (req: any, res) => {
    try {
      const { prompt, duration, genre, mood, bpm, key, instrumental, useV25 } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }
      
      let result;
      if (useV25 && duration > 47) {
        result = await stableAudioService.generateWithStableAudio25({
          prompt,
          duration: duration || 60,
          genre,
          mood,
          bpm,
          key,
          instrumental: instrumental ?? true
        });
      } else {
        result = await stableAudioService.generateFullTrack({
          prompt,
          duration: Math.min(duration || 47, 47),
          genre,
          mood,
          bpm,
          key,
          instrumental: instrumental ?? true
        });
      }
      
      res.json(result);
    } catch (err) {
      console.error("Error generating full track:", err);
      if (err instanceof Error && err.message.includes("FAL_KEY")) {
        return res.status(503).json({ message: "Stable Audio is not configured. Please add FAL_KEY." });
      }
      res.status(500).json({ message: "Failed to generate full track" });
    }
  });

  // POST /api/stable-audio/start - Start async generation for longer tracks
  app.post('/api/stable-audio/start', isAuthenticated, async (req: any, res) => {
    try {
      const { prompt, duration, genre, mood, bpm, key, instrumental } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }
      
      const requestId = await stableAudioService.startAsyncGeneration({
        prompt,
        duration: duration || 120,
        genre,
        mood,
        bpm,
        key,
        instrumental: instrumental ?? true
      });
      
      res.json({ requestId });
    } catch (err) {
      console.error("Error starting async generation:", err);
      if (err instanceof Error && err.message.includes("FAL_KEY")) {
        return res.status(503).json({ message: "Stable Audio is not configured. Please add FAL_KEY." });
      }
      res.status(500).json({ message: "Failed to start generation" });
    }
  });

  // GET /api/stable-audio/status/:requestId - Check async generation status
  app.get('/api/stable-audio/status/:requestId', isAuthenticated, async (req: any, res) => {
    try {
      const { requestId } = req.params;
      
      if (!requestId) {
        return res.status(400).json({ message: "Request ID is required" });
      }
      
      const status = await stableAudioService.checkAsyncStatus(requestId);
      res.json(status);
    } catch (err) {
      console.error("Error checking async status:", err);
      res.status(500).json({ message: "Failed to check status" });
    }
  });

  // POST /api/stable-audio/transform - Transform existing audio
  app.post('/api/stable-audio/transform', isAuthenticated, async (req: any, res) => {
    try {
      const { prompt, audioUrl, duration } = req.body;
      
      if (!prompt || !audioUrl) {
        return res.status(400).json({ message: "Prompt and audioUrl are required" });
      }
      
      const result = await stableAudioService.transformAudio({
        prompt,
        audioUrl,
        duration
      });
      
      res.json(result);
    } catch (err) {
      console.error("Error transforming audio:", err);
      if (err instanceof Error && err.message.includes("FAL_KEY")) {
        return res.status(503).json({ message: "Stable Audio is not configured. Please add FAL_KEY." });
      }
      res.status(500).json({ message: "Failed to transform audio" });
    }
  });

  // Bark singing vocals routes (AI singing via Replicate)
  app.get("/api/bark/voices", isAuthenticated, async (req, res) => {
    res.json({ voices: replicateService.BARK_VOICE_PRESETS });
  });

  app.post("/api/bark/generate", isAuthenticated, async (req, res) => {
    try {
      if (!process.env.REPLICATE_API_KEY) {
        return res.status(503).json({ message: "Replicate is not configured" });
      }
      
      const { lyrics, voicePreset, textTemp, waveformTemp } = req.body;
      
      if (!lyrics || typeof lyrics !== "string" || lyrics.trim().length === 0) {
        return res.status(400).json({ message: "Lyrics are required" });
      }
      
      if (lyrics.length > 2000) {
        return res.status(400).json({ message: "Lyrics too long (max 2000 characters for singing)" });
      }
      
      const result = await replicateService.generateSingingVocals({
        lyrics: lyrics.trim(),
        voicePreset,
        textTemp: typeof textTemp === "number" ? Math.max(0.1, Math.min(1.0, textTemp)) : undefined,
        waveformTemp: typeof waveformTemp === "number" ? Math.max(0.1, Math.min(1.0, waveformTemp)) : undefined
      });
      
      res.json(result);
    } catch (err) {
      console.error("Error generating singing vocals:", err);
      res.status(500).json({ message: "Failed to generate singing vocals" });
    }
  });

  app.post("/api/bark/generate/start", isAuthenticated, async (req, res) => {
    try {
      if (!process.env.REPLICATE_API_KEY) {
        return res.status(503).json({ message: "Replicate is not configured" });
      }
      
      const { lyrics, voicePreset, textTemp, waveformTemp } = req.body;
      
      if (!lyrics || typeof lyrics !== "string" || lyrics.trim().length === 0) {
        return res.status(400).json({ message: "Lyrics are required" });
      }
      
      const predictionId = await replicateService.startSingingVocals({
        lyrics: lyrics.trim(),
        voicePreset,
        textTemp: typeof textTemp === "number" ? Math.max(0.1, Math.min(1.0, textTemp)) : undefined,
        waveformTemp: typeof waveformTemp === "number" ? Math.max(0.1, Math.min(1.0, waveformTemp)) : undefined
      });
      
      res.json({ predictionId });
    } catch (err) {
      console.error("Error starting singing vocals:", err);
      res.status(500).json({ message: "Failed to start singing vocals" });
    }
  });

  app.get("/api/bark/status", isAuthenticated, async (req, res) => {
    res.json({ configured: !!process.env.REPLICATE_API_KEY });
  });

  // ==========================================
  // SUNO AI MUSIC GENERATION ROUTES
  // ==========================================
  
  // GET /api/suno/status - Check if Suno is configured
  app.get("/api/suno/status", isAuthenticated, async (req, res) => {
    res.json({ 
      configured: sunoService.isSunoConfigured(),
      provider: sunoService.getConfiguredProvider(),
      styles: sunoService.SUNO_STYLES,
      models: sunoService.SUNO_MODELS,
      pollingConfig: sunoService.POLLING_CONFIG
    });
  });

  // POST /api/suno/generate - Generate music with Suno (sync mode)
  app.post("/api/suno/generate", isAuthenticated, async (req, res) => {
    try {
      if (!sunoService.isSunoConfigured()) {
        return res.status(503).json({ 
          message: "Suno is not configured. Please add SUNO_API_KEY to use this feature." 
        });
      }
      
      const { prompt, lyrics, title, style, instrumental, model } = req.body;
      
      if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
        return res.status(400).json({ message: "Prompt is required" });
      }
      
      // Validate and sanitize params
      const validatedParams = sunoService.validateSunoParams({
        prompt: prompt.trim(),
        lyrics: lyrics?.trim(),
        title: title?.trim(),
        style,
        instrumental: instrumental ?? false,
        model: model || "chirp-bluejay"
      });
      
      const result = await sunoService.startSunoGeneration(validatedParams);
      
      res.json(result);
    } catch (err) {
      console.error("Error generating Suno music:", err);
      const message = err instanceof Error ? err.message : "Failed to generate music";
      res.status(500).json({ message });
    }
  });

  // POST /api/suno/generate/start - Start async music generation
  app.post("/api/suno/generate/start", isAuthenticated, async (req, res) => {
    try {
      if (!sunoService.isSunoConfigured()) {
        return res.status(503).json({ 
          message: "Suno is not configured. Please add SUNO_API_KEY to use this feature." 
        });
      }
      
      const { prompt, lyrics, title, style, instrumental, model } = req.body;
      
      if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
        return res.status(400).json({ message: "Prompt is required" });
      }
      
      // Validate and sanitize params
      const validatedParams = sunoService.validateSunoParams({
        prompt: prompt.trim(),
        lyrics: lyrics?.trim(),
        title: title?.trim(),
        style,
        instrumental: instrumental ?? false,
        model: model || "chirp-bluejay"
      });
      
      const result = await sunoService.startSunoGeneration(validatedParams);
      
      res.json(result);
    } catch (err) {
      console.error("Error starting Suno generation:", err);
      const message = err instanceof Error ? err.message : "Failed to start generation";
      res.status(500).json({ message });
    }
  });

  // GET /api/suno/status/:taskId - Check generation status
  app.get("/api/suno/status/:taskId", isAuthenticated, async (req, res) => {
    try {
      if (!sunoService.isSunoConfigured()) {
        return res.status(503).json({ 
          message: "Suno is not configured" 
        });
      }
      
      const taskId = Array.isArray(req.params.taskId) ? req.params.taskId[0] : req.params.taskId;
      
      if (!taskId) {
        return res.status(400).json({ message: "Task ID is required" });
      }
      
      const status = await sunoService.checkSunoStatus(taskId);
      res.json(status);
    } catch (err) {
      console.error("Error checking Suno status:", err);
      const message = err instanceof Error ? err.message : "Failed to check status";
      res.status(500).json({ message });
    }
  });

  // POST /api/suno/lyrics - Generate lyrics only
  app.post("/api/suno/lyrics", isAuthenticated, async (req, res) => {
    try {
      if (!sunoService.isSunoConfigured()) {
        return res.status(503).json({ 
          message: "Suno is not configured" 
        });
      }
      
      const { prompt } = req.body;
      
      if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
        return res.status(400).json({ message: "Prompt is required" });
      }
      
      const result = await sunoService.generateSunoLyrics(prompt.trim());
      res.json(result);
    } catch (err) {
      console.error("Error generating Suno lyrics:", err);
      const message = err instanceof Error ? err.message : "Failed to generate lyrics";
      res.status(500).json({ message });
    }
  });

  // GET /api/suno/user - Get user info and credits
  app.get("/api/suno/user", isAuthenticated, async (req: any, res) => {
    try {
      if (!sunoService.isSunoConfigured()) {
        return res.status(503).json({ 
          message: "Suno is not configured" 
        });
      }
      
      // Check for admin unlimited credits mode
      const adminUserIds = (process.env.ADMIN_USER_IDS || "").split(",").filter(Boolean);
      const currentUserId = req.user?.claims?.sub;
      const isAdmin = currentUserId && adminUserIds.includes(currentUserId);
      
      if (isAdmin) {
        return res.json({
          userId: currentUserId,
          credits: -1, // -1 indicates unlimited
          plan: "admin",
          isAdmin: true
        });
      }
      
      const userInfo = await sunoService.getSunoUserInfo();
      if (!userInfo) {
        return res.status(404).json({ message: "User info not available for this provider" });
      }
      
      res.json(userInfo);
    } catch (err) {
      console.error("Error fetching Suno user info:", err);
      const message = err instanceof Error ? err.message : "Failed to fetch user info";
      res.status(500).json({ message });
    }
  });

  // ==========================================
  // ACE-STEP 1.5 ROUTES (Full Songs with Vocals)
  // ==========================================

  app.get("/api/ace-step/config", isAuthenticated, async (_req, res) => {
    try {
      res.json(aceStepService.getConfig());
    } catch (err) {
      console.error("Error getting ACE-Step config:", err);
      res.status(500).json({ message: "Failed to get config" });
    }
  });

  app.post("/api/ace-step/generate", isAuthenticated, async (req: any, res) => {
    try {
      const { tags, lyrics, duration, seed } = req.body;

      if (!tags || typeof tags !== "string" || tags.trim().length === 0) {
        return res.status(400).json({ message: "Style tags are required" });
      }

      const predictionId = await aceStepService.startGeneration({
        tags: tags.trim(),
        lyrics: lyrics?.trim() || undefined,
        duration: duration || 60,
        seed: seed !== undefined ? seed : undefined,
      });

      res.json({ predictionId, status: "processing" });
    } catch (err) {
      console.error("Error starting ACE-Step generation:", err);
      if (err instanceof Error && err.message.includes("REPLICATE_API_KEY")) {
        return res.status(503).json({ message: "ACE-Step is not configured (missing REPLICATE_API_KEY)" });
      }
      res.status(500).json({ message: "Failed to start generation" });
    }
  });

  app.get("/api/ace-step/status/:predictionId", isAuthenticated, async (req, res) => {
    try {
      const predictionId = Array.isArray(req.params.predictionId)
        ? req.params.predictionId[0]
        : req.params.predictionId;

      if (!predictionId) {
        return res.status(400).json({ message: "Prediction ID is required" });
      }

      const status = await aceStepService.checkStatus(predictionId);
      res.json(status);
    } catch (err) {
      console.error("Error checking ACE-Step status:", err);
      res.status(500).json({ message: "Failed to check status" });
    }
  });

  // ==========================================
  // STYLE REFERENCE UPLOAD ROUTE
  // ==========================================

  const multer = (await import("multer")).default;
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const allowed = ["audio/mpeg", "audio/wav", "audio/mp3", "audio/x-wav", "audio/ogg", "audio/flac", "audio/mp4", "audio/aac"];
      if (allowed.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error("Only audio files are allowed (MP3, WAV, OGG, FLAC, AAC)"));
      }
    },
  });

  app.post("/api/audio/generate-with-reference", isAuthenticated, upload.single("referenceAudio"), async (req: any, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: "Reference audio file is required" });
      }

      // Verify file signature (magic bytes)
      if (!verifyAudioFileSignature(file.buffer)) {
        console.error("File signature validation failed:", sanitizeLog({
          userId: req.user.claims.sub,
          fileSize: file.size,
          mimeType: file.mimetype,
          originalName: file.originalname
        }));
        return res.status(400).json({ message: "Invalid file signature. Please upload a valid audio file." });
      }

      const { prompt, duration } = req.body;
      if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
        return res.status(400).json({ message: "Prompt is required" });
      }

      const base64 = file.buffer.toString("base64");
      const dataUrl = `data:${file.mimetype};base64,${base64}`;

      const predictionId = await replicateService.startMusicWithReference(
        dataUrl,
        prompt.trim(),
        duration ? parseInt(duration) : 15
      );

      res.json({ predictionId, status: "processing" });
    } catch (err) {
      console.error("Error generating with reference:", err);
      if (err instanceof Error && err.message.includes("REPLICATE_API_KEY")) {
        return res.status(503).json({ message: "Audio generation is not configured" });
      }
      const message = err instanceof Error ? err.message : "Failed to generate with reference";
      res.status(500).json({ message });
    }
  });

  return httpServer;
}
