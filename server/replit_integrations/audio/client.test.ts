
import { detectAudioFormat } from "./client";
import { Buffer } from "node:buffer";
import assert from "assert";

console.log("Testing detectAudioFormat...");

// Helper to pad buffer to 12 bytes
function pad(b: Buffer) {
    const p = Buffer.alloc(12);
    b.copy(p);
    return p;
}

const flacHeader = Buffer.from([0x66, 0x4c, 0x61, 0x43]);
const aacHeader1 = Buffer.from([0xff, 0xf0]);
const aacHeader2 = Buffer.from([0xff, 0xf1]);
const aacHeader3 = Buffer.from([0xff, 0xf8]);
const aacHeader4 = Buffer.from([0xff, 0xf9]);
const mp3Header1 = Buffer.from([0xff, 0xfb]);
const wavHeader = Buffer.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x41, 0x56, 0x45]);
const unknownHeader = Buffer.from([0, 0, 0, 0]);

assert.strictEqual(detectAudioFormat(pad(flacHeader)), "flac", "FLAC detection failed");
assert.strictEqual(detectAudioFormat(pad(aacHeader1)), "aac", "AAC 1 detection failed");
assert.strictEqual(detectAudioFormat(pad(aacHeader2)), "aac", "AAC 2 detection failed");
assert.strictEqual(detectAudioFormat(pad(aacHeader3)), "aac", "AAC 3 detection failed");
assert.strictEqual(detectAudioFormat(pad(aacHeader4)), "aac", "AAC 4 detection failed");
assert.strictEqual(detectAudioFormat(pad(mp3Header1)), "mp3", "MP3 detection failed");
assert.strictEqual(detectAudioFormat(pad(wavHeader)), "wav", "WAV detection failed");
assert.strictEqual(detectAudioFormat(pad(unknownHeader)), "unknown", "Unknown detection failed");

console.log("All tests passed!");
