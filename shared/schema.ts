import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Import models from integrations
export * from "./models/auth";
export * from "./models/chat";

import { users } from "./models/auth";

// === TABLE DEFINITIONS ===
export const songs = pgTable("songs", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  lyrics: text("lyrics").notNull(),
  genre: text("genre"),
  mood: text("mood"),
  audioUrl: text("audio_url"), // For generated audio if available
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===
export const songsRelations = relations(songs, ({ one }) => ({
  user: one(users, {
    fields: [songs.userId],
    references: [users.id],
  }),
}));

// === BASE SCHEMAS ===
export const insertSongSchema = createInsertSchema(songs).omit({ 
  id: true, 
  createdAt: true,
  userId: true // Set by backend from session
});

// === EXPLICIT API CONTRACT TYPES ===
export type Song = typeof songs.$inferSelect;
export type InsertSong = z.infer<typeof insertSongSchema>;

// Request types
export type CreateSongRequest = InsertSong;
export type UpdateSongRequest = Partial<InsertSong>;

// Response types
export type SongResponse = Song;
export type SongsListResponse = Song[];
