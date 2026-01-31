// Text editor utility functions - Pure functions for text manipulation
// Extracted from app_controller.js for testability

/**
 * Wrap selected text with prefix and suffix
 * @param {string} text - Full text content
 * @param {number} start - Selection start position
 * @param {number} end - Selection end position
 * @param {string} prefix - Text to insert before selection
 * @param {string} suffix - Text to insert after selection
 * @returns {Object} - { text, cursorStart, cursorEnd }
 */
export function wrapSelection(text, start, end, prefix, suffix) {
  const before = text.substring(0, start)
  const selected = text.substring(start, end)
  const after = text.substring(end)

  const newText = before + prefix + selected + suffix + after

  return {
    text: newText,
    cursorStart: start + prefix.length,
    cursorEnd: end + prefix.length
  }
}

/**
 * Insert text at a specific position
 * @param {string} text - Full text content
 * @param {number} position - Position to insert at
 * @param {string} insertion - Text to insert
 * @returns {Object} - { text, cursorPosition }
 */
export function insertAtPosition(text, position, insertion) {
  const before = text.substring(0, position)
  const after = text.substring(position)

  return {
    text: before + insertion + after,
    cursorPosition: position + insertion.length
  }
}

/**
 * Get line boundaries for a selection
 * @param {string} text - Full text content
 * @param {number} start - Selection start position
 * @param {number} end - Selection end position
 * @returns {Object} - { lineStart, lineEnd, lines }
 */
export function getLineBoundaries(text, start, end) {
  // Find start of first line
  const lineStart = text.lastIndexOf("\n", start - 1) + 1

  // Find end of last line
  const lineEndPos = text.indexOf("\n", end - 1)
  const lineEnd = lineEndPos === -1 ? text.length : lineEndPos

  // Get the lines
  const selectedText = text.substring(lineStart, lineEnd)
  const lines = selectedText.split("\n")

  return { lineStart, lineEnd, lines }
}

/**
 * Get cursor position info (line and column)
 * @param {string} text - Full text content
 * @param {number} cursorPos - Cursor position
 * @returns {Object} - { line, column, totalLines }
 */
export function getCursorInfo(text, cursorPos) {
  const textBeforeCursor = text.substring(0, cursorPos)
  const line = textBeforeCursor.split("\n").length
  const lastNewline = textBeforeCursor.lastIndexOf("\n")
  const column = cursorPos - lastNewline

  const totalLines = text.split("\n").length

  return { line, column, totalLines }
}

/**
 * Get the line number at a given position
 * @param {string} text - Full text content
 * @param {number} position - Position in text
 * @returns {number} - Line number (1-based)
 */
export function getLineAtPosition(text, position) {
  return text.substring(0, position).split("\n").length
}

/**
 * Get character position for the start of a line
 * @param {string} text - Full text content
 * @param {number} lineNumber - Line number (1-based)
 * @returns {number} - Character position
 */
export function getPositionForLine(text, lineNumber) {
  const lines = text.split("\n")
  let position = 0

  for (let i = 0; i < lineNumber - 1 && i < lines.length; i++) {
    position += lines[i].length + 1 // +1 for newline
  }

  return position
}

/**
 * Replace text in a range and return new content with cursor info
 * @param {string} text - Full text content
 * @param {number} start - Start position to replace
 * @param {number} end - End position to replace
 * @param {string} replacement - Replacement text
 * @returns {Object} - { text, cursorPosition }
 */
export function replaceRange(text, start, end, replacement) {
  const before = text.substring(0, start)
  const after = text.substring(end)

  return {
    text: before + replacement + after,
    cursorPosition: start + replacement.length
  }
}
