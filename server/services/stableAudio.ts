/**
 * Stable Audio Service via fal.ai
 * 
 * Provides extended duration music generation (up to 3 minutes).
 * Uses Stability AI's audio generation models for high-quality
 * instrumental tracks with customizable BPM, key, genre, and mood.
 * 
 * Key features:
 * - Sample previews (15 seconds)
 * - Full tracks (up to 180 seconds)
 * - Async generation with status polling
 * - Audio-to-audio transformation
 */

import { fal } from "@fal-ai/client";

const FAL_KEY = process.env.FAL_API_KEY || process.env.FAL_KEY;

if (FAL_KEY) {
  fal.config({ credentials: FAL_KEY });
}

export interface StableAudioParams {
  prompt: string;
  duration?: number;
  genre?: string;
  mood?: string;
  bpm?: number;
  key?: string;
  instrumental?: boolean;
}

export interface StableAudioResult {
  audioUrl: string;
  duration: number;
}

export interface AudioToAudioParams {
  prompt: string;
  audioUrl: string;
  duration?: number;
}

const SAMPLE_DURATION = 15;
const MAX_DURATION = 180;

function buildStableAudioPrompt(params: StableAudioParams): string {
  const parts: string[] = [];
  
  if (params.bpm) {
    parts.push(`${params.bpm} BPM`);
  }
  
  if (params.key) {
    parts.push(`${params.key} key`);
  }
  
  if (params.genre) {
    parts.push(params.genre);
  }
  
  if (params.mood) {
    parts.push(`${params.mood} mood`);
  }
  
  if (params.instrumental) {
    parts.push("instrumental");
  }
  
  parts.push(params.prompt);
  
  return parts.join(", ");
}

function extractAudioUrl(data: unknown): string {
  if (!data || typeof data !== 'object') {
    return "";
  }
  
  const obj = data as Record<string, unknown>;
  
  if (typeof obj.audio === 'string') {
    return obj.audio;
  }
  
  if (obj.audio && typeof obj.audio === 'object') {
    const audioFile = obj.audio as Record<string, unknown>;
    if (typeof audioFile.url === 'string') {
      return audioFile.url;
    }
  }
  
  if (obj.audio_file && typeof obj.audio_file === 'object') {
    const audioFile = obj.audio_file as Record<string, unknown>;
    if (typeof audioFile.url === 'string') {
      return audioFile.url;
    }
  }
  
  return "";
}

export async function generateSample(params: StableAudioParams): Promise<StableAudioResult> {
  if (!FAL_KEY) {
    throw new Error("FAL_KEY is not configured");
  }
  
  const fullPrompt = buildStableAudioPrompt(params);
  
  const result = await fal.subscribe("fal-ai/stable-audio-25/text-to-audio", {
    input: {
      prompt: fullPrompt,
      seconds_total: SAMPLE_DURATION
    }
  });
  
  const audioUrl = extractAudioUrl(result.data);
  
  if (!audioUrl) {
    throw new Error("No audio URL received from Stable Audio");
  }
  
  return {
    audioUrl,
    duration: SAMPLE_DURATION
  };
}

export async function generateFullTrack(params: StableAudioParams): Promise<StableAudioResult> {
  if (!FAL_KEY) {
    throw new Error("FAL_KEY is not configured");
  }
  
  const fullPrompt = buildStableAudioPrompt(params);
  const duration = Math.min(Math.max(params.duration || 60, 30), MAX_DURATION);
  
  const result = await fal.subscribe("fal-ai/stable-audio-25/text-to-audio", {
    input: {
      prompt: fullPrompt,
      seconds_total: duration
    }
  });
  
  const audioUrl = extractAudioUrl(result.data);
  
  if (!audioUrl) {
    throw new Error("No audio URL received from Stable Audio");
  }
  
  return {
    audioUrl,
    duration
  };
}

export async function generateWithStableAudio25(params: StableAudioParams): Promise<StableAudioResult> {
  if (!FAL_KEY) {
    throw new Error("FAL_KEY is not configured");
  }
  
  const fullPrompt = buildStableAudioPrompt(params);
  const duration = Math.min(Math.max(params.duration || 60, 30), MAX_DURATION);
  
  const result = await fal.subscribe("fal-ai/stable-audio-25/text-to-audio", {
    input: {
      prompt: fullPrompt,
      seconds_total: duration
    }
  });
  
  const audioUrl = extractAudioUrl(result.data);
  
  if (!audioUrl) {
    throw new Error("No audio URL received from Stable Audio 2.5");
  }
  
  return {
    audioUrl,
    duration
  };
}

export async function transformAudio(params: AudioToAudioParams): Promise<StableAudioResult> {
  if (!FAL_KEY) {
    throw new Error("FAL_KEY is not configured");
  }
  
  const result = await fal.subscribe("fal-ai/stable-audio-25/audio-to-audio", {
    input: {
      prompt: params.prompt,
      audio_url: params.audioUrl
    }
  });
  
  const audioUrl = extractAudioUrl(result.data);
  
  if (!audioUrl) {
    throw new Error("No audio URL received from audio transformation");
  }
  
  return {
    audioUrl,
    duration: params.duration || 60
  };
}

export async function startAsyncGeneration(params: StableAudioParams): Promise<string> {
  if (!FAL_KEY) {
    throw new Error("FAL_KEY is not configured");
  }
  
  const fullPrompt = buildStableAudioPrompt(params);
  const duration = Math.min(Math.max(params.duration || 60, 30), MAX_DURATION);
  
  const { request_id } = await fal.queue.submit("fal-ai/stable-audio-25/text-to-audio", {
    input: {
      prompt: fullPrompt,
      seconds_total: duration
    }
  });
  
  return request_id;
}

export async function checkAsyncStatus(requestId: string): Promise<{
  status: string;
  audioUrl?: string;
  error?: string;
}> {
  if (!FAL_KEY) {
    throw new Error("FAL_KEY is not configured");
  }
  
  const status = await fal.queue.status("fal-ai/stable-audio-25/text-to-audio", {
    requestId,
    logs: false
  });
  
  if (status.status === "COMPLETED") {
    const result = await fal.queue.result("fal-ai/stable-audio-25/text-to-audio", {
      requestId
    });
    const audioUrl = extractAudioUrl(result.data);
    return {
      status: "succeeded",
      audioUrl
    };
  }
  
  if (status.status === "IN_QUEUE") {
    return {
      status: "starting"
    };
  }
  
  if (status.status === "IN_PROGRESS") {
    return {
      status: "processing"
    };
  }
  
  return {
    status: "failed",
    error: "Generation failed"
  };
}
