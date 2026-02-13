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

export function verifyAudioFileSignature(buffer: Buffer): boolean {
  if (!buffer || buffer.length < 4) return false;

  const header = buffer.subarray(0, 12).toString("hex");

  // MP3: ID3 (49 44 33) or Sync frame (FF FB, FF F3, FF F2)
  if (
    header.startsWith("494433") ||
    header.startsWith("fffb") ||
    header.startsWith("fff3") ||
    header.startsWith("fff2")
  )
    return true;

  // WAV: RIFF (52 49 46 46) ... WAVE (57 41 56 45 at offset 8)
  // header.slice(16, 24) corresponds to bytes 8-11
  if (header.startsWith("52494646") && header.slice(16, 24) === "57415645")
    return true;

  // OGG: OggS (4F 67 67 53)
  if (header.startsWith("4f676753")) return true;

  // FLAC: fLaC (66 4C 61 43)
  if (header.startsWith("664c6143")) return true;

  // M4A/AAC: ftyp (66 74 79 70) at offset 4, followed by M4A brand (4D 34 41 20)
  // header.slice(8, 16) corresponds to bytes 4-7 (ftyp)
  // Need to check bytes 8-11 for major brand, which requires reading more
  if (header.slice(8, 16) === "66747970") {
    // Check if we have enough bytes for the major brand (need at least 12 bytes)
    if (buffer.length >= 12) {
      const majorBrand = buffer.subarray(8, 12).toString("hex");
      // Accept M4A (4D 34 41 20), M4B (4D 34 42 20), M4P (4D 34 50 20)
      // Reject generic MP4 brands like isom, mp41, mp42
      if (
        majorBrand === "4d344120" || // M4A (with space)
        majorBrand === "4d344220" || // M4B (audiobook)
        majorBrand === "4d345020"    // M4P (protected)
      ) {
        return true;
      }
    }
    return false;
  }

  // ADTS AAC: FFF1 or FFF9
  if (header.startsWith("fff1") || header.startsWith("fff9")) return true;

  return false;
}
