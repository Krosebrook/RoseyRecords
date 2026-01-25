/**
 * Local storage utilities for saving work-in-progress drafts.
 * Provides persistence for lyrics, prompts, settings, and user preferences
 * between sessions. All operations are fail-safe with silent fallbacks.
 */

const STORAGE_KEYS = {
  DRAFT_LYRICS: 'harmoniq_draft_lyrics',
  DRAFT_PROMPT: 'harmoniq_draft_prompt',
  DRAFT_GENRE: 'harmoniq_draft_genre',
  DRAFT_MOOD: 'harmoniq_draft_mood',
  STUDIO_SETTINGS: 'harmoniq_studio_settings',
  VOCALS_TEXT: 'harmoniq_vocals_text',
  VOCALS_SETTINGS: 'harmoniq_vocals_settings',
  AUDIO_PROMPT: 'harmoniq_audio_prompt',
  PREFERRED_AI_ENGINE: 'harmoniq_ai_engine',
} as const;

/** Settings for audio generation in the studio */
interface StudioSettings {
  audioPrompt?: string;
  duration?: number;
  model?: string;
}

/** Settings for Bark AI singing vocals generation */
interface VocalsSettings {
  voicePreset?: string;
  textTemp?: number;
  waveformTemp?: number;
}

export const storage = {
  /** Save lyrics draft to localStorage */
  setDraftLyrics: (lyrics: string) => {
    try {
      localStorage.setItem(STORAGE_KEYS.DRAFT_LYRICS, lyrics);
    } catch {
      // Storage unavailable or quota exceeded
    }
  },

  /** Retrieve lyrics draft from localStorage */
  getDraftLyrics: (): string => {
    try {
      return localStorage.getItem(STORAGE_KEYS.DRAFT_LYRICS) || '';
    } catch {
      return '';
    }
  },

  /** Save generation prompt draft */
  setDraftPrompt: (prompt: string) => {
    try {
      localStorage.setItem(STORAGE_KEYS.DRAFT_PROMPT, prompt);
    } catch {
      // Storage unavailable
    }
  },

  /** Retrieve generation prompt draft */
  getDraftPrompt: (): string => {
    try {
      return localStorage.getItem(STORAGE_KEYS.DRAFT_PROMPT) || '';
    } catch {
      return '';
    }
  },

  /** Save genre selection */
  setDraftGenre: (genre: string) => {
    try {
      localStorage.setItem(STORAGE_KEYS.DRAFT_GENRE, genre);
    } catch {
      // Storage unavailable
    }
  },

  /** Retrieve saved genre selection */
  getDraftGenre: (): string => {
    try {
      return localStorage.getItem(STORAGE_KEYS.DRAFT_GENRE) || '';
    } catch {
      return '';
    }
  },

  /** Save mood selection */
  setDraftMood: (mood: string) => {
    try {
      localStorage.setItem(STORAGE_KEYS.DRAFT_MOOD, mood);
    } catch {
      // Storage unavailable
    }
  },

  /** Retrieve saved mood selection */
  getDraftMood: (): string => {
    try {
      return localStorage.getItem(STORAGE_KEYS.DRAFT_MOOD) || '';
    } catch {
      return '';
    }
  },

  /** Save studio audio generation settings */
  setStudioSettings: (settings: StudioSettings) => {
    try {
      localStorage.setItem(STORAGE_KEYS.STUDIO_SETTINGS, JSON.stringify(settings));
    } catch {
      // Storage unavailable
    }
  },

  /** Retrieve studio audio generation settings */
  getStudioSettings: (): StudioSettings => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.STUDIO_SETTINGS);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  },

  /** Save vocals text for Bark singing generation */
  setVocalsText: (text: string) => {
    try {
      localStorage.setItem(STORAGE_KEYS.VOCALS_TEXT, text);
    } catch {
      // Storage unavailable
    }
  },

  /** Retrieve vocals text for Bark singing generation */
  getVocalsText: (): string => {
    try {
      return localStorage.getItem(STORAGE_KEYS.VOCALS_TEXT) || '';
    } catch {
      return '';
    }
  },

  /** Save Bark vocals generation settings (voice preset, temperatures) */
  setVocalsSettings: (settings: VocalsSettings) => {
    try {
      localStorage.setItem(STORAGE_KEYS.VOCALS_SETTINGS, JSON.stringify(settings));
    } catch {
      // Storage unavailable
    }
  },

  /** Retrieve Bark vocals generation settings */
  getVocalsSettings: (): VocalsSettings => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.VOCALS_SETTINGS);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  },

  /** Save audio generation prompt for instrumental tracks */
  setAudioPrompt: (prompt: string) => {
    try {
      localStorage.setItem(STORAGE_KEYS.AUDIO_PROMPT, prompt);
    } catch {
      // Storage unavailable
    }
  },

  /** Retrieve audio generation prompt */
  getAudioPrompt: (): string => {
    try {
      return localStorage.getItem(STORAGE_KEYS.AUDIO_PROMPT) || '';
    } catch {
      return '';
    }
  },

  /** Save preferred AI engine for lyrics generation (OpenAI or Gemini) */
  setPreferredAIEngine: (engine: 'openai' | 'gemini') => {
    try {
      localStorage.setItem(STORAGE_KEYS.PREFERRED_AI_ENGINE, engine);
    } catch {
      // Storage unavailable
    }
  },

  /** Retrieve preferred AI engine, defaults to OpenAI */
  getPreferredAIEngine: (): 'openai' | 'gemini' => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PREFERRED_AI_ENGINE);
      return (stored === 'openai' || stored === 'gemini') ? stored : 'openai';
    } catch {
      return 'openai';
    }
  },

  /** Clear all draft content (lyrics, prompts, vocals text) but keep settings */
  clearDrafts: () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.DRAFT_LYRICS);
      localStorage.removeItem(STORAGE_KEYS.DRAFT_PROMPT);
      localStorage.removeItem(STORAGE_KEYS.DRAFT_GENRE);
      localStorage.removeItem(STORAGE_KEYS.DRAFT_MOOD);
      localStorage.removeItem(STORAGE_KEYS.VOCALS_TEXT);
      localStorage.removeItem(STORAGE_KEYS.AUDIO_PROMPT);
    } catch {
      // Storage unavailable
    }
  },

  /** Clear all HarmoniQ data from localStorage */
  clearAll: () => {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch {
      // Storage unavailable
    }
  }
};
