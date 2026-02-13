import { sanitizeLog, detectAudioMimeType } from "./utils";
import assert from "assert";

console.log("Running sanitization tests...");

const testCases = [
  {
    name: "Redact email",
    input: { id: 1, email: "test@example.com" },
    expected: { id: 1, email: "***REDACTED***" },
  },
  {
    name: "Redact password",
    input: { username: "user", password: "secretPassword" },
    expected: { username: "user", password: "***REDACTED***" },
  },
  {
    name: "Redact nested token",
    input: { auth: { access_token: "xyz123", expires_in: 3600 } },
    expected: { auth: { access_token: "***REDACTED***", expires_in: 3600 } },
  },
  {
    name: "Redact array of users",
    input: [
      { id: 1, firstName: "John", lastName: "Doe" },
      { id: 2, firstName: "Jane", lastName: "Smith" },
    ],
    expected: [
      { id: 1, firstName: "***REDACTED***", lastName: "***REDACTED***" },
      { id: 2, firstName: "***REDACTED***", lastName: "***REDACTED***" },
    ],
  },
  {
    name: "Pass through non-sensitive data",
    input: { id: 123, title: "My Song", lyrics: "Hello world" },
    expected: { id: 123, title: "My Song", lyrics: "Hello world" },
  },
  {
    name: "Handle null and undefined",
    input: { val: null, other: undefined },
    expected: { val: null, other: undefined },
  },
];

let failed = false;

for (const test of testCases) {
  try {
    const result = sanitizeLog(test.input);
    assert.deepStrictEqual(result, test.expected);
    console.log(`✅ ${test.name}`);
  } catch (err) {
    console.error(`❌ ${test.name} FAILED`);
    console.error("Expected:", JSON.stringify(test.expected, null, 2));
    console.error("Actual:", JSON.stringify(sanitizeLog(test.input), null, 2));
    failed = true;
  }
}

console.log("\nRunning file signature verification tests...");

const audioTestCases = [
  {
    name: "Valid MP3 (ID3)",
    input: Buffer.from("494433000000000000000000", "hex"), // Padded to >12 bytes
    expected: "audio/mpeg",
  },
  {
    name: "Valid MP3 (Sync Frame FFFB)",
    input: Buffer.from("fffb00000000000000000000", "hex"),
    expected: "audio/mpeg",
  },
  {
    name: "Valid WAV",
    input: Buffer.from("524946460000000057415645", "hex"), // RIFF....WAVE
    expected: "audio/wav",
  },
  {
    name: "Valid OGG",
    input: Buffer.from("4f6767530000000000000000", "hex"),
    expected: "audio/ogg",
  },
  {
    name: "Valid FLAC",
    input: Buffer.from("664c61430000000000000000", "hex"),
    expected: "audio/flac",
  },
  {
    name: "Valid M4A (M4A brand)",
    input: Buffer.from("00000020667479704d344120", "hex"), // ... ftypM4A
    expected: "audio/mp4",
  },
  {
    name: "Valid M4A (isom brand)",
    input: Buffer.from("000000206674797069736f6d", "hex"), // ... ftypisom
    expected: "audio/mp4",
  },
  {
    name: "Invalid M4A (unknown brand)",
    input: Buffer.from("000000206674797078787878", "hex"), // ... ftypxxxx
    expected: null,
  },
  {
    name: "Valid ADTS AAC (FFF1)",
    input: Buffer.from("fff100000000000000000000", "hex"),
    expected: "audio/aac",
  },
  {
    name: "Invalid: Text File",
    input: Buffer.from("Hello world this is a text file"),
    expected: null,
  },
  {
    name: "Invalid: PNG Image",
    input: Buffer.from("89504e470d0a1a0a0000000d", "hex"),
    expected: null,
  },
  {
    name: "Invalid: Empty Buffer",
    input: Buffer.alloc(0),
    expected: null,
  },
  {
    name: "Invalid: Too short (<12 bytes)",
    input: Buffer.from("49443300", "hex"),
    expected: null,
  },
];

for (const test of audioTestCases) {
  try {
    const result = detectAudioMimeType(test.input);
    assert.strictEqual(result, test.expected);
    console.log(`✅ ${test.name}`);
  } catch (err) {
    console.error(`❌ ${test.name} FAILED`);
    console.error("Expected:", test.expected);
    console.error("Actual:", detectAudioMimeType(test.input));
    failed = true;
  }
}

if (failed) {
  console.error("Some tests failed.");
  process.exit(1);
} else {
  console.log("All tests passed!");
}
