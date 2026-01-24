const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1";

export interface VoiceInfo {
  voice_id: string;
  name: string;
  category: string;
  labels: Record<string, string>;
}

export interface TextToSpeechParams {
  text: string;
  voiceId?: string;
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
}

export interface TextToSpeechResult {
  audioUrl: string;
  contentType: string;
}

export interface SoundEffectParams {
  text: string;
  durationSeconds?: number;
  promptInfluence?: number;
}

export interface SoundEffectResult {
  audioUrl: string;
}

async function makeRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
  if (!ELEVENLABS_API_KEY) {
    throw new Error("ELEVENLABS_API_KEY is not configured");
  }

  const response = await fetch(`${ELEVENLABS_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "xi-api-key": ELEVENLABS_API_KEY,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
  }

  return response;
}

export async function getVoices(): Promise<VoiceInfo[]> {
  const response = await makeRequest("/voices");
  const data = await response.json();
  return data.voices || [];
}

export async function textToSpeech(params: TextToSpeechParams): Promise<TextToSpeechResult> {
  const voiceId = params.voiceId || "21m00Tcm4TlvDq8ikWAM"; // Default: Rachel
  const modelId = params.modelId || "eleven_monolingual_v1";

  const response = await makeRequest(`/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: params.text,
      model_id: modelId,
      voice_settings: {
        stability: params.stability ?? 0.5,
        similarity_boost: params.similarityBoost ?? 0.75,
        style: params.style ?? 0,
      },
    }),
  });

  const audioBuffer = await response.arrayBuffer();
  const base64Audio = Buffer.from(audioBuffer).toString("base64");
  const contentType = response.headers.get("content-type") || "audio/mpeg";

  return {
    audioUrl: `data:${contentType};base64,${base64Audio}`,
    contentType,
  };
}

export async function generateSoundEffect(params: SoundEffectParams): Promise<SoundEffectResult> {
  const response = await makeRequest("/sound-generation", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: params.text,
      duration_seconds: params.durationSeconds,
      prompt_influence: params.promptInfluence ?? 0.3,
    }),
  });

  const audioBuffer = await response.arrayBuffer();
  const base64Audio = Buffer.from(audioBuffer).toString("base64");

  return {
    audioUrl: `data:audio/mpeg;base64,${base64Audio}`,
  };
}

export function isConfigured(): boolean {
  return !!ELEVENLABS_API_KEY;
}
