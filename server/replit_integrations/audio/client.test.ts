import { Buffer } from "node:buffer";
import { detectAudioFormat } from "./client";

// Mocks for magic bytes
const FLAC_HEADER = Buffer.from([0x66, 0x4c, 0x61, 0x43, 0x00, 0x00, 0x00, 0x22, 0x00, 0x00, 0x00, 0x00]);
const AAC_HEADER = Buffer.from([0xff, 0xf1, 0x4c, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
const MP3_HEADER = Buffer.from([0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]); // ID3
const WAV_HEADER = Buffer.from([0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45]); // RIFF...WAVE
const TEXT_HEADER = Buffer.from("This is a text file not audio");

// Minimal assertion helper
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTests() {
  console.log("Running detectAudioFormat tests...");

  // Test FLAC
  const flacResult = detectAudioFormat(FLAC_HEADER);
  assert(flacResult === "flac", `Expected flac, got ${flacResult}`);
  console.log("✅ FLAC detection passed");

  // Test AAC
  const aacResult = detectAudioFormat(AAC_HEADER);
  assert(aacResult === "aac", `Expected aac, got ${aacResult}`);
  console.log("✅ AAC detection passed");

  // Test MP3
  const mp3Result = detectAudioFormat(MP3_HEADER);
  assert(mp3Result === "mp3", `Expected mp3, got ${mp3Result}`);
  console.log("✅ MP3 detection passed");

  // Test WAV
  const wavResult = detectAudioFormat(WAV_HEADER);
  assert(wavResult === "wav", `Expected wav, got ${wavResult}`);
  console.log("✅ WAV detection passed");

  // Test Text (Unknown)
  const textResult = detectAudioFormat(TEXT_HEADER);
  assert(textResult === "unknown", `Expected unknown, got ${textResult}`);
  console.log("✅ Text file rejection passed");

  console.log("All tests passed!");
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
