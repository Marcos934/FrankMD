// Typewriter mode utility functions - Pure functions for typewriter calculations
// Extracted from app_controller.js for testability

/**
 * Calculate the scroll position to keep cursor at target position in viewport
 * @param {number} cursorY - Cursor Y position relative to text content
 * @param {number} viewportHeight - Visible height of the editor
 * @param {number} targetRatio - Where to position cursor (0.5 = center)
 * @returns {number} - Scroll position in pixels
 */
export function calculateTypewriterScroll(cursorY, viewportHeight, targetRatio = 0.5) {
  const targetY = viewportHeight * targetRatio
  const desiredScrollTop = cursorY - targetY
  return Math.max(0, desiredScrollTop)
}

/**
 * Get sync data for typewriter mode preview synchronization
 * @param {string} text - Full text content
 * @param {number} cursorPos - Current cursor position
 * @returns {Object} - { currentLine, totalLines }
 */
export function getTypewriterSyncData(text, cursorPos) {
  const textBeforeCursor = text.substring(0, cursorPos)
  const currentLine = textBeforeCursor.split("\n").length
  const totalLines = text.split("\n").length

  return { currentLine, totalLines }
}

/**
 * Calculate scroll ratio for preview sync in typewriter mode
 * Uses line-based calculation for smooth syncing
 * @param {number} currentLine - Current line number (1-based)
 * @param {number} totalLines - Total lines in document
 * @returns {number} - Scroll ratio (0 to 1)
 */
export function calculateTypewriterSyncRatio(currentLine, totalLines) {
  if (totalLines <= 1) return 0
  return Math.max(0, Math.min(1, (currentLine - 1) / (totalLines - 1)))
}
