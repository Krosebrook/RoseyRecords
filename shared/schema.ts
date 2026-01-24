import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Import models from integrations
export * from "./models/auth";
export * from "./models/chat";

import { users } from "./models/auth";

// === MOOD OPTIONS ===
export const MOODS = [
  "Happy", "Confident", "Motivational", "Melancholic", "Productivity", "Uplifting",
  "Dreamy", "Chill", "Romantic", "Hype", "Joyful", "Dark", "Passionate", "Spiritual",
  "Whimsical", "Depressive", "Eclectic", "Emotional", "Hard", "Lyrical", "Magical",
  "Minimal", "Party", "Weird", "Soft", "Ethnic"
] as const;

// === GENRE OPTIONS ===
export const GENRES = [
  "Random", "Blues", "Funk", "Rap", "Pop", "Classical", "Jazz", "Metal", "Rock",
  "EDM", "K-pop", "Indie", "Hip-Hop", "Country", "Cinematic", "Latin", "Reggae",
  "Dance", "Downtempo", "R&B", "Trance", "House", "Jungle", "Soul", "Celtic",
  "Lullaby", "Ambient", "Techno", "Dream Pop", "Trap", "Bachata", "Lo-Fi",
  "City Pop", "Disco", "Shoegaze", "Synthwave", "Rockabilly", "Amapiano",
  "Synthpop", "Afrobeats", "Swing", "Americana", "Tango", "Ska", "Dubstep"
] as const;

// === CREATION MODES ===
export const CREATION_MODES = ["description", "lyrics", "image"] as const;

// === VOCAL GENDERS ===
export const VOCAL_GENDERS = ["male", "female", "random"] as const;

// === RECORDING TYPES ===
export const RECORDING_TYPES = ["studio", "live"] as const;

// === TABLE DEFINITIONS ===
export const songs = pgTable("songs", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  lyrics: text("lyrics").notNull(),
  description: text("description"), // Original prompt/description
  genre: text("genre"),
  mood: text("mood"),
  creationMode: text("creation_mode").default("description"), // description, lyrics, image
  hasVocal: boolean("has_vocal").default(true),
  vocalGender: text("vocal_gender"), // male, female, random
  recordingType: text("recording_type").default("studio"), // studio, live
  audioUrl: text("audio_url"),
  imageUrl: text("image_url"), // Album cover or source image
  isPublic: boolean("is_public").default(false),
  playCount: integer("play_count").default(0),
  likeCount: integer("like_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const playlists = pgTable("playlists", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const playlistSongs = pgTable("playlist_songs", {
  id: serial("id").primaryKey(),
  playlistId: integer("playlist_id").notNull().references(() => playlists.id, { onDelete: "cascade" }),
  songId: integer("song_id").notNull().references(() => songs.id, { onDelete: "cascade" }),
  addedAt: timestamp("added_at").defaultNow(),
});

export const songLikes = pgTable("song_likes", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  songId: integer("song_id").notNull().references(() => songs.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===
export const songsRelations = relations(songs, ({ one, many }) => ({
  user: one(users, {
    fields: [songs.userId],
    references: [users.id],
  }),
  playlistSongs: many(playlistSongs),
  likes: many(songLikes),
}));

export const playlistsRelations = relations(playlists, ({ one, many }) => ({
  user: one(users, {
    fields: [playlists.userId],
    references: [users.id],
  }),
  playlistSongs: many(playlistSongs),
}));

export const playlistSongsRelations = relations(playlistSongs, ({ one }) => ({
  playlist: one(playlists, {
    fields: [playlistSongs.playlistId],
    references: [playlists.id],
  }),
  song: one(songs, {
    fields: [playlistSongs.songId],
    references: [songs.id],
  }),
}));

export const songLikesRelations = relations(songLikes, ({ one }) => ({
  user: one(users, {
    fields: [songLikes.userId],
    references: [users.id],
  }),
  song: one(songs, {
    fields: [songLikes.songId],
    references: [songs.id],
  }),
}));

// === BASE SCHEMAS ===
export const insertSongSchema = createInsertSchema(songs).omit({ 
  id: true, 
  createdAt: true,
  playCount: true,
  likeCount: true,
});

export const insertPlaylistSchema = createInsertSchema(playlists).omit({
  id: true,
  createdAt: true,
});

// === EXPLICIT API CONTRACT TYPES ===
export type Song = typeof songs.$inferSelect;
export type InsertSong = z.infer<typeof insertSongSchema>;
export type Playlist = typeof playlists.$inferSelect;
export type InsertPlaylist = z.infer<typeof insertPlaylistSchema>;
export type PlaylistSong = typeof playlistSongs.$inferSelect;
export type SongLike = typeof songLikes.$inferSelect;

// Request types
export type CreateSongRequest = Omit<InsertSong, "userId">;
export type UpdateSongRequest = Partial<CreateSongRequest>;
export type CreatePlaylistRequest = Omit<InsertPlaylist, "userId">;

// Generation request type
export const generateLyricsSchema = z.object({
  prompt: z.string().min(1),
  genre: z.string().optional(),
  mood: z.string().optional(),
  style: z.string().optional(),
});
export type GenerateLyricsRequest = z.infer<typeof generateLyricsSchema>;

// Response types
export type SongResponse = Song;
export type SongsListResponse = Song[];
export type PlaylistResponse = Playlist & { songs?: Song[] };
