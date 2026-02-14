import { db } from "./db";
import {
  songs,
  playlists,
  playlistSongs,
  songLikes,
  type Song,
  type InsertSong,
  type UpdateSongRequest,
  type Playlist,
  type InsertPlaylist,
} from "@shared/schema";
import { eq, desc, and, inArray, sql, getTableColumns } from "drizzle-orm";

export interface IStorage {
  // Song CRUD
  getSongs(userId: string): Promise<Song[]>;
  getPublicSongs(): Promise<Song[]>;
  getSong(id: number): Promise<Song | undefined>;
  createSong(song: InsertSong): Promise<Song>;
  updateSong(id: number, updates: UpdateSongRequest): Promise<Song>;
  deleteSong(id: number): Promise<void>;
  incrementPlayCount(id: number): Promise<number>;
  
  // Likes
  toggleLike(userId: string, songId: number): Promise<{ liked: boolean; likeCount: number }>;
  isLiked(userId: string, songId: number): Promise<boolean>;
  getLikedSongs(userId: string): Promise<Song[]>;
  getLikedSongIds(userId: string): Promise<number[]>;
  
  // Playlist CRUD
  getPlaylists(userId: string): Promise<Playlist[]>;
  getPlaylist(id: number): Promise<Playlist | undefined>;
  getPlaylistWithSongs(id: number): Promise<(Playlist & { songs: Song[] }) | undefined>;
  createPlaylist(playlist: InsertPlaylist): Promise<Playlist>;
  deletePlaylist(id: number): Promise<void>;
  addSongToPlaylist(playlistId: number, songId: number): Promise<void>;
  removeSongFromPlaylist(playlistId: number, songId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // === Songs ===
  async getSongs(userId: string): Promise<Song[]> {
    const result = await db.select(this.getSongListSelection())
      .from(songs)
      .where(eq(songs.userId, userId))
      .orderBy(desc(songs.createdAt));

    return result as unknown as Song[];
  }

  async getPublicSongs(): Promise<Song[]> {
    const result = await db.select(this.getSongListSelection())
      .from(songs)
      .where(eq(songs.isPublic, true))
      .orderBy(desc(songs.playCount))
      .limit(50);
    return result as unknown as Song[];
  }

  // Helper to standardize list view columns across all list endpoints
  private getSongListSelection() {
    // Exclude large/unused fields to optimize payload size
    // Using destructuring to exclude specific fields while keeping others for forward compatibility
    const {
      description,
      creationMode,
      hasVocal,
      vocalGender,
      recordingType,
      lyrics: _lyrics,
      ...rest
    } = getTableColumns(songs);

    return {
      ...rest,
      lyrics: sql<string>`substring(${songs.lyrics}, 1, 500)`,
    };
  }

  async getSong(id: number): Promise<Song | undefined> {
    const [song] = await db.select().from(songs).where(eq(songs.id, id));
    return song;
  }

  async createSong(insertSong: InsertSong): Promise<Song> {
    const [song] = await db.insert(songs).values(insertSong).returning();
    return song;
  }

  async updateSong(id: number, updates: UpdateSongRequest): Promise<Song> {
    const [updated] = await db.update(songs)
      .set(updates)
      .where(eq(songs.id, id))
      .returning();
    return updated;
  }

  async deleteSong(id: number): Promise<void> {
    await db.delete(songs).where(eq(songs.id, id));
  }

  async incrementPlayCount(id: number): Promise<number> {
    // Optimized: Atomic increment using SQL + RETURNING to avoid race conditions and extra round trip
    const [updatedSong] = await db.update(songs)
      .set({ playCount: sql`COALESCE(${songs.playCount}, 0) + 1` })
      .where(eq(songs.id, id))
      .returning({ playCount: songs.playCount });
    
    return updatedSong?.playCount || 0;
  }

  // === Likes ===
  async toggleLike(userId: string, songId: number): Promise<{ liked: boolean; likeCount: number }> {
    const [existingLike] = await db.select()
      .from(songLikes)
      .where(and(eq(songLikes.userId, userId), eq(songLikes.songId, songId)));

    const song = await this.getSong(songId);
    if (!song) return { liked: false, likeCount: 0 };

    if (existingLike) {
      // Unlike
      await db.delete(songLikes)
        .where(and(eq(songLikes.userId, userId), eq(songLikes.songId, songId)));
      const newCount = Math.max(0, (song.likeCount || 0) - 1);
      await db.update(songs).set({ likeCount: newCount }).where(eq(songs.id, songId));
      return { liked: false, likeCount: newCount };
    } else {
      // Like
      await db.insert(songLikes).values({ userId, songId });
      const newCount = (song.likeCount || 0) + 1;
      await db.update(songs).set({ likeCount: newCount }).where(eq(songs.id, songId));
      return { liked: true, likeCount: newCount };
    }
  }

  async isLiked(userId: string, songId: number): Promise<boolean> {
    const [like] = await db.select()
      .from(songLikes)
      .where(and(eq(songLikes.userId, userId), eq(songLikes.songId, songId)));
    return !!like;
  }

  async getLikedSongs(userId: string): Promise<Song[]> {
    // Optimized: Single query with innerJoin and proper ordering by liked time
    const result = await db.select(this.getSongListSelection())
      .from(songs)
      .innerJoin(songLikes, eq(songs.id, songLikes.songId))
      .where(eq(songLikes.userId, userId))
      .orderBy(desc(songLikes.createdAt));

    return result as unknown as Song[];
  }

  async getLikedSongIds(userId: string): Promise<number[]> {
    // Optimized: Only select songId from songLikes table without joining songs
    const result = await db.select({ songId: songLikes.songId })
      .from(songLikes)
      .where(eq(songLikes.userId, userId))
      .orderBy(desc(songLikes.createdAt));

    return result.map(r => r.songId);
  }

  // === Playlists ===
  async getPlaylists(userId: string): Promise<Playlist[]> {
    return await db.select()
      .from(playlists)
      .where(eq(playlists.userId, userId))
      .orderBy(desc(playlists.createdAt));
  }

  async getPlaylist(id: number): Promise<Playlist | undefined> {
    const [playlist] = await db.select().from(playlists).where(eq(playlists.id, id));
    return playlist;
  }

  async getPlaylistWithSongs(id: number): Promise<(Playlist & { songs: Song[] }) | undefined> {
    const playlist = await this.getPlaylist(id);
    if (!playlist) return undefined;

    const playlistSongRows = await db.select({ songId: playlistSongs.songId })
      .from(playlistSongs)
      .where(eq(playlistSongs.playlistId, id));

    const songIds = playlistSongRows.map(r => r.songId).filter(id => typeof id === 'number' && !isNaN(id));

    if (songIds.length === 0) {
      return { ...playlist, songs: [] };
    }

    const songsResult = await db.select()
      .from(songs)
      .where(inArray(songs.id, songIds));

    const songMap = new Map(songsResult.map(s => [s.id, s]));
    const songsList = songIds.map(id => songMap.get(id)).filter((s): s is Song => !!s);

    return { ...playlist, songs: songsList };
  }

  async createPlaylist(insertPlaylist: InsertPlaylist): Promise<Playlist> {
    const [playlist] = await db.insert(playlists).values(insertPlaylist).returning();
    return playlist;
  }

  async deletePlaylist(id: number): Promise<void> {
    await db.delete(playlists).where(eq(playlists.id, id));
  }

  async addSongToPlaylist(playlistId: number, songId: number): Promise<void> {
    // Check if already exists
    const [existing] = await db.select()
      .from(playlistSongs)
      .where(and(eq(playlistSongs.playlistId, playlistId), eq(playlistSongs.songId, songId)));
    
    if (!existing) {
      await db.insert(playlistSongs).values({ playlistId, songId });
    }
  }

  async removeSongFromPlaylist(playlistId: number, songId: number): Promise<void> {
    await db.delete(playlistSongs)
      .where(and(eq(playlistSongs.playlistId, playlistId), eq(playlistSongs.songId, songId)));
  }
}

export const storage = new DatabaseStorage();
