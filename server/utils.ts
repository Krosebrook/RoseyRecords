import { Buffer } from "node:buffer";

export function sanitizeLog(data: any): any {
  if (!data || typeof data !== "object") {
    return data;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeLog(item));
  }

  // Handle objects
  const SENSITIVE_PATTERNS = [
    /password/i,
    /token/i,
    /secret/i,
    /authorization/i,
    /cookie/i,
    /email/i,
    /credit.*card/i,
    /cvv/i,
    /api[-_]?key/i,
    /first[-_]?name/i,
    /last[-_]?name/i,
    /full[-_]?name/i,
    /phone/i,
    /ssn/i,
  ];

  const sanitized: Record<string, any> = { ...data };

  for (const key of Object.keys(sanitized)) {
    // Check if key matches any sensitive pattern
    if (SENSITIVE_PATTERNS.some((pattern) => pattern.test(key))) {
      sanitized[key] = "***REDACTED***";
    } else if (typeof sanitized[key] === "object" && sanitized[key] !== null) {
      // Recursively sanitize objects
      sanitized[key] = sanitizeLog(sanitized[key]);
    }
  }

  return sanitized;
}

export type AudioFormat = "wav" | "mp3" | "webm" | "mp4" | "ogg" | "flac" | "aac" | "unknown";

/**
 * Detect audio format from buffer magic bytes.
 * Supports: WAV, MP3, WebM (Chrome/Firefox), MP4/M4A/MOV (Safari/iOS), OGG, FLAC, AAC
 */
export function detectAudioFormat(buffer: Buffer): AudioFormat {
  if (buffer.length < 12) return "unknown";

  // WAV: RIFF....WAVE
  // WAV: RIFF....WAVE
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x41 && buffer[10] === 0x56 && buffer[11] === 0x45
  ) {
    return "wav";
  }
  // WebM: EBML header
  if (buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3) {
    return "webm";
  }
  // MP3: ID3 tag or frame sync
  if (
    (buffer[0] === 0xff && (buffer[1] === 0xfb || buffer[1] === 0xfa || buffer[1] === 0xf3)) ||
    (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33)
  ) {
    return "mp3";
  }
  // MP4/M4A/MOV: ....ftyp
  if (buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70) {
    return "mp4";
  }
  // OGG: OggS
  if (buffer[0] === 0x4f && buffer[1] === 0x67 && buffer[2] === 0x67 && buffer[3] === 0x53) {
    return "ogg";
  }
  // FLAC: fLaC
  if (buffer[0] === 0x66 && buffer[1] === 0x4c && buffer[2] === 0x61 && buffer[3] === 0x43) {
    return "flac";
  }
  // AAC: ADTS header (FFF1 or FFF9 usually)
  // Sync word 111111111111 (12 bits)
  if (buffer[0] === 0xff && (buffer[1] & 0xf0) === 0xf0) {
    return "aac";
  }

  return "unknown";
}
