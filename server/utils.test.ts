import { sanitizeLog } from "./utils";
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

if (failed) {
  console.error("Some tests failed.");
  process.exit(1);
} else {
  console.log("All tests passed!");
}
