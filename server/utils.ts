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

  const magic = buffer.toString('hex', 0, 4).toUpperCase();
  const magicWithOffset = buffer.toString('hex', 4, 8).toUpperCase();

  // MP3: ID3 (49 44 33) or Sync Frame (starts with FFF)
  // standard MP3 sync is 11 set bits (FFE0) but typically FF FB / FF F3 / FF F2
  if (magic.startsWith('494433') || magic.startsWith('FFF')) return true;

  // WAV: RIFF (52 49 46 46) ... WAVE (57 41 56 45 at offset 8)
  if (magic === '52494646' && buffer.toString('hex', 8, 12).toUpperCase() === '57415645') return true;

  // OGG: OggS (4F 67 67 53)
  if (magic === '4F676753') return true;

  // FLAC: fLaC (66 4C 61 43)
  if (magic === '664C6143') return true;

  // AAC/M4A: ftyp (66 74 79 70) at offset 4
  // usually ....ftypM4A, ....ftypmp42, ....ftypisom
  if (magicWithOffset === '66747970') return true;

  return false;
}
