import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { registerAuthRoutes, setupAuth, isAuthenticated } from "./replit_integrations/auth";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes } from "./replit_integrations/image";

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

  // 3. Songs Routes
  
  // GET /api/songs
  app.get(api.songs.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const songs = await storage.getSongs(userId);
    res.json(songs);
  });

  // GET /api/songs/:id
  app.get(api.songs.get.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const song = await storage.getSong(Number(req.params.id));
    
    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }
    
    // Ensure user owns the song
    if (song.userId !== userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    res.json(song);
  });

  // POST /api/songs
  app.post(api.songs.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.songs.create.input.parse({
        ...req.body,
        userId: req.user.claims.sub // Force userId from session
      });
      
      const song = await storage.createSong(input);
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

  return httpServer;
}
