import { z } from 'zod';
import { insertSongSchema, insertPlaylistSchema, generateLyricsSchema, songs, playlists } from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  songs: {
    list: {
      method: 'GET' as const,
      path: '/api/songs',
      responses: {
        200: z.array(z.custom<typeof songs.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    listPublic: {
      method: 'GET' as const,
      path: '/api/songs/public',
      responses: {
        200: z.array(z.custom<typeof songs.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/songs/:id',
      responses: {
        200: z.custom<typeof songs.$inferSelect>(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/songs',
      input: insertSongSchema.omit({ userId: true }),
      responses: {
        201: z.custom<typeof songs.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/songs/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    like: {
      method: 'POST' as const,
      path: '/api/songs/:id/like',
      responses: {
        200: z.object({ liked: z.boolean(), likeCount: z.number() }),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    incrementPlay: {
      method: 'POST' as const,
      path: '/api/songs/:id/play',
      responses: {
        200: z.object({ playCount: z.number() }),
        404: errorSchemas.notFound,
      },
    },
  },
  playlists: {
    list: {
      method: 'GET' as const,
      path: '/api/playlists',
      responses: {
        200: z.array(z.custom<typeof playlists.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/playlists/:id',
      responses: {
        200: z.custom<typeof playlists.$inferSelect>(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/playlists',
      input: insertPlaylistSchema.omit({ userId: true }),
      responses: {
        201: z.custom<typeof playlists.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/playlists/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    addSong: {
      method: 'POST' as const,
      path: '/api/playlists/:id/songs',
      input: z.object({ songId: z.number() }),
      responses: {
        201: z.object({ success: z.boolean() }),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    removeSong: {
      method: 'DELETE' as const,
      path: '/api/playlists/:id/songs/:songId',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
  },
  generate: {
    lyrics: {
      method: 'POST' as const,
      path: '/api/generate/lyrics',
      input: generateLyricsSchema,
      responses: {
        200: z.object({ lyrics: z.string(), title: z.string() }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    randomPrompt: {
      method: 'GET' as const,
      path: '/api/generate/random-prompt',
      responses: {
        200: z.object({ prompt: z.string() }),
      },
    },
    randomLyrics: {
      method: 'GET' as const,
      path: '/api/generate/random-lyrics',
      responses: {
        200: z.object({ lyrics: z.string() }),
      },
    },
  },
};

// ============================================
// REQUIRED: buildUrl helper
// ============================================
export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

// ============================================
// TYPE HELPERS
// ============================================
export type SongInput = z.infer<typeof api.songs.create.input>;
export type SongResponse = z.infer<typeof api.songs.create.responses[201]>;
export type PlaylistInput = z.infer<typeof api.playlists.create.input>;
export type GenerateLyricsInput = z.infer<typeof api.generate.lyrics.input>;
