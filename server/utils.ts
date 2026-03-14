import { Buffer } from "node:buffer";
import type { Response } from "express";

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
  // Sync word is 0xFFF in the first 12 bits (byte 0 = 0xFF, high nibble of byte 1 = 0xF)
  // 0xF1 = MPEG-4 Audio without CRC, 0xF9 = MPEG-4 Audio with CRC
  if (buffer[0] === 0xFF && (buffer[1] === 0xF1 || buffer[1] === 0xF9)) {
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

  // M4A: ISO BMFF with 'ftyp' at offset 4 and an audio-specific major brand
  // Only accept M4A , M4B , M4P  brands; reject generic MP4 brands like 'isom'
  if (buffer.length >= 12 && buffer.toString('utf8', 4, 8) === 'ftyp') {
    const majorBrand = buffer.toString('ascii', 8, 12);
    const allowedM4ABrands = new Set(['M4A ', 'M4B ', 'M4P ']);
    if (allowedM4ABrands.has(majorBrand)) {
      return 'audio/mp4';
    }
  }

  return null;
}

// Helper to validate numeric IDs from route params
export function parseNumericId(value: string, res: Response): number | null {
  const id = Number(value);
  if (isNaN(id) || !Number.isInteger(id) || id < 1) {
    res.status(400).json({ message: 'Invalid ID parameter' });
    return null;
  }
  return id;
}

// Helper to validate external URLs and prevent SSRF
export function isValidExternalUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);

    // Only allow HTTP/HTTPS
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false;
    }

    const hostname = url.hostname;

    // Reject localhost and IP representations of localhost
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '[::1]' ||
      hostname.endsWith('.localhost')
    ) {
      return false;
    }

    let ipToCheck = hostname;

    // Convert integer IP to dotted decimal string if necessary
    if (/^\d+$/.test(hostname)) {
      const num = parseInt(hostname, 10);
      ipToCheck = `${(num >> 24) & 255}.${(num >> 16) & 255}.${(num >> 8) & 255}.${num & 255}`;
    }

    // If it's an IP address, check against restricted ranges
    // This regex ensures we only match IPs, not domains like "10.com"
    const isIpRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    if (isIpRegex.test(ipToCheck)) {
      if (
        /^127\./.test(ipToCheck) || // Localhost
        /^10\./.test(ipToCheck) || // Private network
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ipToCheck) || // Private network
        /^192\.168\./.test(ipToCheck) || // Private network
        /^169\.254\./.test(ipToCheck) // Link-local / Cloud metadata
      ) {
        return false;
      }
    }

    // Also reject explicit cloud metadata IPs in other formats
    if (hostname === '0xA9FEA9FE' || hostname === '0251.0376.0251.0376') {
      return false;
    }

    return true;
  } catch (e) {
    // Invalid URL parsing
    return false;
  }
}
