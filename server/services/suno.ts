/**
 * Suno AI Music Generation Service
 * 
 * Provides high-quality AI music generation with vocals via third-party Suno API.
 * Falls back to MusicGen + Bark combination when Suno API is not configured.
 * 
 * Suno produces studio-quality tracks up to 4+ minutes with realistic vocals.
 */

// Third-party Suno API endpoints (unofficial but stable)
const SUNO_API_BASE = "https://api.sunoapi.org";

export interface SunoGenerationParams {
  prompt: string;
  lyrics?: string;
  title?: string;
  style?: string;
  instrumental?: boolean;
  model?: "chirp-v3" | "chirp-v3.5" | "chirp-v4" | "chirp-v5";
  duration?: number; // in seconds (max 240)
}

export interface SunoGenerationResult {
  id: string;
  audioUrl?: string;
  status: "starting" | "processing" | "complete" | "failed";
  title?: string;
  lyrics?: string;
  style?: string;
  duration?: number;
  error?: string;
}

export interface SunoStatusResult {
  id: string;
  status: "starting" | "processing" | "complete" | "failed";
  audioUrl?: string;
  title?: string;
  lyrics?: string;
  style?: string;
  duration?: number;
  error?: string;
}

/** Check if Suno API is configured */
export function isSunoConfigured(): boolean {
  return !!process.env.SUNO_API_KEY;
}

/** Get Suno API key with validation */
function getSunoApiKey(): string {
  const key = process.env.SUNO_API_KEY;
  if (!key) {
    throw new Error("SUNO_API_KEY is not configured");
  }
  return key;
}

/**
 * Start async music generation with Suno.
 * Returns a task ID that can be polled for status.
 */
export async function startSunoGeneration(params: SunoGenerationParams): Promise<SunoGenerationResult> {
  const apiKey = getSunoApiKey();
  
  const body: Record<string, unknown> = {
    prompt: params.prompt,
    make_instrumental: params.instrumental ?? false,
    model: params.model || "chirp-v4",
    wait_audio: false, // async mode
  };
  
  if (params.lyrics) {
    body.lyrics = params.lyrics;
  }
  
  if (params.title) {
    body.title = params.title;
  }
  
  if (params.style) {
    body.style = params.style;
  }
  
  const response = await fetch(`${SUNO_API_BASE}/api/generate`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Suno API error: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json();
  
  // Suno returns an array of clips
  const clip = Array.isArray(data) ? data[0] : data;
  
  return {
    id: clip.id || clip.task_id,
    status: mapSunoStatus(clip.status),
    audioUrl: clip.audio_url,
    title: clip.title,
    lyrics: clip.lyrics,
    style: clip.style,
    duration: clip.duration,
  };
}

/**
 * Generate music synchronously (waits for completion).
 * Use for shorter tracks or when immediate result is needed.
 */
export async function generateSunoMusic(params: SunoGenerationParams): Promise<SunoGenerationResult> {
  const apiKey = getSunoApiKey();
  
  const body: Record<string, unknown> = {
    prompt: params.prompt,
    make_instrumental: params.instrumental ?? false,
    model: params.model || "chirp-v4",
    wait_audio: true, // sync mode - wait for result
  };
  
  if (params.lyrics) {
    body.lyrics = params.lyrics;
  }
  
  if (params.title) {
    body.title = params.title;
  }
  
  if (params.style) {
    body.style = params.style;
  }
  
  const response = await fetch(`${SUNO_API_BASE}/api/generate`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Suno API error: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json();
  const clip = Array.isArray(data) ? data[0] : data;
  
  return {
    id: clip.id || clip.task_id,
    status: "complete",
    audioUrl: clip.audio_url,
    title: clip.title,
    lyrics: clip.lyrics,
    style: clip.style,
    duration: clip.duration,
  };
}

/**
 * Check status of an async generation task.
 */
export async function checkSunoStatus(taskId: string): Promise<SunoStatusResult> {
  const apiKey = getSunoApiKey();
  
  const response = await fetch(`${SUNO_API_BASE}/api/get/${taskId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Suno API error: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json();
  const clip = Array.isArray(data) ? data[0] : data;
  
  return {
    id: clip.id || taskId,
    status: mapSunoStatus(clip.status),
    audioUrl: clip.audio_url,
    title: clip.title,
    lyrics: clip.lyrics,
    style: clip.style,
    duration: clip.duration,
    error: clip.error,
  };
}

/**
 * Generate lyrics only using Suno's lyric generation.
 */
export async function generateSunoLyrics(prompt: string): Promise<{ lyrics: string }> {
  const apiKey = getSunoApiKey();
  
  const response = await fetch(`${SUNO_API_BASE}/api/generate_lyrics`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Suno API error: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json();
  
  return {
    lyrics: data.text || data.lyrics || "",
  };
}

/**
 * Extend an existing track (continuation).
 */
export async function extendSunoTrack(
  audioId: string, 
  prompt?: string,
  continueAt?: number
): Promise<SunoGenerationResult> {
  const apiKey = getSunoApiKey();
  
  const body: Record<string, unknown> = {
    audio_id: audioId,
    wait_audio: true,
  };
  
  if (prompt) {
    body.prompt = prompt;
  }
  
  if (continueAt !== undefined) {
    body.continue_at = continueAt;
  }
  
  const response = await fetch(`${SUNO_API_BASE}/api/extend_audio`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Suno API error: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json();
  const clip = Array.isArray(data) ? data[0] : data;
  
  return {
    id: clip.id,
    status: "complete",
    audioUrl: clip.audio_url,
    title: clip.title,
    lyrics: clip.lyrics,
    duration: clip.duration,
  };
}

/** Map Suno status strings to our normalized status */
function mapSunoStatus(status: string): SunoStatusResult["status"] {
  switch (status?.toLowerCase()) {
    case "complete":
    case "completed":
    case "succeeded":
      return "complete";
    case "failed":
    case "error":
      return "failed";
    case "processing":
    case "running":
    case "queued":
      return "processing";
    default:
      return "starting";
  }
}

/** Available Suno music styles for UI */
export const SUNO_STYLES = [
  "Pop",
  "Rock",
  "Hip Hop",
  "R&B",
  "Electronic",
  "Jazz",
  "Classical",
  "Country",
  "Folk",
  "Metal",
  "Indie",
  "Latin",
  "K-Pop",
  "Lo-Fi",
  "Synthwave",
  "Ambient",
  "Soul",
  "Funk",
  "Reggae",
  "Blues",
] as const;

/** Available Suno model versions */
export const SUNO_MODELS = [
  { id: "chirp-v3", name: "v3 (Legacy)", description: "Original model" },
  { id: "chirp-v3.5", name: "v3.5", description: "Improved vocals" },
  { id: "chirp-v4", name: "v4 (Recommended)", description: "Best quality for most uses" },
  { id: "chirp-v5", name: "v5 (Latest)", description: "Studio-quality, up to 4 min tracks" },
] as const;

/** Allowed model IDs for validation */
export const ALLOWED_SUNO_MODELS = SUNO_MODELS.map(m => m.id);

/** Validate and sanitize Suno generation params */
export function validateSunoParams(params: SunoGenerationParams): SunoGenerationParams {
  const validated = { ...params };
  
  // Validate model - default to v4 if invalid
  if (validated.model && !ALLOWED_SUNO_MODELS.includes(validated.model)) {
    validated.model = "chirp-v4";
  }
  
  // Validate style - if provided and not in allowed list, remove it
  if (validated.style && !SUNO_STYLES.includes(validated.style as typeof SUNO_STYLES[number])) {
    validated.style = undefined;
  }
  
  // Sanitize text inputs (basic validation)
  if (validated.prompt) {
    validated.prompt = validated.prompt.slice(0, 2000).trim();
  }
  if (validated.lyrics) {
    validated.lyrics = validated.lyrics.slice(0, 5000).trim();
  }
  if (validated.title) {
    validated.title = validated.title.slice(0, 100).trim();
  }
  
  return validated;
}
