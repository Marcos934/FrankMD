/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest"
import {
  LINE_NUMBER_MODES,
  normalizeLineNumberMode,
  nextLineNumberMode,
  buildRelativeLineLabels,
  buildAbsoluteLineLabels
} from "../../../app/javascript/lib/line_numbers.js"

describe("line_numbers", () => {
  it("normalizes line number mode", () => {
    expect(normalizeLineNumberMode(undefined, LINE_NUMBER_MODES.OFF)).toBe(LINE_NUMBER_MODES.OFF)
    expect(normalizeLineNumberMode("1", LINE_NUMBER_MODES.OFF)).toBe(LINE_NUMBER_MODES.ABSOLUTE)
    expect(normalizeLineNumberMode(2, LINE_NUMBER_MODES.OFF)).toBe(LINE_NUMBER_MODES.RELATIVE)
  })

  it("cycles line number modes", () => {
    expect(nextLineNumberMode(LINE_NUMBER_MODES.OFF)).toBe(LINE_NUMBER_MODES.ABSOLUTE)
    expect(nextLineNumberMode(LINE_NUMBER_MODES.ABSOLUTE)).toBe(LINE_NUMBER_MODES.RELATIVE)
    expect(nextLineNumberMode(LINE_NUMBER_MODES.RELATIVE)).toBe(LINE_NUMBER_MODES.OFF)
  })

  it("builds absolute line labels with wrapped gaps", () => {
    expect(buildAbsoluteLineLabels([1, 3, 1])).toEqual(["1", "2", "", "", "3"])
  })

  it("builds relative line labels", () => {
    expect(buildRelativeLineLabels(5, 2)).toEqual(["-2", "-1", "0", "1", "2"])
  })

  it("clamps cursor index", () => {
    expect(buildRelativeLineLabels(2, 10)).toEqual(["-1", "0"])
  })
})
