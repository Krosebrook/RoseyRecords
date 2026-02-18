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

export function detectAudioFormat(buffer: Buffer): string | null {
  if (!buffer || buffer.length < 4) return null;

  // WAV: RIFF .... WAVE
  if (buffer.length >= 12 &&
      buffer.toString('hex', 0, 4) === '52494646' &&
      buffer.toString('hex', 8, 12) === '57415645') {
    return 'audio/wav';
  }

  // MP3: ID3
  if (buffer.toString('hex', 0, 3) === '494433') {
    return 'audio/mpeg';
  }

  // AAC: ADTS Header
  // Sync (12 bits) means first 4 bits of byte 1 are 1.
  // Layer (bits 1,2 of byte 1) is 00.
  // Mask 0xF6 (1111 0110) should result in 0xF0 (1111 0000)
  if (buffer[0] === 0xFF && (buffer[1] & 0xF6) === 0xF0) {
    return 'audio/aac';
  }

  // MP3: Frame Sync (11 bits) means first 3 bits of byte 1 are 1.
  // Layer (bits 1,2 of byte 1) is NOT 00.
  if (buffer[0] === 0xFF && (buffer[1] & 0xE0) === 0xE0 && (buffer[1] & 0x06) !== 0x00) {
    return 'audio/mpeg';
  }

  // OGG: OggS
  if (buffer.toString('utf8', 0, 4) === 'OggS') {
    return 'audio/ogg';
  }

  // FLAC: fLaC
  if (buffer.toString('utf8', 0, 4) === 'fLaC') {
    return 'audio/flac';
  }

  // M4A/AAC (MP4 container): ftypM4A or ftypmp42 or similar
  // Looking for 'ftyp' at offset 4
  if (buffer.length >= 8 && buffer.toString('utf8', 4, 8) === 'ftyp') {
    return 'audio/mp4'; // Covers m4a, mp4 audio
  }

  return null;
}
