// Markdown utility functions - Pure functions for markdown analysis
// Extracted for testability

/**
 * Find a markdown table at the given cursor position
 * @param {string} text - Full document text
 * @param {number} pos - Cursor position
 * @returns {object|null} - Table info with startPos, endPos, lines, or null if not in table
 */
export function findTableAtPosition(text, pos) {
  const lines = text.split("\n")
  let lineStart = 0
  let currentLine = 0

  // Find which line the cursor is on
  for (let i = 0; i < lines.length; i++) {
    const lineEnd = lineStart + lines[i].length
    if (pos >= lineStart && pos <= lineEnd) {
      currentLine = i
      break
    }
    lineStart = lineEnd + 1 // +1 for newline
  }

  // Check if current line looks like a table row
  const line = lines[currentLine]
  if (!line || !line.trim().startsWith("|")) {
    return null
  }

  // Find table boundaries (search up and down for table rows)
  let startLine = currentLine
  let endLine = currentLine

  // Search upward
  while (startLine > 0 && lines[startLine - 1].trim().startsWith("|")) {
    startLine--
  }

  // Search downward
  while (endLine < lines.length - 1 && lines[endLine + 1].trim().startsWith("|")) {
    endLine++
  }

  // Need at least 2 lines (header + separator)
  if (endLine - startLine < 1) {
    return null
  }

  // Calculate positions
  let startPos = 0
  for (let i = 0; i < startLine; i++) {
    startPos += lines[i].length + 1
  }

  let endPos = startPos
  for (let i = startLine; i <= endLine; i++) {
    endPos += lines[i].length + 1
  }
  endPos-- // Remove trailing newline

  return {
    startLine,
    endLine,
    startPos,
    endPos,
    lines: lines.slice(startLine, endLine + 1)
  }
}

/**
 * Find a fenced code block at the given cursor position
 * @param {string} text - Full document text
 * @param {number} pos - Cursor position
 * @returns {object|null} - Code block info with startPos, endPos, language, content, or null
 */
export function findCodeBlockAtPosition(text, pos) {
  // Find fenced code blocks using regex
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g
  let match

  while ((match = codeBlockRegex.exec(text)) !== null) {
    const startPos = match.index
    const endPos = match.index + match[0].length

    if (pos >= startPos && pos <= endPos) {
      return {
        startPos,
        endPos,
        language: match[1],
        content: match[2]
      }
    }
  }

  return null
}

/**
 * Generate Hugo blog post frontmatter and path
 * @param {string} title - Blog post title
 * @returns {object} - { notePath, content } with path and frontmatter
 */
export function generateHugoBlogPost(title) {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")

  // Generate slug from title
  const slug = slugify(title)

  // Build path: YYYY/MM/DD/slug/index.md
  const dirPath = `${year}/${month}/${day}/${slug}`
  const notePath = `${dirPath}/index.md`

  // Generate ISO date with timezone offset
  const tzOffset = -now.getTimezoneOffset()
  const tzHours = String(Math.floor(Math.abs(tzOffset) / 60)).padStart(2, "0")
  const tzMins = String(Math.abs(tzOffset) % 60).padStart(2, "0")
  const tzSign = tzOffset >= 0 ? "+" : "-"
  const isoDate = `${year}-${month}-${day}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}${tzSign}${tzHours}${tzMins}`

  // Generate Hugo frontmatter
  const content = `---
title: "${title.replace(/"/g, '\\"')}"
slug: "${slug}"
date: ${isoDate}
draft: true
tags:
-
---

`

  return { notePath, content }
}

/**
 * Slugify text for URLs - handles accented characters
 * @param {string} text - Text to slugify
 * @returns {string} - URL-safe slug
 */
export function slugify(text) {
  // Map of accented characters to their ASCII equivalents
  const accentMap = {
    "à": "a", "á": "a", "â": "a", "ã": "a", "ä": "a", "å": "a", "æ": "ae",
    "ç": "c", "č": "c", "ć": "c",
    "è": "e", "é": "e", "ê": "e", "ë": "e", "ě": "e",
    "ì": "i", "í": "i", "î": "i", "ï": "i",
    "ð": "d", "ď": "d",
    "ñ": "n", "ň": "n",
    "ò": "o", "ó": "o", "ô": "o", "õ": "o", "ö": "o", "ø": "o",
    "ù": "u", "ú": "u", "û": "u", "ü": "u", "ů": "u",
    "ý": "y", "ÿ": "y",
    "ž": "z", "ź": "z", "ż": "z",
    "ß": "ss", "þ": "th",
    "š": "s", "ś": "s",
    "ř": "r",
    "ł": "l",
    "À": "A", "Á": "A", "Â": "A", "Ã": "A", "Ä": "A", "Å": "A", "Æ": "AE",
    "Ç": "C", "Č": "C", "Ć": "C",
    "È": "E", "É": "E", "Ê": "E", "Ë": "E", "Ě": "E",
    "Ì": "I", "Í": "I", "Î": "I", "Ï": "I",
    "Ð": "D", "Ď": "D",
    "Ñ": "N", "Ň": "N",
    "Ò": "O", "Ó": "O", "Ô": "O", "Õ": "O", "Ö": "O", "Ø": "O",
    "Ù": "U", "Ú": "U", "Û": "U", "Ü": "U", "Ů": "U",
    "Ý": "Y",
    "Ž": "Z", "Ź": "Z", "Ż": "Z",
    "Š": "S", "Ś": "S",
    "Ř": "R",
    "Ł": "L"
  }

  return text
    .toLowerCase()
    // Replace accented characters
    .split("")
    .map(char => accentMap[char] || char)
    .join("")
    // Replace any non-alphanumeric characters with hyphens
    .replace(/[^a-z0-9]+/g, "-")
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, "")
    // Collapse multiple hyphens
    .replace(/-+/g, "-")
}
