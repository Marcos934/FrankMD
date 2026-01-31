// URL utility functions - Pure functions for URL manipulation
// Extracted for testability

/**
 * Encode path for URL (encode each segment, preserve slashes)
 * @param {string} path - File path to encode
 * @returns {string} - URL-encoded path
 */
export function encodePath(path) {
  if (!path) return ""
  return path.split("/").map(segment => encodeURIComponent(segment)).join("/")
}

/**
 * Extract YouTube video ID from various URL formats
 * @param {string} url - YouTube URL or video ID
 * @returns {string|null} - 11-character video ID or null
 */
export function extractYouTubeId(url) {
  if (!url) return null

  // Match various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/ // Just the ID
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }

  return null
}
