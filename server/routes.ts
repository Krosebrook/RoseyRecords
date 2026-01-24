import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { generateLyricsSchema } from "@shared/schema";
import { z } from "zod";
import { registerAuthRoutes, setupAuth, isAuthenticated } from "./replit_integrations/auth";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes } from "./replit_integrations/image";
import OpenAI from "openai";
import * as geminiService from "./services/gemini";
import * as replicateService from "./services/replicate";
import * as stableAudioService from "./services/stableAudio";
import * as elevenlabsService from "./services/elevenlabs";

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
    const song = await storage.getSong(Number(req.params.id));
    
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
  app.post(api.songs.create.path, isAuthenticated, async (req: any, res) => {
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
  app.delete(api.songs.delete.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const song = await storage.getSong(Number(req.params.id));
    
    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }
    
    if (song.userId !== userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    await storage.deleteSong(Number(req.params.id));
    res.status(204).send();
  });

  // POST /api/songs/:id/like
  app.post(api.songs.like.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const songId = Number(req.params.id);
    const song = await storage.getSong(songId);
    
    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }
    
    const result = await storage.toggleLike(userId, songId);
    res.json(result);
  });

  // POST /api/songs/:id/play
  app.post(api.songs.incrementPlay.path, async (req, res) => {
    const songId = Number(req.params.id);
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
    const playlist = await storage.getPlaylistWithSongs(Number(req.params.id));
    
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
  app.post(api.playlists.create.path, isAuthenticated, async (req: any, res) => {
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
  app.delete(api.playlists.delete.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const playlist = await storage.getPlaylist(Number(req.params.id));
    
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }
    
    if (playlist.userId !== userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    await storage.deletePlaylist(Number(req.params.id));
    res.status(204).send();
  });

  // POST /api/playlists/:id/songs
  app.post(api.playlists.addSong.path, isAuthenticated, async (req: any, res) => {
    try {
      const { songId } = api.playlists.addSong.input.parse(req.body);
      const playlistId = Number(req.params.id);
      
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
  app.delete(api.playlists.removeSong.path, isAuthenticated, async (req: any, res) => {
    const playlistId = Number(req.params.id);
    const songId = Number(req.params.songId);
    
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

  // ElevenLabs Routes
  app.get("/api/elevenlabs/voices", isAuthenticated, async (req, res) => {
    try {
      if (!elevenlabsService.isConfigured()) {
        return res.status(503).json({ message: "ElevenLabs is not configured" });
      }
      const voices = await elevenlabsService.getVoices();
      res.json({ voices });
    } catch (err) {
      console.error("Error fetching voices:", err);
      res.status(500).json({ message: "Failed to fetch voices" });
    }
  });

  app.post("/api/elevenlabs/text-to-speech", isAuthenticated, async (req, res) => {
    try {
      if (!elevenlabsService.isConfigured()) {
        return res.status(503).json({ message: "ElevenLabs is not configured" });
      }
      
      const { text, voiceId, modelId, stability, similarityBoost, style } = req.body;
      
      if (!text || typeof text !== "string" || text.trim().length === 0) {
        return res.status(400).json({ message: "Text is required" });
      }
      
      if (text.length > 5000) {
        return res.status(400).json({ message: "Text too long (max 5000 characters)" });
      }
      
      // Clamp values to valid ranges
      const clampedStability = typeof stability === "number" ? Math.max(0, Math.min(1, stability)) : undefined;
      const clampedSimilarity = typeof similarityBoost === "number" ? Math.max(0, Math.min(1, similarityBoost)) : undefined;
      const clampedStyle = typeof style === "number" ? Math.max(0, Math.min(1, style)) : undefined;
      
      const result = await elevenlabsService.textToSpeech({
        text: text.trim(),
        voiceId,
        modelId,
        stability: clampedStability,
        similarityBoost: clampedSimilarity,
        style: clampedStyle
      });
      
      res.json(result);
    } catch (err) {
      console.error("Error generating speech:", err);
      res.status(500).json({ message: "Failed to generate speech" });
    }
  });

  app.post("/api/elevenlabs/sound-effect", isAuthenticated, async (req, res) => {
    try {
      if (!elevenlabsService.isConfigured()) {
        return res.status(503).json({ message: "ElevenLabs is not configured" });
      }
      
      const { text, durationSeconds, promptInfluence } = req.body;
      
      if (!text || typeof text !== "string" || text.trim().length === 0) {
        return res.status(400).json({ message: "Text description is required" });
      }
      
      const result = await elevenlabsService.generateSoundEffect({
        text: text.trim(),
        durationSeconds,
        promptInfluence
      });
      
      res.json(result);
    } catch (err) {
      console.error("Error generating sound effect:", err);
      res.status(500).json({ message: "Failed to generate sound effect" });
    }
  });

  app.get("/api/elevenlabs/status", isAuthenticated, async (req, res) => {
    res.json({ configured: elevenlabsService.isConfigured() });
  });

  return httpServer;
}
