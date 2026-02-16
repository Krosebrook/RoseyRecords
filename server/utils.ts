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

export async function verifyAudioFileSignature(buffer: Buffer): Promise<boolean> {
  if (!buffer || buffer.length < 4) return false;

  const header = buffer.toString("hex", 0, 4).toUpperCase();
  const header12 = buffer.toString("hex", 0, 12).toUpperCase();

  // MP3: ID3 or FF Fx (MPEG frame sync)
  // ID3v2
  if (header.startsWith("494433")) return true;
  // MPEG-1/2 Layer 3 (FF FB, FF F3, FF F2)
  if (header.startsWith("FFF")) return true;

  // WAV: RIFF ... WAVE
  if (header === "52494646" && header12.endsWith("57415645")) {
    return true;
  }

  // OGG: OggS
  if (header === "4F676753") {
    return true;
  }

  // FLAC: fLaC
  if (header === "664C6143") {
    return true;
  }

  // AAC/M4A: ftyp or ADTS
  // ADTS (FF F1 or FF F9) - captured by FFF check above if starts with FFF

  // M4A/MP4 container (ftyp)
  // ftyp is usually at offset 4. "66747970"
  if (header12.includes("66747970")) return true;

  return false;
}
