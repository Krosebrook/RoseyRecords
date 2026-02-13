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

/**
 * Detects the MIME type of an audio file based on its magic bytes.
 * Returns the MIME type string if valid, or null if invalid/unknown.
 *
 * Supported formats: MP3, WAV, OGG, FLAC, M4A/AAC
 */
export function detectAudioMimeType(buffer: Buffer): string | null {
  if (!buffer || buffer.length < 12) return null;

  const header = buffer.subarray(0, 12).toString("hex");

  const SIGNATURES = {
    MP3_ID3: "494433",
    MP3_SYNC_FB: "fffb",
    MP3_SYNC_F3: "fff3",
    MP3_SYNC_F2: "fff2",
    WAV_RIFF: "52494646",
    WAV_WAVE: "57415645",
    OGG: "4f676753",
    FLAC: "664c6143",
    M4A_FTYP: "66747970",
    AAC_ADTS_F1: "fff1",
    AAC_ADTS_F9: "fff9",
  };

  // MP3
  if (
    header.startsWith(SIGNATURES.MP3_ID3) ||
    header.startsWith(SIGNATURES.MP3_SYNC_FB) ||
    header.startsWith(SIGNATURES.MP3_SYNC_F3) ||
    header.startsWith(SIGNATURES.MP3_SYNC_F2)
  ) {
    return "audio/mpeg";
  }

  // WAV
  if (
    header.startsWith(SIGNATURES.WAV_RIFF) &&
    header.slice(16, 24) === SIGNATURES.WAV_WAVE
  ) {
    return "audio/wav";
  }

  // OGG
  if (header.startsWith(SIGNATURES.OGG)) {
    return "audio/ogg";
  }

  // FLAC
  if (header.startsWith(SIGNATURES.FLAC)) {
    return "audio/flac";
  }

  // M4A/AAC (ISO BMFF)
  if (header.slice(8, 16) === SIGNATURES.M4A_FTYP) {
    // Check major brand (bytes 8-11)
    const brand = header.slice(16, 24);
    const validBrands = [
      "4d344120", // "M4A "
      "4d344220", // "M4B "
    ];
    if (validBrands.some((b) => brand.startsWith(b))) {
      return "audio/mp4";
    }
  }

  // ADTS AAC
  if (
    header.startsWith(SIGNATURES.AAC_ADTS_F1) ||
    header.startsWith(SIGNATURES.AAC_ADTS_F9)
  ) {
    return "audio/aac";
  }

  return null;
}
