// CORRECT Song List Selection Implementation
// Merge from PR #35, #37, #40

// In server/storage.ts:

export class DatabaseStorage implements IStorage {
  // ... existing code ...

  // Shared helper for consistent list view selection
  private getSongListSelection() {
    const { description, lyrics: _lyrics, ...rest } = getTableColumns(songs);
    return {
      ...rest,
      lyrics: sql<string>`substring(${songs.lyrics}, 1, 500)`
    };
  }

  async getSongs(userId: number): Promise<Song[]> {
    const result = await db
      .select(this.getSongListSelection())
      .from(songs)
      .where(eq(songs.userId, userId))
      .orderBy(desc(songs.createdAt));
    
    return result as unknown as Song[];
  }

  async getPublicSongs(): Promise<Song[]> {
    const result = await db
      .select(this.getSongListSelection())
      .from(songs)
      .where(eq(songs.isPublic, true))
      .orderBy(desc(songs.playCount))
      .limit(50);
    
    return result as unknown as Song[];
  }

  async getLikedSongs(userId: number): Promise<Song[]> {
    const result = await db
      .select(this.getSongListSelection())
      .from(songs)
      .innerJoin(songLikes, eq(songs.id, songLikes.songId))
      .where(eq(songLikes.userId, userId))
      .orderBy(desc(songLikes.createdAt));
    
    return result as unknown as Song[];
  }

  async getLikedSongIds(userId: number): Promise<number[]> {
    const result = await db
      .select({ id: songLikes.songId })
      .from(songLikes)
      .where(eq(songLikes.userId, userId))
      .orderBy(desc(songLikes.createdAt));
    
    return result.map(row => row.id);
  }

  // ... rest of methods ...
}
