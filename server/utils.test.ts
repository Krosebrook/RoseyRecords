import { sanitizeLog, detectAudioFormat } from "./utils";
import assert from "assert";

console.log("Running sanitization tests...");

const sanitizeTestCases = [
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

for (const test of sanitizeTestCases) {
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

console.log("\nRunning detectAudioFormat tests...");

const audioTestCases = [
  {
    name: "Detect MP3 (ID3)",
    input: Buffer.from("49443300000000000000", "hex"),
    expected: "audio/mpeg"
  },
  {
    name: "Detect WAV",
    input: Buffer.from("524946460000000057415645", "hex"),
    expected: "audio/wav"
  },
  {
    name: "Detect OGG",
    input: Buffer.from("OggS00020000000000000000", "utf8"),
    expected: "audio/ogg"
  },
  {
    name: "Detect FLAC",
    input: Buffer.from("fLaC00000022", "utf8"),
    expected: "audio/flac"
  },
  {
    name: "Detect M4A/MP4 (ftypM4A)",
    input: Buffer.from("00000020667479704d344120", "hex"), // ...ftypM4A
    expected: "audio/mp4"
  },
  {
    name: "Detect AAC (ADTS FFF)",
    input: Buffer.from("FFF15080", "hex"),
    expected: "audio/aac"
  },
  {
    name: "Reject Text File",
    input: Buffer.from("Just a text file", "utf8"),
    expected: null
  },
  {
    name: "Reject Empty Buffer",
    input: Buffer.alloc(0),
    expected: null
  },
  {
    name: "Reject Short Buffer",
    input: Buffer.alloc(3),
    expected: null
  }
];

for (const test of audioTestCases) {
  try {
    const result = detectAudioFormat(test.input);
    assert.strictEqual(result, test.expected, `Expected ${test.expected} but got ${result}`);
    console.log(`✅ ${test.name}`);
  } catch (err: any) {
    console.error(`❌ ${test.name} FAILED`);
    console.error(err.message);
    failed = true;
  }
}

if (failed) {
  console.error("\nSome tests failed.");
  process.exit(1);
} else {
  console.log("\nAll tests passed!");
}
