// Keyboard shortcuts utility - Declarative shortcut definitions and matching
// Extracted from app_controller.js for maintainability

/**
 * Shortcut definitions with key, ctrl, shift, alt, meta modifiers
 * All shortcuts use ctrl on Windows/Linux and meta (Cmd) on macOS
 */
export const SHORTCUTS = {
  newNote:        { key: "n", ctrl: true },
  save:           { key: "s", ctrl: true },
  bold:           { key: "b", ctrl: true },
  italic:         { key: "i", ctrl: true },
  togglePreview:  { key: "V", ctrl: true, shift: true },
  findInFile:     { key: "f", ctrl: true },
  findReplace:    { key: "h", ctrl: true },
  jumpToLine:     { key: "g", ctrl: true },
  lineNumbers:    { key: "l", ctrl: true },
  contentSearch:  { key: "F", ctrl: true, shift: true },
  fileFinder:     { key: "p", ctrl: true },
  toggleSidebar:  { key: "e", ctrl: true },
  typewriterMode: { key: "\\", ctrl: true },
  textFormat:     { key: "m", ctrl: true },
  emojiPicker:    { key: "E", ctrl: true, shift: true },
  help:           { key: "F1" }
}

/**
 * Check if a keyboard event matches a shortcut definition
 * @param {KeyboardEvent} event - The keyboard event
 * @param {Object} shortcut - Shortcut definition with key and modifiers
 * @returns {boolean} - True if the event matches the shortcut
 */
export function matchShortcut(event, shortcut) {
  if (!shortcut || !shortcut.key) return false

  // Check key (case-sensitive for shifted keys like "V" vs "v")
  if (event.key !== shortcut.key) return false

  // Check ctrl/meta (supports both Windows/Linux ctrl and macOS cmd)
  const ctrlOrMeta = event.ctrlKey || event.metaKey
  if (shortcut.ctrl && !ctrlOrMeta) return false
  if (!shortcut.ctrl && ctrlOrMeta) return false

  // Check shift
  if (shortcut.shift && !event.shiftKey) return false
  if (!shortcut.shift && event.shiftKey) return false

  // Check alt
  if (shortcut.alt && !event.altKey) return false
  if (!shortcut.alt && event.altKey) return false

  return true
}

/**
 * Format a shortcut for display (e.g., "Ctrl+Shift+V")
 * @param {Object} shortcut - Shortcut definition
 * @param {boolean} useMac - Use Mac-style formatting (⌘ instead of Ctrl)
 * @returns {string} - Formatted shortcut string
 */
export function formatShortcut(shortcut, useMac = false) {
  if (!shortcut || !shortcut.key) return ""

  const parts = []

  if (shortcut.ctrl) {
    parts.push(useMac ? "⌘" : "Ctrl")
  }
  if (shortcut.shift) {
    parts.push(useMac ? "⇧" : "Shift")
  }
  if (shortcut.alt) {
    parts.push(useMac ? "⌥" : "Alt")
  }

  // Format special keys
  let keyDisplay = shortcut.key
  switch (shortcut.key) {
    case "\\":
      keyDisplay = "\\"
      break
    case "F1":
    case "F2":
    case "F3":
    case "F4":
    case "F5":
    case "F6":
    case "F7":
    case "F8":
    case "F9":
    case "F10":
    case "F11":
    case "F12":
      // Function keys stay as-is
      break
    default:
      // Uppercase single letters for display
      if (keyDisplay.length === 1) {
        keyDisplay = keyDisplay.toUpperCase()
      }
  }

  parts.push(keyDisplay)

  return useMac ? parts.join("") : parts.join("+")
}

/**
 * Detect if running on macOS
 * @returns {boolean}
 */
export function isMacOS() {
  if (typeof navigator === "undefined") return false
  // Use userAgentData if available (modern API), fall back to userAgent
  if (navigator.userAgentData) {
    return navigator.userAgentData.platform === "macOS"
  }
  return /Mac|iPod|iPhone|iPad/.test(navigator.userAgent)
}
