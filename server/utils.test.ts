import { sanitizeLog, verifyAudioFileSignature } from "./utils";
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

console.log("\nRunning audio signature tests...");

const audioTestCases = [
  {
    name: "MP3 ID3",
    input: Buffer.from("49443300", "hex"), // ID3...
    expected: true,
  },
  {
    name: "MP3 Sync",
    input: Buffer.from("FFF30000", "hex"), // FFF3...
    expected: true,
  },
  {
    name: "WAV RIFF",
    // RIFF....WAVE
    input: Buffer.from("524946460000000057415645", "hex"),
    expected: true,
  },
  {
    name: "OGG",
    input: Buffer.from("4F67675300", "hex"), // OggS...
    expected: true,
  },
  {
    name: "FLAC",
    input: Buffer.from("664C614300", "hex"), // fLaC...
    expected: true,
  },
  {
    name: "AAC/M4A ftyp",
    // ....ftyp
    input: Buffer.from("0000000066747970", "hex"),
    expected: true,
  },
  {
    name: "Invalid Text File",
    input: Buffer.from("Hello world this is text"),
    expected: false,
  },
  {
    name: "Empty Buffer",
    input: Buffer.alloc(0),
    expected: false,
  },
  {
    name: "Executable (ELF)",
    input: Buffer.from("7F454C46", "hex"),
    expected: false,
  },
  {
    name: "Executable (PE/EXE)",
    input: Buffer.from("4D5A9000", "hex"),
    expected: false,
  },
];

for (const test of audioTestCases) {
  try {
    const result = verifyAudioFileSignature(test.input);
    assert.strictEqual(result, test.expected);
    console.log(`✅ ${test.name}`);
  } catch (err) {
    console.error(`❌ ${test.name} FAILED`);
    console.error(`Expected: ${test.expected}, Actual: ${!test.expected}`); // Assuming boolean flip for display
    failed = true;
  }
}

if (failed) {
  console.error("Some tests failed.");
  process.exit(1);
} else {
  console.log("All tests passed!");
}
