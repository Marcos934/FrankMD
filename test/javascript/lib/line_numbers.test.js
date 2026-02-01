/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest"
import {
  LINE_NUMBER_MODES,
  normalizeLineNumberMode,
  nextLineNumberMode
} from "../../../app/javascript/lib/line_numbers.js"

describe("line_numbers", () => {
  describe("LINE_NUMBER_MODES", () => {
    it("defines OFF as 0", () => {
      expect(LINE_NUMBER_MODES.OFF).toBe(0)
    })

    it("defines ABSOLUTE as 1", () => {
      expect(LINE_NUMBER_MODES.ABSOLUTE).toBe(1)
    })

    it("defines RELATIVE as 2", () => {
      expect(LINE_NUMBER_MODES.RELATIVE).toBe(2)
    })
  })

  describe("normalizeLineNumberMode", () => {
    it("returns fallback for undefined value", () => {
      expect(normalizeLineNumberMode(undefined, LINE_NUMBER_MODES.OFF)).toBe(LINE_NUMBER_MODES.OFF)
    })

    it("parses string values", () => {
      expect(normalizeLineNumberMode("1", LINE_NUMBER_MODES.OFF)).toBe(LINE_NUMBER_MODES.ABSOLUTE)
    })

    it("accepts numeric values", () => {
      expect(normalizeLineNumberMode(2, LINE_NUMBER_MODES.OFF)).toBe(LINE_NUMBER_MODES.RELATIVE)
    })

    it("returns fallback for invalid values", () => {
      expect(normalizeLineNumberMode(99, LINE_NUMBER_MODES.ABSOLUTE)).toBe(LINE_NUMBER_MODES.ABSOLUTE)
      expect(normalizeLineNumberMode("invalid", LINE_NUMBER_MODES.OFF)).toBe(LINE_NUMBER_MODES.OFF)
    })
  })

  describe("nextLineNumberMode", () => {
    it("cycles OFF to ABSOLUTE", () => {
      expect(nextLineNumberMode(LINE_NUMBER_MODES.OFF)).toBe(LINE_NUMBER_MODES.ABSOLUTE)
    })

    it("cycles ABSOLUTE to RELATIVE", () => {
      expect(nextLineNumberMode(LINE_NUMBER_MODES.ABSOLUTE)).toBe(LINE_NUMBER_MODES.RELATIVE)
    })

    it("cycles RELATIVE to OFF", () => {
      expect(nextLineNumberMode(LINE_NUMBER_MODES.RELATIVE)).toBe(LINE_NUMBER_MODES.OFF)
    })
  })
})
