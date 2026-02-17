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

  // Magic bytes constants
  const SIGNATURES = {
    ID3: Buffer.from([0x49, 0x44, 0x33]),
    RIFF: Buffer.from([0x52, 0x49, 0x46, 0x46]),
    WAVE: Buffer.from([0x57, 0x41, 0x56, 0x45]),
    OGG: Buffer.from([0x4F, 0x67, 0x67, 0x53]),
    FLAC: Buffer.from([0x66, 0x4C, 0x61, 0x43]),
    FTYP: Buffer.from([0x66, 0x74, 0x79, 0x70]),
  };

  // MP3: ID3v2 tag or Sync Frame.
  // Sync frame: FF Fx (MPEG-1 Layer III: FF FB/FA, MPEG-2 Layer III: FF F3/F2, MPEG-2.5 Layer III: FF E3/E2)
  // We explicitly check for Layer III to avoid false positives like UTF-16 LE BOM (FF FE) which looks like MPEG-1 Layer I.
  const isMp3 =
    header.subarray(0, 3).equals(SIGNATURES.ID3) ||
    (header[0] === 0xff && (
      header[1] === 0xfb || header[1] === 0xfa || // MPEG-1 Layer III
      header[1] === 0xf3 || header[1] === 0xf2 || // MPEG-2 Layer III
      header[1] === 0xe3 || header[1] === 0xe2    // MPEG-2.5 Layer III
    ));

  // WAV: RIFF header with WAVE format
  const isWav =
    header.subarray(0, 4).equals(SIGNATURES.RIFF) &&
    header.subarray(8, 12).equals(SIGNATURES.WAVE);

  // OGG: OggS capture pattern
  const isOgg = header.subarray(0, 4).equals(SIGNATURES.OGG);

  // FLAC: fLaC marker
  const isFlac = header.subarray(0, 4).equals(SIGNATURES.FLAC);

  // M4A/MP4: ftyp box at offset 4 AND valid audio brand
  // Brands: M4A, M4B, M4P
  const isM4a =
    header.subarray(4, 8).equals(SIGNATURES.FTYP) &&
    (header.subarray(8, 12).equals(Buffer.from("M4A ")) ||
     header.subarray(8, 12).equals(Buffer.from("M4B ")) ||
     header.subarray(8, 12).equals(Buffer.from("M4P ")));

  // AAC ADTS: Sync word is 0xFFF in the first 12 bits (byte 0 = 0xFF, high nibble of byte 1 = 0xF)
  // We check specifically for MPEG-4 (0xF1) and MPEG-2 (0xF9) to avoid overlap with MP3 sync frames
  const isAacAdts = header[0] === 0xff && (header[1] === 0xf1 || header[1] === 0xf9);

  return isMp3 || isWav || isOgg || isFlac || isM4a || isAacAdts;
}
