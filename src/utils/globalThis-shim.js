// Shim for libraries that try to import globalThis as a module
/* global globalThis */
module.exports = globalThis;
