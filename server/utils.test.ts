import { sanitizeLog, verifyAudioFileSignature } from "./utils";
import assert from "assert";

console.log("Running sanitization tests...");

const sanitizationTestCases = [
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
  {
    name: "Prevent log injection with newlines",
    input: { filename: "test\ninjection\r\nattack.txt" },
    expected: { filename: "testinjectionattack.txt" },
  },
];

let failed = false;

for (const test of sanitizationTestCases) {
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

console.log("\nRunning file signature tests...");

const signatureTestCases = [
  {
    name: "Valid MP3 (ID3)",
    input: Buffer.from([0x49, 0x44, 0x33, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
    expected: true,
  },
  {
    name: "Valid MP3 (Sync Frame)",
    input: Buffer.from([0xFF, 0xFB, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
    expected: true,
  },
  {
    name: "Valid MP3 (MPEG-1 Layer III - FF FA)",
    input: Buffer.from([0xFF, 0xFA, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
    expected: true,
  },
  {
    name: "Valid MP3 (MPEG-2 Layer III - FF F2)",
    input: Buffer.from([0xFF, 0xF2, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
    expected: true,
  },
  {
    name: "Valid MP3 (MPEG-2.5 Layer III - FF E3)",
    input: Buffer.from([0xFF, 0xE3, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
    expected: true,
  },
  {
    name: "Valid MP3 (MPEG-2.5 Layer III - FF E2)",
    input: Buffer.from([0xFF, 0xE2, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
    expected: true,
  },
  {
    name: "Valid WAV",
    input: Buffer.from([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45]),
    expected: true,
  },
  {
    name: "Valid OGG",
    input: Buffer.from([0x4F, 0x67, 0x67, 0x53, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
    expected: true,
  },
  {
    name: "Valid FLAC",
    input: Buffer.from([0x66, 0x4C, 0x61, 0x43, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
    expected: true,
  },
  {
    name: "Valid M4A (M4A brand)",
    input: Buffer.from([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x4D, 0x34, 0x41, 0x20]), // ftypM4A
    expected: true,
  },
  {
    name: "Valid M4A (M4B brand)",
    input: Buffer.from([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x4D, 0x34, 0x42, 0x20]), // ftypM4B
    expected: true,
  },
  {
    name: "Valid M4B (ftyp)",
    input: Buffer.from([0x00, 0x00, 0x00, 0x1C, 0x66, 0x74, 0x79, 0x70, 0x4D, 0x34, 0x42, 0x20]),
    expected: true,
  },
  {
    name: "Valid M4P (ftyp)",
    input: Buffer.from([0x00, 0x00, 0x00, 0x1C, 0x66, 0x74, 0x79, 0x70, 0x4D, 0x34, 0x50, 0x20]),
    expected: true,
  },
  {
    name: "Invalid MP4 video (ftyp + isom brand)",
    input: Buffer.from([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6F, 0x6D]),
    expected: false,
  },
  {
    name: "Valid AAC (ADTS)",
    input: Buffer.from([0xFF, 0xF1, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
    expected: true,
  },
  {
    name: "Valid AAC (ADTS MPEG-2)",
    input: Buffer.from([0xFF, 0xF9, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
    expected: true,
  },
  {
    name: "Invalid Text File",
    input: Buffer.from("This is a text file content"),
    expected: false,
  },
  {
    name: "Invalid EXE (MZ header)",
    input: Buffer.from([0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00]),
    expected: false,
  },
  {
    name: "Invalid UTF-16 LE BOM (ADTS false positive check)",
    input: Buffer.from([0xFF, 0xFE, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
    expected: false,
  },
  {
    name: "Empty Buffer",
    input: Buffer.alloc(0),
    expected: false,
  },
  {
    name: "Short Buffer",
    input: Buffer.from([0xFF, 0xFB]),
    expected: false,
  },
];

for (const test of signatureTestCases) {
  try {
    const result = verifyAudioFileSignature(test.input);
    assert.strictEqual(result, test.expected);
    console.log(`✅ ${test.name}`);
  } catch (err) {
    console.error(`❌ ${test.name} FAILED`);
    console.error("Expected:", test.expected);
    console.error("Actual:", verifyAudioFileSignature(test.input));
    failed = true;
  }
}

if (failed) {
  console.error("\nSome tests failed.");
  process.exit(1);
} else {
  console.log("\nAll tests passed!");
}
