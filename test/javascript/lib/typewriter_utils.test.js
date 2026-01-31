/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest"
import {
  calculateTypewriterScroll,
  getTypewriterSyncData,
  calculateTypewriterSyncRatio
} from "../../../app/javascript/lib/typewriter_utils"

describe("calculateTypewriterScroll", () => {
  it("returns 0 when cursor is at top", () => {
    // cursorY = 50, viewportHeight = 500, targetRatio = 0.5
    // targetY = 500 * 0.5 = 250
    // desiredScrollTop = 50 - 250 = -200 -> 0
    expect(calculateTypewriterScroll(50, 500)).toBe(0)
  })

  it("calculates scroll to center cursor", () => {
    // cursorY = 500, viewportHeight = 400, targetRatio = 0.5
    // targetY = 400 * 0.5 = 200
    // desiredScrollTop = 500 - 200 = 300
    expect(calculateTypewriterScroll(500, 400)).toBe(300)
  })

  it("uses custom target ratio", () => {
    // cursorY = 500, viewportHeight = 400, targetRatio = 0.3
    // targetY = 400 * 0.3 = 120
    // desiredScrollTop = 500 - 120 = 380
    expect(calculateTypewriterScroll(500, 400, 0.3)).toBe(380)
  })

  it("never returns negative", () => {
    expect(calculateTypewriterScroll(0, 500)).toBe(0)
    expect(calculateTypewriterScroll(100, 500)).toBe(0)
  })

  it("handles cursor near top of viewport", () => {
    // cursorY = 200, viewportHeight = 500, targetRatio = 0.5
    // targetY = 250
    // desiredScrollTop = 200 - 250 = -50 -> 0
    expect(calculateTypewriterScroll(200, 500)).toBe(0)
  })
})

describe("getTypewriterSyncData", () => {
  it("returns line 1 at start of text", () => {
    const result = getTypewriterSyncData("line1\nline2\nline3", 0)
    expect(result.currentLine).toBe(1)
    expect(result.totalLines).toBe(3)
  })

  it("returns correct line in middle", () => {
    const result = getTypewriterSyncData("line1\nline2\nline3", 8) // middle of line2
    expect(result.currentLine).toBe(2)
    expect(result.totalLines).toBe(3)
  })

  it("returns last line at end", () => {
    const text = "line1\nline2\nline3"
    const result = getTypewriterSyncData(text, text.length)
    expect(result.currentLine).toBe(3)
    expect(result.totalLines).toBe(3)
  })

  it("handles single line", () => {
    const result = getTypewriterSyncData("single line", 5)
    expect(result.currentLine).toBe(1)
    expect(result.totalLines).toBe(1)
  })

  it("handles empty text", () => {
    const result = getTypewriterSyncData("", 0)
    expect(result.currentLine).toBe(1)
    expect(result.totalLines).toBe(1)
  })

  it("returns correct line at start of new line", () => {
    const result = getTypewriterSyncData("line1\nline2", 6) // right after newline
    expect(result.currentLine).toBe(2)
  })
})

describe("calculateTypewriterSyncRatio", () => {
  it("returns 0 for first line", () => {
    expect(calculateTypewriterSyncRatio(1, 100)).toBe(0)
  })

  it("returns 1 for last line", () => {
    expect(calculateTypewriterSyncRatio(100, 100)).toBe(1)
  })

  it("returns 0.5 for middle line", () => {
    // (50 - 1) / (100 - 1) = 49/99 ≈ 0.495
    const result = calculateTypewriterSyncRatio(50, 100)
    expect(result).toBeCloseTo(0.495, 2)
  })

  it("handles single line document", () => {
    expect(calculateTypewriterSyncRatio(1, 1)).toBe(0)
  })

  it("clamps to valid range", () => {
    expect(calculateTypewriterSyncRatio(0, 100)).toBe(0)
    expect(calculateTypewriterSyncRatio(200, 100)).toBe(1)
  })

  it("handles edge case with 2 lines", () => {
    expect(calculateTypewriterSyncRatio(1, 2)).toBe(0)
    expect(calculateTypewriterSyncRatio(2, 2)).toBe(1)
  })
})
