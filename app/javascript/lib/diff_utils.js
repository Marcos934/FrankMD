// Diff utility functions - Pure functions for text diffing
// Extracted for testability

/**
 * Tokenize text into words while preserving whitespace
 * @param {string} text - Text to tokenize
 * @returns {string[]} - Array of tokens
 */
export function tokenize(text) {
  const tokens = []
  const regex = /(\s+|\S+)/g
  let match
  while ((match = regex.exec(text)) !== null) {
    tokens.push(match[0])
  }
  return tokens
}

/**
 * Compute word-level diff between original and corrected text
 * @param {string} original - Original text
 * @param {string} corrected - Corrected text
 * @returns {Array<{type: string, value: string}>} - Diff operations
 */
export function computeWordDiff(original, corrected) {
  const oldTokens = tokenize(original)
  const newTokens = tokenize(corrected)

  // Simple LCS-based diff
  const diff = lcsWordDiff(oldTokens, newTokens)
  return diff
}

/**
 * LCS-based word diff algorithm
 * @param {string[]} oldTokens - Original tokens
 * @param {string[]} newTokens - New tokens
 * @returns {Array<{type: string, value: string}>} - Diff operations (equal, insert, delete)
 */
export function lcsWordDiff(oldTokens, newTokens) {
  const m = oldTokens.length
  const n = newTokens.length

  // Build LCS table
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldTokens[i - 1] === newTokens[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  // Backtrack to find diff
  const diff = []
  let i = m, j = n
  const tempDiff = []

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldTokens[i - 1] === newTokens[j - 1]) {
      tempDiff.unshift({ type: "equal", value: oldTokens[i - 1] })
      i--
      j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      tempDiff.unshift({ type: "insert", value: newTokens[j - 1] })
      j--
    } else {
      tempDiff.unshift({ type: "delete", value: oldTokens[i - 1] })
      i--
    }
  }

  // Merge consecutive operations of the same type
  for (const item of tempDiff) {
    if (diff.length > 0 && diff[diff.length - 1].type === item.type) {
      diff[diff.length - 1].value += item.value
    } else {
      diff.push({ ...item })
    }
  }

  return diff
}
