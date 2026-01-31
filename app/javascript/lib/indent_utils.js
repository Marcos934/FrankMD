// Indentation utility functions - Pure functions for text indentation
// Extracted from app_controller.js for testability

/**
 * Parse indent setting: 0 = tab, 1-6 = spaces (default 2)
 * @param {string|number|undefined|null} value - The indent setting value
 * @returns {string} - The indent string (spaces or tab)
 */
export function parseIndentSetting(value) {
  if (value === undefined || value === null || value === "") {
    return "  " // Default: 2 spaces
  }
  const num = parseInt(value, 10)
  if (isNaN(num) || num < 0) {
    return "  " // Default: 2 spaces
  }
  if (num === 0) {
    return "\t" // Tab character
  }
  // Clamp to 1-6 spaces
  const spaces = Math.min(Math.max(num, 1), 6)
  return " ".repeat(spaces)
}

/**
 * Add indentation to each line of text
 * @param {string} text - Text to indent
 * @param {string} indent - Indent string to prepend
 * @returns {string} - Indented text
 */
export function indentLines(text, indent) {
  return text.split("\n").map(line => indent + line).join("\n")
}

/**
 * Remove one level of indentation from each line
 * @param {string} text - Text to unindent
 * @param {string} indent - Indent string to remove
 * @returns {string} - Unindented text
 */
export function unindentLines(text, indent) {
  return text.split("\n").map(line => {
    // Try to remove the exact indent string first
    if (line.startsWith(indent)) {
      return line.substring(indent.length)
    }
    // If indent is spaces, try removing up to that many leading spaces
    if (indent !== "\t") {
      const indentLength = indent.length
      let removeCount = 0
      for (let i = 0; i < Math.min(indentLength, line.length); i++) {
        if (line[i] === " ") {
          removeCount++
        } else {
          break
        }
      }
      if (removeCount > 0) {
        return line.substring(removeCount)
      }
    }
    // Try removing a single tab if present
    if (line.startsWith("\t")) {
      return line.substring(1)
    }
    return line
  }).join("\n")
}
