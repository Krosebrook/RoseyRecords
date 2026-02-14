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
 * Sentinel 🛡️: Validates audio file signatures to prevent malicious uploads.
 * Checks for MP3, WAV, OGG, FLAC, and AAC/M4A magic bytes.
 */
export function verifyAudioFileSignature(buffer: Buffer): boolean {
  if (!buffer || buffer.length < 12) return false;

  const header = buffer.subarray(0, 12);

  // MP3: ID3v2 (49 44 33) or Sync Frame (FF FB / FF F3 / FF F2)
  // Note: Sync frame usually starts at byte 0 for raw streams, but ID3 tag is common.
  if (
    (header[0] === 0x49 && header[1] === 0x44 && header[2] === 0x33) ||
    (header[0] === 0xff && (header[1] === 0xfb || header[1] === 0xf3 || header[1] === 0xf2))
  ) {
    return true;
  }

  // WAV: RIFF (52 49 46 46) ... WAVE (57 41 56 45)
  if (
    header[0] === 0x52 &&
    header[1] === 0x49 &&
    header[2] === 0x46 &&
    header[3] === 0x46 &&
    header[8] === 0x57 &&
    header[9] === 0x41 &&
    header[10] === 0x56 &&
    header[11] === 0x45
  ) {
    return true;
  }

  // OGG: OggS (4F 67 67 53)
  if (header[0] === 0x4f && header[1] === 0x67 && header[2] === 0x67 && header[3] === 0x53) {
    return true;
  }

  // FLAC: fLaC (66 4C 61 43)
  if (header[0] === 0x66 && header[1] === 0x4c && header[2] === 0x61 && header[3] === 0x43) {
    return true;
  }

  // AAC/M4A: ftyp (66 74 79 70) usually at offset 4
  if (header[4] === 0x66 && header[5] === 0x74 && header[6] === 0x79 && header[7] === 0x70) {
    return true;
  }

  // AAC ADTS: FF F1 (MPEG-4) or FF F9 (MPEG-2)
  // Sync word is 12 bits of 1s (0xFFF)
  if (header[0] === 0xff && (header[1] & 0xf0) === 0xf0) {
    return true;
  }

  return false;
}
