import { queryClient } from "./queryClient";
import assert from "assert";

console.log("Running React Query retry logic tests...");

const testCases = [
  {
    name: "Should retry on 500 server error",
    error: new Error("500: Internal Server Error"),
    failureCount: 0,
    expected: true,
  },
  {
    name: "Should retry on 503 service unavailable",
    error: new Error("503: Service Unavailable"),
    failureCount: 1,
    expected: true,
  },
  {
    name: "Should not retry on 400 bad request",
    error: new Error("400: Bad Request"),
    failureCount: 0,
    expected: false,
  },
  {
    name: "Should not retry on 401 unauthorized",
    error: new Error("401: Unauthorized"),
    failureCount: 0,
    expected: false,
  },
  {
    name: "Should not retry on 404 not found",
    error: new Error("404: Not Found"),
    failureCount: 0,
    expected: false,
  },
  {
    name: "Should not retry after 3 attempts",
    error: new Error("500: Internal Server Error"),
    failureCount: 3,
    expected: false,
  },
  {
    name: "Should retry on network error",
    error: new Error("Network request failed"),
    failureCount: 0,
    expected: true,
  },
];

const mutationTestCases = [
  {
    name: "Mutation should retry once on 500 error",
    error: new Error("500: Internal Server Error"),
    failureCount: 0,
    expected: true,
  },
  {
    name: "Mutation should not retry after 1 attempt",
    error: new Error("500: Internal Server Error"),
    failureCount: 1,
    expected: false,
  },
  {
    name: "Mutation should not retry on 400 error",
    error: new Error("400: Bad Request"),
    failureCount: 0,
    expected: false,
  },
];

let failed = false;

console.log("\n=== Testing Query Retry Logic ===");
const queryRetry = queryClient.getDefaultOptions().queries?.retry;
if (typeof queryRetry === "function") {
  for (const test of testCases) {
    try {
      const result = queryRetry(test.failureCount, test.error);
      assert.strictEqual(result, test.expected);
      console.log(`✅ ${test.name}`);
    } catch (err) {
      console.error(`❌ ${test.name} FAILED`);
      console.error(`Expected: ${test.expected}`);
      console.error(
        `Actual: ${queryRetry(test.failureCount, test.error)}`,
      );
      failed = true;
    }
  }
} else {
  console.error("❌ Query retry is not a function");
  failed = true;
}

console.log("\n=== Testing Mutation Retry Logic ===");
const mutationRetry = queryClient.getDefaultOptions().mutations?.retry;
if (typeof mutationRetry === "function") {
  for (const test of mutationTestCases) {
    try {
      const result = mutationRetry(test.failureCount, test.error);
      assert.strictEqual(result, test.expected);
      console.log(`✅ ${test.name}`);
    } catch (err) {
      console.error(`❌ ${test.name} FAILED`);
      console.error(`Expected: ${test.expected}`);
      console.error(
        `Actual: ${mutationRetry(test.failureCount, test.error)}`,
      );
      failed = true;
    }
  }
} else {
  console.error("❌ Mutation retry is not a function");
  failed = true;
}

console.log("\n=== Testing Retry Delay ===");
const retryDelay = queryClient.getDefaultOptions().queries?.retryDelay;
if (typeof retryDelay === "function") {
  const delays = [
    { attempt: 0, expected: 1000 },
    { attempt: 1, expected: 2000 },
    { attempt: 2, expected: 4000 },
    { attempt: 3, expected: 8000 },
    { attempt: 4, expected: 16000 },
    { attempt: 5, expected: 30000 }, // Should cap at 30000
  ];

  for (const test of delays) {
    try {
      const result = retryDelay(test.attempt);
      assert.strictEqual(result, test.expected);
      console.log(
        `✅ Retry delay for attempt ${test.attempt}: ${result}ms`,
      );
    } catch (err) {
      console.error(
        `❌ Retry delay for attempt ${test.attempt} FAILED`,
      );
      console.error(`Expected: ${test.expected}ms`);
      console.error(`Actual: ${retryDelay(test.attempt)}ms`);
      failed = true;
    }
  }
} else {
  console.error("❌ Retry delay is not a function");
  failed = true;
}

if (failed) {
  console.error("\n❌ Some tests failed.");
  process.exit(1);
} else {
  console.log("\n✅ All retry logic tests passed!");
}
