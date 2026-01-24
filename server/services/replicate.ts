import Replicate from "replicate";

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

export async function generateMusic(params: MusicGenerationParams): Promise<MusicGenerationResult> {
  const replicate = getReplicate();
  
  const fullPrompt = buildMusicPrompt(params);
  const duration = normalizeDuration(params.duration);
  
  const output = await replicate.run(
    "meta/musicgen:671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb",
    {
      input: {
        prompt: fullPrompt,
        duration,
        model_version: "stereo-large",
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

export async function generateMusicFromMelody(
  inputAudioUrl: string, 
  prompt: string,
  duration?: number
): Promise<MusicGenerationResult> {
  const replicate = getReplicate();
  const normalizedDuration = normalizeDuration(duration);
  
  const output = await replicate.run(
    "meta/musicgen:671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb",
    {
      input: {
        prompt,
        input_audio: inputAudioUrl,
        duration: normalizedDuration,
        model_version: "stereo-large",
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

export async function generateSoundEffect(prompt: string, duration?: number): Promise<MusicGenerationResult> {
  const replicate = getReplicate();
  const normalizedDuration = Math.min(Math.max(duration || 5, 3), 15);
  
  const output = await replicate.run(
    "meta/musicgen:671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb",
    {
      input: {
        prompt: `sound effect: ${prompt}`,
        duration: normalizedDuration,
        model_version: "stereo-melody",
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

export async function startMusicGeneration(params: MusicGenerationParams): Promise<string> {
  const replicate = getReplicate();
  
  const fullPrompt = buildMusicPrompt(params);
  const duration = normalizeDuration(params.duration);
  
  const prediction = await replicate.predictions.create({
    version: "671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb",
    input: {
      prompt: fullPrompt,
      duration,
      model_version: "stereo-large",
      output_format: "mp3",
      normalization_strategy: "peak"
    }
  });
  
  return prediction.id;
}
