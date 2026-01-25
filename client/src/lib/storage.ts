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

interface StudioSettings {
  audioPrompt?: string;
  duration?: number;
  model?: string;
}

interface VocalsSettings {
  voicePreset?: string;
  textTemp?: number;
  waveformTemp?: number;
}

export const storage = {
  setDraftLyrics: (lyrics: string) => {
    try {
      localStorage.setItem(STORAGE_KEYS.DRAFT_LYRICS, lyrics);
    } catch (e) {
      console.warn('Failed to save draft lyrics:', e);
    }
  },

  getDraftLyrics: (): string => {
    try {
      return localStorage.getItem(STORAGE_KEYS.DRAFT_LYRICS) || '';
    } catch (e) {
      return '';
    }
  },

  setDraftPrompt: (prompt: string) => {
    try {
      localStorage.setItem(STORAGE_KEYS.DRAFT_PROMPT, prompt);
    } catch (e) {
      console.warn('Failed to save draft prompt:', e);
    }
  },

  getDraftPrompt: (): string => {
    try {
      return localStorage.getItem(STORAGE_KEYS.DRAFT_PROMPT) || '';
    } catch (e) {
      return '';
    }
  },

  setDraftGenre: (genre: string) => {
    try {
      localStorage.setItem(STORAGE_KEYS.DRAFT_GENRE, genre);
    } catch (e) {
      console.warn('Failed to save draft genre:', e);
    }
  },

  getDraftGenre: (): string => {
    try {
      return localStorage.getItem(STORAGE_KEYS.DRAFT_GENRE) || '';
    } catch (e) {
      return '';
    }
  },

  setDraftMood: (mood: string) => {
    try {
      localStorage.setItem(STORAGE_KEYS.DRAFT_MOOD, mood);
    } catch (e) {
      console.warn('Failed to save draft mood:', e);
    }
  },

  getDraftMood: (): string => {
    try {
      return localStorage.getItem(STORAGE_KEYS.DRAFT_MOOD) || '';
    } catch (e) {
      return '';
    }
  },

  setStudioSettings: (settings: StudioSettings) => {
    try {
      localStorage.setItem(STORAGE_KEYS.STUDIO_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save studio settings:', e);
    }
  },

  getStudioSettings: (): StudioSettings => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.STUDIO_SETTINGS);
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  },

  setVocalsText: (text: string) => {
    try {
      localStorage.setItem(STORAGE_KEYS.VOCALS_TEXT, text);
    } catch (e) {
      console.warn('Failed to save vocals text:', e);
    }
  },

  getVocalsText: (): string => {
    try {
      return localStorage.getItem(STORAGE_KEYS.VOCALS_TEXT) || '';
    } catch (e) {
      return '';
    }
  },

  setVocalsSettings: (settings: VocalsSettings) => {
    try {
      localStorage.setItem(STORAGE_KEYS.VOCALS_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save vocals settings:', e);
    }
  },

  getVocalsSettings: (): VocalsSettings => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.VOCALS_SETTINGS);
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  },

  setAudioPrompt: (prompt: string) => {
    try {
      localStorage.setItem(STORAGE_KEYS.AUDIO_PROMPT, prompt);
    } catch (e) {
      console.warn('Failed to save audio prompt:', e);
    }
  },

  getAudioPrompt: (): string => {
    try {
      return localStorage.getItem(STORAGE_KEYS.AUDIO_PROMPT) || '';
    } catch (e) {
      return '';
    }
  },

  setPreferredAIEngine: (engine: 'openai' | 'gemini') => {
    try {
      localStorage.setItem(STORAGE_KEYS.PREFERRED_AI_ENGINE, engine);
    } catch (e) {
      console.warn('Failed to save AI engine preference:', e);
    }
  },

  getPreferredAIEngine: (): 'openai' | 'gemini' => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PREFERRED_AI_ENGINE);
      return (stored === 'openai' || stored === 'gemini') ? stored : 'openai';
    } catch (e) {
      return 'openai';
    }
  },

  clearDrafts: () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.DRAFT_LYRICS);
      localStorage.removeItem(STORAGE_KEYS.DRAFT_PROMPT);
      localStorage.removeItem(STORAGE_KEYS.DRAFT_GENRE);
      localStorage.removeItem(STORAGE_KEYS.DRAFT_MOOD);
      localStorage.removeItem(STORAGE_KEYS.VOCALS_TEXT);
      localStorage.removeItem(STORAGE_KEYS.AUDIO_PROMPT);
    } catch (e) {
      console.warn('Failed to clear drafts:', e);
    }
  },

  clearAll: () => {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (e) {
      console.warn('Failed to clear storage:', e);
    }
  }
};
