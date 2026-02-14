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
    } else if (typeof sanitized[key] === "string") {
      // Prevent log injection by removing newlines from strings
      sanitized[key] = sanitized[key].replace(/[\r\n]/g, '');
    } else if (typeof sanitized[key] === "object" && sanitized[key] !== null) {
      // Recursively sanitize objects
      sanitized[key] = sanitizeLog(sanitized[key]);
    }
  }

  return sanitized;
}

/**
 * Validates audio file signatures to prevent malicious uploads.
 * Checks for MP3, WAV, OGG, FLAC, and AAC/M4A magic bytes.
 */
export function verifyAudioFileSignature(buffer: Buffer): boolean {
  if (!buffer || buffer.length < 12) return false;

  const header = buffer.subarray(0, 12);

  // MP3: ID3v2 (49 44 33) or sync frame:
  //   - MPEG-1 Layer III:   FF FB / FF FA
  //   - MPEG-2 Layer III:   FF F3 / FF F2
  //   - MPEG-2.5 Layer III: FF E3 / FF E2
  // Note: Sync frame usually starts at byte 0 for raw streams, but ID3 tag is common.
  if (
    (header[0] === 0x49 && header[1] === 0x44 && header[2] === 0x33) ||
    (header[0] === 0xff &&
      (header[1] === 0xfb ||
        header[1] === 0xfa ||
        header[1] === 0xf3 ||
        header[1] === 0xf2 ||
        header[1] === 0xe3 ||
        header[1] === 0xe2))
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

  // AAC/M4A: ISO BMFF with ftyp (66 74 79 70) at offset 4 and audio-specific major brand
  if (header[4] === 0x66 && header[5] === 0x74 && header[6] === 0x79 && header[7] === 0x70) {
    const majorBrand = header.toString("ascii", 8, 12);
    const allowedM4ABrands = new Set(["M4A ", "M4B ", "M4P "]);
    if (allowedM4ABrands.has(majorBrand)) {
      return true;
    }
  }

  // AAC ADTS: FF F1 (MPEG-4) or FF F9 (MPEG-2)
  // Sync word is 0xFFF in the first 12 bits (byte 0 = 0xFF, high nibble of byte 1 = 0xF)
  // We check for the common header patterns to avoid overlap with MP3 sync frames.
  if (header[0] === 0xff && (header[1] === 0xf1 || header[1] === 0xf9)) {
    return true;
  }

  return false;
}
