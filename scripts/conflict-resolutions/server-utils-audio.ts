// CORRECT Audio MIME Detection
// Merge from PR #33 and PR #38

// In server/utils.ts:

// Brand constants for M4A validation
const M4A_BRAND = "4d344120"; // M4A 
const M4B_BRAND = "4d344220"; // M4B 
const M4P_BRAND = "4d345020"; // M4P 

export function detectAudioMimeType(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;
  
  const header = buffer.subarray(0, 12).toString("hex");
  
  // MP3
  if (header.startsWith("fffb") || header.startsWith("fff3") || header.startsWith("494433")) {
    return "audio/mpeg";
  }
  
  // WAV
  if (header.startsWith("52494646") && buffer.subarray(8, 12).toString("hex") === "57415645") {
    return "audio/wav";
  }
  
  // OGG
  if (header.startsWith("4f676753")) {
    return "audio/ogg";
  }
  
  // FLAC
  if (header.startsWith("664c6143")) {
    return "audio/flac";
  }
  
  // M4A/MP4 - CHECK MAJOR BRAND (tighter validation from PR #38)
  if (header.slice(8, 16) === "66747970") { // ftyp
    if (buffer.length >= 12) {
      const majorBrand = buffer.subarray(8, 12).toString("hex");
      
      // Only accept audio-specific brands
      if (majorBrand === M4A_BRAND || majorBrand === M4B_BRAND || majorBrand === M4P_BRAND) {
        return "audio/mp4";
      }
      // Reject generic MP4 brands (isom, mp41, mp42)
      return null;
    }
  }
  
  // ADTS AAC
  if (header.startsWith("fff1") || header.startsWith("fff9")) {
    return "audio/aac";
  }
  
  return null;
}
