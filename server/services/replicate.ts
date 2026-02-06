/**
 * Replicate AI Service
 * 
 * Provides AI music generation via Meta's MusicGen model and
 * AI singing vocals via Suno's Bark model.
 * 
 * MusicGen: Short instrumental tracks (5-30 seconds)
 * Bark: AI singing vocals with natural voice synthesis
 */

import Replicate from "replicate";

/** Get authenticated Replicate client */
const getReplicate = () => {
  if (!process.env.REPLICATE_API_KEY) {
    throw new Error("REPLICATE_API_KEY is not configured");
  }
  return new Replicate({
    auth: process.env.REPLICATE_API_KEY,
  });
};

export interface MusicGenerationParams {
  prompt: string;
  duration?: number;
  genre?: string;
  mood?: string;
  instrumental?: boolean;
}

export interface MusicGenerationResult {
  audioUrl: string;
  duration: number;
}

const MIN_DURATION = 5;
const MAX_DURATION = 30;

function normalizeDuration(duration?: number): number {
  if (!duration) return 10;
  return Math.min(Math.max(duration, MIN_DURATION), MAX_DURATION);
}

function extractAudioUrl(output: unknown): string {
  if (typeof output === 'string') {
    return output;
  }
  if (Array.isArray(output) && output.length > 0) {
    return typeof output[0] === 'string' ? output[0] : "";
  }
  if (output && typeof output === 'object' && 'output' in output) {
    const innerOutput = (output as { output: unknown }).output;
    return extractAudioUrl(innerOutput);
  }
  return "";
}

/**
 * Generate instrumental music using Meta's MusicGen model.
 * Synchronous operation that waits for generation to complete.
 */
export async function generateMusic(params: MusicGenerationParams): Promise<MusicGenerationResult> {
  const replicate = getReplicate();
  
  const fullPrompt = buildMusicPrompt(params);
  const duration = normalizeDuration(params.duration);
  
  const output = await replicate.run(
    "meta/musicgen:b05b1dff1d8c6dc63d14b0cdb42135378dcb87f6373b0d3d341ede46e59e2b38",
    {
      input: {
        prompt: fullPrompt,
        duration,
        model_version: "stereo-melody-large",
        output_format: "mp3",
        normalization_strategy: "peak"
      }
    }
  );
  
  const audioUrl = extractAudioUrl(output);
  
  if (!audioUrl) {
    throw new Error("No audio URL received from generation");
  }
  
  return {
    audioUrl,
    duration
  };
}

/**
 * Generate music that continues or transforms an existing audio input.
 * Uses MusicGen's melody continuation feature.
 */
export async function generateMusicFromMelody(
  inputAudioUrl: string, 
  prompt: string,
  duration?: number
): Promise<MusicGenerationResult> {
  const replicate = getReplicate();
  const normalizedDuration = normalizeDuration(duration);
  
  const output = await replicate.run(
    "meta/musicgen:b05b1dff1d8c6dc63d14b0cdb42135378dcb87f6373b0d3d341ede46e59e2b38",
    {
      input: {
        prompt,
        input_audio: inputAudioUrl,
        duration: normalizedDuration,
        model_version: "stereo-melody-large",
        output_format: "mp3",
        continuation: true
      }
    }
  );
  
  const resultUrl = extractAudioUrl(output);
  
  if (!resultUrl) {
    throw new Error("No audio URL received from generation");
  }
  
  return {
    audioUrl: resultUrl,
    duration: normalizedDuration
  };
}

/** Check status of an async prediction by ID */
export async function checkPredictionStatus(predictionId: string): Promise<{
  status: string;
  output?: string;
  error?: string;
}> {
  const replicate = getReplicate();
  
  const prediction = await replicate.predictions.get(predictionId);
  const outputUrl = extractAudioUrl(prediction.output);
  
  return {
    status: prediction.status,
    output: outputUrl || undefined,
    error: prediction.error?.toString()
  };
}

function buildMusicPrompt(params: MusicGenerationParams): string {
  const parts: string[] = [];
  
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

/** Generate short sound effects using MusicGen */
export async function generateSoundEffect(prompt: string, duration?: number): Promise<MusicGenerationResult> {
  const replicate = getReplicate();
  const normalizedDuration = Math.min(Math.max(duration || 5, 3), 15);
  
  const output = await replicate.run(
    "meta/musicgen:b05b1dff1d8c6dc63d14b0cdb42135378dcb87f6373b0d3d341ede46e59e2b38",
    {
      input: {
        prompt: `sound effect: ${prompt}`,
        duration: normalizedDuration,
        model_version: "stereo-melody-large",
        output_format: "mp3"
      }
    }
  );
  
  const audioUrl = extractAudioUrl(output);
  
  if (!audioUrl) {
    throw new Error("No audio URL received from generation");
  }
  
  return {
    audioUrl,
    duration: normalizedDuration
  };
}

/**
 * Start async music generation. Returns prediction ID for status polling.
 * Use checkPredictionStatus() to monitor progress.
 */
export async function startMusicGeneration(params: MusicGenerationParams): Promise<string> {
  const replicate = getReplicate();
  
  const fullPrompt = buildMusicPrompt(params);
  const duration = normalizeDuration(params.duration);
  
  const prediction = await replicate.predictions.create({
    version: "b05b1dff1d8c6dc63d14b0cdb42135378dcb87f6373b0d3d341ede46e59e2b38",
    input: {
      prompt: fullPrompt,
      duration,
      model_version: "stereo-melody-large",
      output_format: "mp3",
      normalization_strategy: "peak"
    }
  });
  
  return prediction.id;
}

export interface SingingVocalsParams {
  lyrics: string;
  voicePreset?: string;
  textTemp?: number;
  waveformTemp?: number;
}

export interface SingingVocalsResult {
  audioUrl: string;
}

/**
 * Generate AI singing vocals using Suno's Bark model.
 * Wraps lyrics in ♪ symbols to trigger singing mode instead of speech.
 * Synchronous operation that waits for generation to complete.
 */
export async function generateSingingVocals(params: SingingVocalsParams): Promise<SingingVocalsResult> {
  const replicate = getReplicate();
  
  const formattedLyrics = `♪ ${params.lyrics.trim()} ♪`;
  
  const output = await replicate.run(
    "suno-ai/bark:b76242b40d67c76ab6742e987628a2a9ac019e11d56ab96c4e91ce03b79b2787",
    {
      input: {
        prompt: formattedLyrics,
        text_temp: params.textTemp ?? 0.7,
        waveform_temp: params.waveformTemp ?? 0.7,
        history_prompt: params.voicePreset || "v2/en_speaker_6"
      }
    }
  );
  
  const audioUrl = extractAudioUrl(output);
  
  if (!audioUrl) {
    throw new Error("No audio URL received from Bark");
  }
  
  return { audioUrl };
}

/**
 * Start async singing vocals generation. Returns prediction ID for status polling.
 * Use checkPredictionStatus() to monitor progress.
 */
export async function startSingingVocals(params: SingingVocalsParams): Promise<string> {
  const replicate = getReplicate();
  
  const formattedLyrics = `♪ ${params.lyrics.trim()} ♪`;
  
  const prediction = await replicate.predictions.create({
    version: "b76242b40d67c76ab6742e987628a2a9ac019e11d56ab96c4e91ce03b79b2787",
    input: {
      prompt: formattedLyrics,
      text_temp: params.textTemp ?? 0.7,
      waveform_temp: params.waveformTemp ?? 0.7,
      history_prompt: params.voicePreset || "v2/en_speaker_6"
    }
  });
  
  return prediction.id;
}

export async function generateMusicWithReference(
  referenceAudioUrl: string,
  prompt: string,
  duration?: number
): Promise<MusicGenerationResult> {
  const replicate = getReplicate();
  const normalizedDuration = normalizeDuration(duration);

  const output = await replicate.run(
    "meta/musicgen:b05b1dff1d8c6dc63d14b0cdb42135378dcb87f6373b0d3d341ede46e59e2b38",
    {
      input: {
        prompt,
        input_audio: referenceAudioUrl,
        duration: normalizedDuration,
        model_version: "stereo-melody-large",
        output_format: "mp3",
        normalization_strategy: "peak"
      }
    }
  );

  const audioUrl = extractAudioUrl(output);
  if (!audioUrl) {
    throw new Error("No audio URL received from generation");
  }

  return { audioUrl, duration: normalizedDuration };
}

export async function startMusicWithReference(
  referenceAudioUrl: string,
  prompt: string,
  duration?: number
): Promise<string> {
  const replicate = getReplicate();
  const normalizedDuration = normalizeDuration(duration);

  const prediction = await replicate.predictions.create({
    version: "b05b1dff1d8c6dc63d14b0cdb42135378dcb87f6373b0d3d341ede46e59e2b38",
    input: {
      prompt,
      input_audio: referenceAudioUrl,
      duration: normalizedDuration,
      model_version: "stereo-melody-large",
      output_format: "mp3",
      normalization_strategy: "peak"
    }
  });

  return prediction.id;
}

/** Available Bark voice presets for singing generation (0-5 male, 6-9 female) */
export const BARK_VOICE_PRESETS = [
  { id: "v2/en_speaker_0", name: "Speaker 0 (Male)", gender: "male" },
  { id: "v2/en_speaker_1", name: "Speaker 1 (Male)", gender: "male" },
  { id: "v2/en_speaker_2", name: "Speaker 2 (Male)", gender: "male" },
  { id: "v2/en_speaker_3", name: "Speaker 3 (Male)", gender: "male" },
  { id: "v2/en_speaker_4", name: "Speaker 4 (Male)", gender: "male" },
  { id: "v2/en_speaker_5", name: "Speaker 5 (Male)", gender: "male" },
  { id: "v2/en_speaker_6", name: "Speaker 6 (Female)", gender: "female" },
  { id: "v2/en_speaker_7", name: "Speaker 7 (Female)", gender: "female" },
  { id: "v2/en_speaker_8", name: "Speaker 8 (Female)", gender: "female" },
  { id: "v2/en_speaker_9", name: "Speaker 9 (Female)", gender: "female" }
] as const;
