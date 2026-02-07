/**
 * Suno AI Music Generation Service
 * 
 * Provides high-quality AI music generation with vocals via DefAPI Suno endpoints.
 * Production base: https://api.defapi.org
 * 
 * Supports multiple providers with abstraction for failover.
 */

export interface SunoGenerationParams {
  prompt: string;
  lyrics?: string;
  title?: string;
  style?: string;
  tags?: string;
  instrumental?: boolean;
  model?: string;
  duration?: number;
  customMode?: boolean;
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
  clips?: Array<{
    id: string;
    audioUrl?: string;
    title?: string;
    imageUrl?: string;
  }>;
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
  clips?: Array<{
    id: string;
    audioUrl?: string;
    title?: string;
    imageUrl?: string;
  }>;
}

export interface SunoUserInfo {
  credits: number;
  userId?: string;
  plan?: string;
}

export interface MusicProvider {
  generate(params: SunoGenerationParams): Promise<SunoGenerationResult>;
  getStatus(taskId: string): Promise<SunoStatusResult>;
  getUser?(): Promise<SunoUserInfo>;
}

/** Retry configuration */
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  retryableStatuses: [429, 500, 502, 503, 504],
};

/** Sleep with jitter */
function sleepWithJitter(baseMs: number, attempt: number): Promise<void> {
  const exponentialDelay = Math.min(
    baseMs * Math.pow(2, attempt),
    RETRY_CONFIG.maxDelayMs
  );
  const jitter = Math.random() * 0.3 * exponentialDelay;
  return new Promise((r) => setTimeout(r, exponentialDelay + jitter));
}

/** Fetch with timeout, retries, and exponential backoff */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  timeoutMs = 30000
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return response;
      }

      if (RETRY_CONFIG.retryableStatuses.includes(response.status)) {
        if (attempt < RETRY_CONFIG.maxRetries) {
          await sleepWithJitter(RETRY_CONFIG.baseDelayMs, attempt);
          continue;
        }
      }

      const errorText = await response.text().catch(() => "");
      throw new Error(
        `API error ${response.status}: ${errorText.slice(0, 300)}`
      );
    } catch (err) {
      clearTimeout(timeoutId);
      lastError = err instanceof Error ? err : new Error(String(err));

      if (
        lastError.name === "AbortError" ||
        attempt >= RETRY_CONFIG.maxRetries
      ) {
        throw lastError;
      }

      await sleepWithJitter(RETRY_CONFIG.baseDelayMs, attempt);
    }
  }

  throw lastError || new Error("Request failed after retries");
}

/** DefAPI Provider (Production - Recommended) */
class DefAPIProvider implements MusicProvider {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = (
      process.env.DEFAPI_BASE_URL || "https://api.defapi.org"
    ).replace(/\/$/, "");
    this.apiKey = process.env.DEFAPI_API_KEY || "";
  }

  async generate(params: SunoGenerationParams): Promise<SunoGenerationResult> {
    if (!this.apiKey) {
      throw new Error("DEFAPI_API_KEY is not configured");
    }

    const hasCustomLyrics = !!params.lyrics?.trim();
    
    const body: Record<string, unknown> = {
      mv: params.model || "chirp-bluejay",
      custom_mode: hasCustomLyrics,
      make_instrumental: params.instrumental ?? false,
      prompt: params.prompt.slice(0, 2000),
      tags: params.tags || params.style || "",
      title: params.title?.slice(0, 100) || "",
    };
    
    if (hasCustomLyrics) {
      body.lyrics = params.lyrics!.slice(0, 5000);
    }

    const res = await fetchWithRetry(`${this.baseUrl}/api/suno/generate`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    console.log("[DefAPI] Generate response:", JSON.stringify(data));

    // Handle error responses from DefAPI
    // DefAPI returns {message: "ok"} on success, so only treat non-ok messages as errors
    if (data.error) {
      throw new Error(data.error);
    }
    if (data.code && data.code !== 200 && data.message && data.message !== "ok") {
      throw new Error(data.message);
    }

    // DefAPI returns task_id in the response (may be nested under data)
    const taskId = data.task_id || data.id || data.data?.task_id || data.data?.id;
    if (!taskId) {
      console.error("[DefAPI] No task_id in response:", data);
      throw new Error("No task ID returned from DefAPI - check your credits");
    }

    return {
      id: taskId,
      status: "processing",
    };
  }

  async getStatus(taskId: string): Promise<SunoStatusResult> {
    if (!this.apiKey) {
      throw new Error("DEFAPI_API_KEY is not configured");
    }

    const res = await fetchWithRetry(
      `${this.baseUrl}/api/task/query?task_id=${encodeURIComponent(taskId)}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
      }
    );

    const data = await res.json();
    console.log("[DefAPI] Status response for", taskId, ":", JSON.stringify(data));

    const status = mapDefAPIStatus(data.status || data.state);
    const clips =
      data.clips?.map((clip: any) => ({
        id: clip.id,
        audioUrl: clip.audio_url,
        title: clip.title,
        imageUrl: clip.image_url,
      })) || [];

    return {
      id: taskId,
      status,
      audioUrl: clips[0]?.audioUrl || data.audio_url,
      clips,
      error: data.error || data.message,
    };
  }

  async getUser(): Promise<SunoUserInfo> {
    if (!this.apiKey) {
      throw new Error("DEFAPI_API_KEY is not configured");
    }

    const res = await fetchWithRetry(`${this.baseUrl}/api/user`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    const data = await res.json();
    console.log("[DefAPI] User info response:", JSON.stringify(data));

    return {
      credits: data.credits ?? data.balance ?? data.data?.credits ?? data.data?.balance ?? 0,
      userId: data.user_id || data.id || data.data?.user_id,
      plan: data.plan || data.subscription || data.data?.plan,
    };
  }
}

function mapDefAPIStatus(status: string): SunoStatusResult["status"] {
  switch (status?.toLowerCase()) {
    case "succeeded":
    case "complete":
    case "completed":
    case "done":
      return "complete";
    case "failed":
    case "error":
    case "cancelled":
      return "failed";
    case "processing":
    case "running":
    case "in_progress":
      return "processing";
    case "queued":
    case "pending":
    case "starting":
    default:
      return "starting";
  }
}

/** Kie.ai Provider (Alternative Managed) */
class KieProvider implements MusicProvider {
  private baseUrl = process.env.KIE_BASE_URL || "https://api.kie.ai";
  private apiKey = process.env.KIE_API_KEY || "";

  async generate(params: SunoGenerationParams): Promise<SunoGenerationResult> {
    const res = await fetchWithRetry(`${this.baseUrl}/api/v1/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        prompt: params.prompt,
        model: params.model || "chirp-v4",
        make_instrumental: params.instrumental ?? false,
      }),
    });

    const data = await res.json();
    return {
      id: data.task_id,
      status: "processing",
    };
  }

  async getStatus(taskId: string): Promise<SunoStatusResult> {
    const res = await fetchWithRetry(
      `${this.baseUrl}/api/v1/status?task_id=${encodeURIComponent(taskId)}`,
      {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      }
    );

    const data = await res.json();
    return {
      id: taskId,
      status: mapDefAPIStatus(data.status),
      audioUrl: data.audio_url,
    };
  }
}

/** SunoAPI.org Provider (Legacy) */
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

    const res = await fetchWithRetry(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    const clip = Array.isArray(data) ? data[0] : data;

    return {
      id: clip.id || clip.task_id,
      status: mapDefAPIStatus(clip.status),
      audioUrl: clip.audio_url,
    };
  }

  async getStatus(taskId: string): Promise<SunoStatusResult> {
    const res = await fetchWithRetry(`${this.baseUrl}/api/get/${taskId}`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });

    const data = await res.json();
    const clip = Array.isArray(data) ? data[0] : data;

    return {
      id: clip.id || taskId,
      status: mapDefAPIStatus(clip.status),
      audioUrl: clip.audio_url,
      title: clip.title,
      lyrics: clip.lyrics,
      style: clip.style,
      duration: clip.duration,
      error: clip.error,
    };
  }
}

const providers = new Map<string, MusicProvider>([
  ["defapi", new DefAPIProvider()],
  ["kie", new KieProvider()],
  ["sunoorg", new SunoOrgProvider()],
]);

function getProvider(): MusicProvider {
  const explicit = process.env.SUNO_PROVIDER;
  if (explicit && providers.has(explicit)) {
    return providers.get(explicit)!;
  }

  if (process.env.DEFAPI_API_KEY) return providers.get("defapi")!;
  if (process.env.KIE_API_KEY) return providers.get("kie")!;
  if (process.env.SUNO_API_KEY) return providers.get("sunoorg")!;

  throw new Error(
    "No Suno provider configured. Set DEFAPI_API_KEY, KIE_API_KEY, or SUNO_API_KEY."
  );
}

export function isSunoConfigured(): boolean {
  return !!(
    process.env.DEFAPI_API_KEY ||
    process.env.KIE_API_KEY ||
    process.env.SUNO_API_KEY
  );
}

export function getConfiguredProvider(): string {
  if (process.env.SUNO_PROVIDER) return process.env.SUNO_PROVIDER;
  if (process.env.DEFAPI_API_KEY) return "defapi";
  if (process.env.KIE_API_KEY) return "kie";
  if (process.env.SUNO_API_KEY) return "sunoorg";
  return "none";
}

export async function startSunoGeneration(
  params: SunoGenerationParams
): Promise<SunoGenerationResult> {
  return getProvider().generate(params);
}

export async function checkSunoStatus(taskId: string): Promise<SunoStatusResult> {
  return getProvider().getStatus(taskId);
}

export async function getSunoUserInfo(): Promise<SunoUserInfo | null> {
  try {
    const provider = getProvider();
    if (provider.getUser) {
      return await provider.getUser();
    }
    return null;
  } catch {
    return null;
  }
}

export async function generateSunoLyrics(
  prompt: string
): Promise<{ lyrics: string }> {
  return { lyrics: "" };
}

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

export const SUNO_MODELS = [
  { id: "chirp-v3-0", name: "v3 (Legacy)", description: "Original model" },
  { id: "chirp-v3-5", name: "v3.5", description: "Improved vocals" },
  { id: "chirp-v4", name: "v4", description: "Solid quality" },
  {
    id: "chirp-auk",
    name: "v4.5",
    description: "Enhanced vocal quality, 4 min tracks",
  },
  {
    id: "chirp-bluejay",
    name: "v4.5+ (Latest)",
    description: "Rich sound, best vocals, up to 8 min",
  },
] as const;

export function validateSunoParams(
  params: SunoGenerationParams
): SunoGenerationParams {
  const validated = { ...params };
  if (validated.prompt) validated.prompt = validated.prompt.slice(0, 2000).trim();
  if (validated.lyrics) validated.lyrics = validated.lyrics.slice(0, 5000).trim();
  if (validated.title) validated.title = validated.title.slice(0, 100).trim();
  if (validated.tags) validated.tags = validated.tags.slice(0, 200).trim();
  return validated;
}

/** Polling configuration */
export const POLLING_CONFIG = {
  initialDelayMs: 1500,
  maxDelayMs: 6000,
  maxWaitMs: 120000,
  backoffMultiplier: 1.5,
};
