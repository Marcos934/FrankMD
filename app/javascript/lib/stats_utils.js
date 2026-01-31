// Stats utility functions - Pure functions for document statistics
// Extracted for testability

/**
 * Calculate document statistics
 * @param {string} text - Document text
 * @returns {object} - { wordCount, charCount, byteSize, readTimeMinutes }
 */
export function calculateStats(text) {
  if (!text) {
    return {
      wordCount: 0,
      charCount: 0,
      byteSize: 0,
      readTimeMinutes: 0
    }
  }

  // Word count
  const words = text.trim().split(/\s+/).filter(w => w.length > 0)
  const wordCount = words.length

  // Character count
  const charCount = text.length

  // File size (bytes)
  const byteSize = new Blob([text]).size

  // Estimated reading time (average 200 words per minute)
  const wordsPerMinute = 200
  const readTimeMinutes = Math.ceil(wordCount / wordsPerMinute)

  return {
    wordCount,
    charCount,
    byteSize,
    readTimeMinutes
  }
}

/**
 * Format read time for display
 * @param {number} minutes - Reading time in minutes
 * @returns {string} - Formatted read time string
 */
export function formatReadTime(minutes) {
  if (minutes <= 1) return "< 1 min"
  return `${minutes} min`
}

/**
 * Format file size in human-readable format
 * @param {number} bytes - Size in bytes
 * @returns {string} - Human-readable size string
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return "0 B"
  const units = ["B", "KB", "MB", "GB"]
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const size = bytes / Math.pow(k, i)
  // Show decimal only for KB and above, and only if meaningful
  if (i === 0) return `${bytes} B`
  return `${size.toFixed(size < 10 ? 1 : 0)} ${units[i]}`
}
