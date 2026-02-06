import Replicate from "replicate";

const ACE_STEP_MODEL = "lucataco/ace-step:280fc4f9ee507577f880a167f639c02622421d8fecf492454320311217b688f1";
const MIN_DURATION = 15;
const MAX_DURATION = 240;

const getReplicate = () => {
  if (!process.env.REPLICATE_API_KEY) {
    throw new Error("REPLICATE_API_KEY is not configured");
  }
  return new Replicate({
    auth: process.env.REPLICATE_API_KEY,
  });
};

export interface AceStepParams {
  tags: string;
  lyrics?: string;
  duration?: number;
  seed?: number;
}

export interface AceStepResult {
  audioUrl: string;
  duration: number;
}

function normalizeDuration(duration?: number): number {
  if (!duration) return 60;
  return Math.min(Math.max(duration, MIN_DURATION), MAX_DURATION);
}

function extractAudioUrl(output: unknown): string {
  if (typeof output === "string") return output;
  if (output && typeof output === "object" && "url" in output) {
    return (output as { url: () => string }).url();
  }
  if (Array.isArray(output) && output.length > 0) {
    const first = output[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object" && "url" in first) {
      return typeof first.url === "function" ? first.url() : String(first.url);
    }
  }
  if (output && typeof output === "object" && "output" in output) {
    return extractAudioUrl((output as { output: unknown }).output);
  }
  return "";
}

export async function generateMusic(params: AceStepParams): Promise<AceStepResult> {
  const replicate = getReplicate();
  const duration = normalizeDuration(params.duration);

  const input: Record<string, unknown> = {
    tags: params.tags,
    duration,
  };

  if (params.lyrics) {
    input.lyrics = params.lyrics;
  }

  if (params.seed !== undefined && params.seed >= 0) {
    input.seed = params.seed;
  }

  const output = await replicate.run(ACE_STEP_MODEL, { input });

  const audioUrl = extractAudioUrl(output);
  if (!audioUrl) {
    throw new Error("No audio URL received from ACE-Step");
  }

  return { audioUrl, duration };
}

export async function startGeneration(params: AceStepParams): Promise<string> {
  const replicate = getReplicate();
  const duration = normalizeDuration(params.duration);

  const input: Record<string, unknown> = {
    tags: params.tags,
    duration,
  };

  if (params.lyrics) {
    input.lyrics = params.lyrics;
  }

  if (params.seed !== undefined && params.seed >= 0) {
    input.seed = params.seed;
  }

  const prediction = await replicate.predictions.create({
    version: "280fc4f9ee507577f880a167f639c02622421d8fecf492454320311217b688f1",
    input,
  });

  return prediction.id;
}

export async function checkStatus(predictionId: string): Promise<{
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
    error: prediction.error?.toString(),
  };
}

export function isConfigured(): boolean {
  return !!process.env.REPLICATE_API_KEY;
}

export function getConfig() {
  return {
    configured: isConfigured(),
    maxDuration: MAX_DURATION,
    minDuration: MIN_DURATION,
    defaultDuration: 60,
    features: [
      "Full songs with vocals",
      "50+ language support",
      "Commercial-grade quality",
      "Up to 4 minute tracks",
    ],
    durationOptions: [
      { value: 30, label: "30s" },
      { value: 60, label: "1 min" },
      { value: 90, label: "1.5 min" },
      { value: 120, label: "2 min" },
      { value: 180, label: "3 min" },
      { value: 240, label: "4 min" },
    ],
  };
}
