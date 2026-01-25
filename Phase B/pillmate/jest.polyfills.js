// This file runs BEFORE jest-expo setup
// It sets up the global environment to prevent Object.defineProperty errors

// Ensure global objects exist
global.window = global.window || {};
global.document = global.document || {};
global.navigator = global.navigator || {};

// Mock console methods if needed
if (!global.console.debug) {
  global.console.debug = console.log;
}

// Set up minimal DOM-like environment
if (typeof global.window !== 'undefined' && !global.window.navigator) {
  global.window.navigator = {};
}

// Note: Additional mocks are handled by patch-jest-expo.sh which patches
// the jest-expo setup file directly to handle React 19 compatibility issues
