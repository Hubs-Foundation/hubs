// Shim for libraries that try to import globalThis as a module
// This provides a fallback for environments where globalThis might not be available
/* global globalThis */
/* eslint-disable no-undef */

// Polyfill for globalThis if it doesn't exist
const getGlobalThis = () => {
  // Check if globalThis is available (ES2020+)
  if (typeof globalThis !== "undefined") return globalThis;
  // Check if window is available (browser)
  if (typeof window !== "undefined") return window;
  // Check if global is available (Node.js)
  if (typeof global !== "undefined") return global;
  // Check if self is available (Web Workers)
  if (typeof self !== "undefined") return self;
  // Fallback - create a new object
  throw new Error("Unable to locate global object");
};

module.exports = getGlobalThis();
