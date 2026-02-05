/**
 * Suno AI Music Generation Service
 * 
 * Provides high-quality AI music generation with vocals via third-party Suno API providers.
 */

export interface SunoGenerationParams {
  prompt: string;
  lyrics?: string;
  title?: string;
  style?: string;
  instrumental?: boolean;
  model?: string;
  duration?: number;
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

export interface MusicProvider {
  generate(params: SunoGenerationParams): Promise<SunoGenerationResult>;
  getStatus(taskId: string): Promise<SunoStatusResult>;
}

/** Kie.ai (Managed Provider) */
class KieProvider implements MusicProvider {
  private baseUrl = process.env.KIE_BASE_URL || "https://api.kie.ai";
  private apiKey = process.env.KIE_API_KEY || "";

  async generate(params: SunoGenerationParams): Promise<SunoGenerationResult> {
    const res = await fetch(`${this.baseUrl}/api/v1/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        prompt: params.prompt,
        model: params.model || "chirp-v4",
        make_instrumental: params.instrumental ?? false,
      }),
    });

    if (!res.ok) {
      throw new Error(`Kie.ai generation failed: ${res.statusText}`);
    }

    const data = await res.json();
    return {
      id: data.task_id,
      status: "processing",
    };
  }

  async getStatus(taskId: string): Promise<SunoStatusResult> {
    const res = await fetch(`${this.baseUrl}/api/v1/status?task_id=${encodeURIComponent(taskId)}`, {
      headers: { "Authorization": `Bearer ${this.apiKey}` },
    });

    if (!res.ok) throw new Error(`Kie.ai status check failed: ${res.statusText}`);

    const data = await res.json();
    return {
      id: taskId,
      status: mapStatus(data.status),
      audioUrl: data.audio_url,
      imageUrl: data.image_url,
    } as any;
  }
}

/** SunoAPI.org (Original implementation) */
class SunoOrgProvider implements MusicProvider {
  private baseUrl = "https://api.sunoapi.org";
  private apiKey = process.env.SUNO_API_KEY || "";

  async generate(params: SunoGenerationParams): Promise<SunoGenerationResult> {
    const body: any = {
      prompt: params.prompt,
      make_instrumental: params.instrumental ?? false,
      model: params.model || "chirp-v4",
      wait_audio: false,
    };
    if (params.lyrics) body.lyrics = params.lyrics;
    if (params.title) body.title = params.title;
    if (params.style) body.style = params.style;

    const res = await fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`SunoOrg generation failed: ${res.statusText}`);
    const data = await res.json();
    const clip = Array.isArray(data) ? data[0] : data;

    return {
      id: clip.id || clip.task_id,
      status: mapStatus(clip.status),
      audioUrl: clip.audio_url,
    };
  }

  async getStatus(taskId: string): Promise<SunoStatusResult> {
    const res = await fetch(`${this.baseUrl}/api/get/${taskId}`, {
      headers: { "Authorization": `Bearer ${this.apiKey}` },
    });

    if (!res.ok) throw new Error(`SunoOrg status check failed: ${res.statusText}`);
    const data = await res.json();
    const clip = Array.isArray(data) ? data[0] : data;

    return {
      id: clip.id || taskId,
      status: mapStatus(clip.status),
      audioUrl: clip.audio_url,
      title: clip.title,
      lyrics: clip.lyrics,
      style: clip.style,
      duration: clip.duration,
      error: clip.error,
    };
  }
}

function mapStatus(status: string): SunoStatusResult["status"] {
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

const providers = new Map<string, MusicProvider>([
  ["sunoorg", new SunoOrgProvider()],
  ["kie", new KieProvider()],
]);

function getProvider(): MusicProvider {
  const name = process.env.SUNO_PROVIDER || (process.env.KIE_API_KEY ? "kie" : "sunoorg");
  const p = providers.get(name);
  if (!p) throw new Error(`Unknown Suno provider: ${name}`);
  return p;
}

export function isSunoConfigured(): boolean {
  return !!(process.env.SUNO_API_KEY || process.env.KIE_API_KEY);
}

export async function startSunoGeneration(params: SunoGenerationParams): Promise<SunoGenerationResult> {
  return getProvider().generate(params);
}

export async function checkSunoStatus(taskId: string): Promise<SunoStatusResult> {
  return getProvider().getStatus(taskId);
}

export async function generateSunoLyrics(prompt: string): Promise<{ lyrics: string }> {
  // Use original provider for lyrics generation or fallback
  const apiKey = process.env.SUNO_API_KEY || process.env.KIE_API_KEY;
  const baseUrl = "https://api.sunoapi.org"; // default
  
  const response = await fetch(`${baseUrl}/api/generate_lyrics`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
  });
  
  if (!response.ok) return { lyrics: "" };
  const data = await response.json();
  return { lyrics: data.text || data.lyrics || "" };
}

export const SUNO_STYLES = [
  "Pop", "Rock", "Hip Hop", "R&B", "Electronic", "Jazz", "Classical", "Country", 
  "Folk", "Metal", "Indie", "Latin", "K-Pop", "Lo-Fi", "Synthwave", "Ambient", 
  "Soul", "Funk", "Reggae", "Blues"
] as const;

export const SUNO_MODELS = [
  { id: "chirp-v3", name: "v3 (Legacy)", description: "Original model" },
  { id: "chirp-v3.5", name: "v3.5", description: "Improved vocals" },
  { id: "chirp-v4", name: "v4 (Recommended)", description: "Best quality for most uses" },
  { id: "chirp-v5", name: "v5 (Latest)", description: "Studio-quality, up to 4 min tracks" },
] as const;

export function validateSunoParams(params: SunoGenerationParams): SunoGenerationParams {
  const validated = { ...params };
  if (validated.prompt) validated.prompt = validated.prompt.slice(0, 2000).trim();
  if (validated.lyrics) validated.lyrics = validated.lyrics.slice(0, 5000).trim();
  if (validated.title) validated.title = validated.title.slice(0, 100).trim();
  return validated;
}
