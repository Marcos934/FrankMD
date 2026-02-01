// Test setup file for Vitest
// Provides mocks for DOM APIs not supported in JSDOM

// Mock Range.getClientRects for CodeMirror compatibility
// JSDOM doesn't implement getClientRects, which CodeMirror uses for measurements
if (typeof Range !== 'undefined') {
  Range.prototype.getClientRects = function() {
    return {
      length: 0,
      item: () => null,
      [Symbol.iterator]: function* () {}
    }
  }
  Range.prototype.getBoundingClientRect = function() {
    return {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      toJSON: () => ({})
    }
  }
}

// Mock requestAnimationFrame if not available
if (typeof globalThis.requestAnimationFrame === 'undefined') {
  globalThis.requestAnimationFrame = (callback) => setTimeout(callback, 0)
  globalThis.cancelAnimationFrame = (id) => clearTimeout(id)
}
