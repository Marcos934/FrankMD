// Tree utility functions - Pure functions for file tree manipulation
// Extracted for testability

/**
 * Flatten a nested tree structure to a flat list of files
 * @param {Array} items - Tree items (folders and files)
 * @param {Array} result - Accumulator for results (internal use)
 * @returns {Array} - Flat array of file items
 */
export function flattenTree(items, result = []) {
  if (!items) return result
  for (const item of items) {
    if (item.type === "file") {
      result.push(item)
    } else if (item.type === "folder" && item.children) {
      flattenTree(item.children, result)
    }
  }
  return result
}
