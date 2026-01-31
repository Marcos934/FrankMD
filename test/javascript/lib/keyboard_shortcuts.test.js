/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest"
import {
  SHORTCUTS,
  matchShortcut,
  formatShortcut,
  isMacOS
} from "../../../app/javascript/lib/keyboard_shortcuts"

describe("SHORTCUTS", () => {
  it("contains expected shortcut definitions", () => {
    expect(SHORTCUTS.newNote).toEqual({ key: "n", ctrl: true })
    expect(SHORTCUTS.save).toEqual({ key: "s", ctrl: true })
    expect(SHORTCUTS.bold).toEqual({ key: "b", ctrl: true })
    expect(SHORTCUTS.italic).toEqual({ key: "i", ctrl: true })
    expect(SHORTCUTS.togglePreview).toEqual({ key: "V", ctrl: true, shift: true })
    expect(SHORTCUTS.findInFile).toEqual({ key: "f", ctrl: true })
    expect(SHORTCUTS.findReplace).toEqual({ key: "h", ctrl: true })
    expect(SHORTCUTS.help).toEqual({ key: "F1" })
  })
})

describe("matchShortcut", () => {
  // Helper to create a mock keyboard event
  function createEvent(key, { ctrl = false, shift = false, alt = false, meta = false } = {}) {
    return {
      key,
      ctrlKey: ctrl,
      shiftKey: shift,
      altKey: alt,
      metaKey: meta
    }
  }

  it("matches simple ctrl+key shortcuts", () => {
    const event = createEvent("s", { ctrl: true })
    expect(matchShortcut(event, SHORTCUTS.save)).toBe(true)
  })

  it("matches meta+key shortcuts (macOS cmd)", () => {
    const event = createEvent("s", { meta: true })
    expect(matchShortcut(event, SHORTCUTS.save)).toBe(true)
  })

  it("matches ctrl+shift+key shortcuts", () => {
    const event = createEvent("V", { ctrl: true, shift: true })
    expect(matchShortcut(event, SHORTCUTS.togglePreview)).toBe(true)
  })

  it("rejects wrong key", () => {
    const event = createEvent("x", { ctrl: true })
    expect(matchShortcut(event, SHORTCUTS.save)).toBe(false)
  })

  it("rejects missing ctrl modifier", () => {
    const event = createEvent("s", { ctrl: false })
    expect(matchShortcut(event, SHORTCUTS.save)).toBe(false)
  })

  it("rejects extra shift modifier", () => {
    const event = createEvent("s", { ctrl: true, shift: true })
    expect(matchShortcut(event, SHORTCUTS.save)).toBe(false)
  })

  it("rejects missing shift modifier", () => {
    const event = createEvent("V", { ctrl: true, shift: false })
    expect(matchShortcut(event, SHORTCUTS.togglePreview)).toBe(false)
  })

  it("matches function keys without modifiers", () => {
    const event = createEvent("F1")
    expect(matchShortcut(event, SHORTCUTS.help)).toBe(true)
  })

  it("rejects function key with extra modifiers", () => {
    const event = createEvent("F1", { ctrl: true })
    expect(matchShortcut(event, SHORTCUTS.help)).toBe(false)
  })

  it("returns false for null/undefined shortcut", () => {
    const event = createEvent("s", { ctrl: true })
    expect(matchShortcut(event, null)).toBe(false)
    expect(matchShortcut(event, undefined)).toBe(false)
  })

  it("returns false for shortcut without key", () => {
    const event = createEvent("s", { ctrl: true })
    expect(matchShortcut(event, {})).toBe(false)
    expect(matchShortcut(event, { ctrl: true })).toBe(false)
  })
})

describe("formatShortcut", () => {
  it("formats simple ctrl+key shortcuts", () => {
    expect(formatShortcut(SHORTCUTS.save)).toBe("Ctrl+S")
    expect(formatShortcut(SHORTCUTS.bold)).toBe("Ctrl+B")
  })

  it("formats ctrl+shift+key shortcuts", () => {
    expect(formatShortcut(SHORTCUTS.togglePreview)).toBe("Ctrl+Shift+V")
    expect(formatShortcut(SHORTCUTS.contentSearch)).toBe("Ctrl+Shift+F")
  })

  it("formats function keys", () => {
    expect(formatShortcut(SHORTCUTS.help)).toBe("F1")
  })

  it("formats backslash key", () => {
    expect(formatShortcut(SHORTCUTS.typewriterMode)).toBe("Ctrl+\\")
  })

  it("uses Mac-style formatting when requested", () => {
    expect(formatShortcut(SHORTCUTS.save, true)).toBe("⌘S")
    expect(formatShortcut(SHORTCUTS.togglePreview, true)).toBe("⌘⇧V")
  })

  it("returns empty string for null/undefined", () => {
    expect(formatShortcut(null)).toBe("")
    expect(formatShortcut(undefined)).toBe("")
    expect(formatShortcut({})).toBe("")
  })
})

describe("isMacOS", () => {
  it("returns a boolean", () => {
    expect(typeof isMacOS()).toBe("boolean")
  })
})
