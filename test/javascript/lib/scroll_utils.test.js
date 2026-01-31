/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest"
import {
  calculateScrollRatio,
  calculateScrollForLine,
  calculateLineFromScroll,
  calculateSyncedScrollPosition,
  calculateScrollToCenterLine
} from "../../../app/javascript/lib/scroll_utils"

describe("calculateScrollRatio", () => {
  it("returns 0 when at top", () => {
    expect(calculateScrollRatio(0, 1000, 200)).toBe(0)
  })

  it("returns 1 when at bottom", () => {
    // scrollTop = 800, scrollHeight = 1000, clientHeight = 200
    // maxScroll = 1000 - 200 = 800
    expect(calculateScrollRatio(800, 1000, 200)).toBe(1)
  })

  it("returns 0.5 when at middle", () => {
    expect(calculateScrollRatio(400, 1000, 200)).toBe(0.5)
  })

  it("clamps to 0-1 range", () => {
    expect(calculateScrollRatio(-100, 1000, 200)).toBe(0)
    expect(calculateScrollRatio(1000, 1000, 200)).toBe(1)
  })

  it("returns 0 when content fits in viewport", () => {
    expect(calculateScrollRatio(0, 200, 200)).toBe(0)
    expect(calculateScrollRatio(0, 100, 200)).toBe(0)
  })
})

describe("calculateScrollForLine", () => {
  it("returns 0 for line 1 with default offset", () => {
    // (1 - 1) * 20 - 500 * 0.35 = 0 - 175 = -175 -> 0
    expect(calculateScrollForLine(1, 20, 500)).toBe(0)
  })

  it("calculates scroll for middle line", () => {
    // Line 50, lineHeight 20, viewportHeight 500, offsetRatio 0.35
    // (50 - 1) * 20 - 500 * 0.35 = 980 - 175 = 805
    expect(calculateScrollForLine(50, 20, 500)).toBe(805)
  })

  it("uses custom offset ratio", () => {
    // Line 50, lineHeight 20, viewportHeight 500, offsetRatio 0.5
    // (50 - 1) * 20 - 500 * 0.5 = 980 - 250 = 730
    expect(calculateScrollForLine(50, 20, 500, 0.5)).toBe(730)
  })

  it("never returns negative", () => {
    expect(calculateScrollForLine(1, 20, 1000)).toBe(0)
    expect(calculateScrollForLine(2, 20, 1000)).toBe(0)
  })
})

describe("calculateLineFromScroll", () => {
  it("returns line at center of viewport when at top", () => {
    // scrollTop = 0, clientHeight = 200, scrollHeight = 2000, totalLines = 100
    // lineHeight = 2000 / 100 = 20
    // centerY = 0 + 100 = 100
    // centerLine = round(100 / 20) = 5
    expect(calculateLineFromScroll(0, 200, 2000, 100)).toBe(5)
  })

  it("returns middle line when scrolled to middle", () => {
    // scrollTop = 900, clientHeight = 200, scrollHeight = 2000, totalLines = 100
    // lineHeight = 2000 / 100 = 20
    // centerY = 900 + 100 = 1000
    // centerLine = round(1000 / 20) = 50
    expect(calculateLineFromScroll(900, 200, 2000, 100)).toBe(50)
  })

  it("returns last line when scrolled to bottom", () => {
    // scrollTop = 1800, clientHeight = 200, scrollHeight = 2000, totalLines = 100
    // lineHeight = 20
    // centerY = 1800 + 100 = 1900
    // centerLine = round(1900 / 20) = 95
    expect(calculateLineFromScroll(1800, 200, 2000, 100)).toBe(95)
  })

  it("clamps to valid range", () => {
    expect(calculateLineFromScroll(0, 200, 2000, 100)).toBeGreaterThanOrEqual(1)
    expect(calculateLineFromScroll(1800, 200, 2000, 100)).toBeLessThanOrEqual(100)
  })

  it("handles edge case of 0 lines", () => {
    expect(calculateLineFromScroll(0, 200, 200, 0)).toBe(1)
  })
})

describe("calculateSyncedScrollPosition", () => {
  it("returns 0 for ratio 0", () => {
    expect(calculateSyncedScrollPosition(0, 1000, 200)).toBe(0)
  })

  it("returns max scroll for ratio 1", () => {
    // maxScroll = 1000 - 200 = 800
    expect(calculateSyncedScrollPosition(1, 1000, 200)).toBe(800)
  })

  it("returns proportional scroll for ratio 0.5", () => {
    expect(calculateSyncedScrollPosition(0.5, 1000, 200)).toBe(400)
  })

  it("handles when content fits in viewport", () => {
    expect(calculateSyncedScrollPosition(0.5, 200, 200)).toBe(0)
    expect(calculateSyncedScrollPosition(0.5, 100, 200)).toBe(0)
  })
})

describe("calculateScrollToCenterLine", () => {
  it("returns 0 for first line", () => {
    expect(calculateScrollToCenterLine(1, 100, 2000, 200)).toBe(0)
  })

  it("returns max scroll for last line", () => {
    // maxScroll = 2000 - 200 = 1800
    expect(calculateScrollToCenterLine(100, 100, 2000, 200)).toBe(1800)
  })

  it("returns proportional scroll for middle line", () => {
    // lineRatio = (50 - 1) / (100 - 1) = 49/99 ≈ 0.495
    // maxScroll = 1800
    // result ≈ 891
    const result = calculateScrollToCenterLine(50, 100, 2000, 200)
    expect(result).toBeGreaterThan(800)
    expect(result).toBeLessThan(1000)
  })

  it("handles single line document", () => {
    expect(calculateScrollToCenterLine(1, 1, 200, 200)).toBe(0)
  })

  it("handles zero lines", () => {
    expect(calculateScrollToCenterLine(1, 0, 200, 200)).toBe(0)
  })
})
