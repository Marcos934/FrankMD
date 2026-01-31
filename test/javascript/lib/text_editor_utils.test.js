/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest"
import {
  wrapSelection,
  insertAtPosition,
  getLineBoundaries,
  getCursorInfo,
  getLineAtPosition,
  getPositionForLine,
  replaceRange
} from "../../../app/javascript/lib/text_editor_utils"

describe("wrapSelection", () => {
  it("wraps selected text with prefix and suffix", () => {
    const result = wrapSelection("hello world", 6, 11, "**", "**")
    expect(result.text).toBe("hello **world**")
    expect(result.cursorStart).toBe(8)
    expect(result.cursorEnd).toBe(13)
  })

  it("handles empty selection", () => {
    const result = wrapSelection("hello", 3, 3, "[", "]")
    expect(result.text).toBe("hel[]lo")
    expect(result.cursorStart).toBe(4)
    expect(result.cursorEnd).toBe(4)
  })

  it("wraps at start of text", () => {
    const result = wrapSelection("hello", 0, 5, "_", "_")
    expect(result.text).toBe("_hello_")
    expect(result.cursorStart).toBe(1)
    expect(result.cursorEnd).toBe(6)
  })

  it("handles multiline selection", () => {
    const result = wrapSelection("line1\nline2\nline3", 0, 11, "```\n", "\n```")
    expect(result.text).toBe("```\nline1\nline2\n```\nline3")
  })
})

describe("insertAtPosition", () => {
  it("inserts text at position", () => {
    const result = insertAtPosition("hello world", 5, " beautiful")
    expect(result.text).toBe("hello beautiful world")
    expect(result.cursorPosition).toBe(15)
  })

  it("inserts at start", () => {
    const result = insertAtPosition("world", 0, "hello ")
    expect(result.text).toBe("hello world")
    expect(result.cursorPosition).toBe(6)
  })

  it("inserts at end", () => {
    const result = insertAtPosition("hello", 5, " world")
    expect(result.text).toBe("hello world")
    expect(result.cursorPosition).toBe(11)
  })

  it("handles empty text", () => {
    const result = insertAtPosition("", 0, "new text")
    expect(result.text).toBe("new text")
    expect(result.cursorPosition).toBe(8)
  })
})

describe("getLineBoundaries", () => {
  const text = "line1\nline2\nline3\nline4"

  it("gets boundaries for single line selection", () => {
    const result = getLineBoundaries(text, 7, 10) // "ine" in line2
    expect(result.lineStart).toBe(6)
    expect(result.lineEnd).toBe(11)
    expect(result.lines).toEqual(["line2"])
  })

  it("gets boundaries for multiline selection", () => {
    const result = getLineBoundaries(text, 7, 14) // from line2 to line3
    expect(result.lineStart).toBe(6)
    expect(result.lineEnd).toBe(17)
    expect(result.lines).toEqual(["line2", "line3"])
  })

  it("handles selection at start of file", () => {
    const result = getLineBoundaries(text, 0, 3)
    expect(result.lineStart).toBe(0)
    expect(result.lineEnd).toBe(5)
    expect(result.lines).toEqual(["line1"])
  })

  it("handles selection at end of file", () => {
    const result = getLineBoundaries(text, 18, 23)
    expect(result.lineStart).toBe(18)
    expect(result.lineEnd).toBe(23)
    expect(result.lines).toEqual(["line4"])
  })
})

describe("getCursorInfo", () => {
  const text = "line1\nline2\nline3"

  it("returns line 1 at start", () => {
    const result = getCursorInfo(text, 0)
    expect(result.line).toBe(1)
    expect(result.column).toBe(1)
    expect(result.totalLines).toBe(3)
  })

  it("returns correct line and column in middle", () => {
    const result = getCursorInfo(text, 8) // "ne2" - 3rd char of line2
    expect(result.line).toBe(2)
    expect(result.column).toBe(3)
  })

  it("returns correct info at end of line", () => {
    const result = getCursorInfo(text, 5) // end of line1
    expect(result.line).toBe(1)
    expect(result.column).toBe(6)
  })

  it("returns correct info at start of line", () => {
    const result = getCursorInfo(text, 6) // start of line2
    expect(result.line).toBe(2)
    expect(result.column).toBe(1)
  })

  it("handles empty text", () => {
    const result = getCursorInfo("", 0)
    expect(result.line).toBe(1)
    expect(result.totalLines).toBe(1)
  })
})

describe("getLineAtPosition", () => {
  const text = "line1\nline2\nline3"

  it("returns 1 at position 0", () => {
    expect(getLineAtPosition(text, 0)).toBe(1)
  })

  it("returns 2 at start of second line", () => {
    expect(getLineAtPosition(text, 6)).toBe(2)
  })

  it("returns 3 at third line", () => {
    expect(getLineAtPosition(text, 12)).toBe(3)
  })
})

describe("getPositionForLine", () => {
  const text = "line1\nline2\nline3"

  it("returns 0 for line 1", () => {
    expect(getPositionForLine(text, 1)).toBe(0)
  })

  it("returns correct position for line 2", () => {
    expect(getPositionForLine(text, 2)).toBe(6)
  })

  it("returns correct position for line 3", () => {
    expect(getPositionForLine(text, 3)).toBe(12)
  })

  it("handles line beyond end", () => {
    const pos = getPositionForLine(text, 10)
    expect(pos).toBe(text.length + 1) // Would be past end but safe
  })
})

describe("replaceRange", () => {
  it("replaces text in range", () => {
    const result = replaceRange("hello world", 6, 11, "universe")
    expect(result.text).toBe("hello universe")
    expect(result.cursorPosition).toBe(14)
  })

  it("replaces at start", () => {
    const result = replaceRange("hello world", 0, 5, "goodbye")
    expect(result.text).toBe("goodbye world")
    expect(result.cursorPosition).toBe(7)
  })

  it("replaces at end", () => {
    const result = replaceRange("hello world", 6, 11, "there")
    expect(result.text).toBe("hello there")
    expect(result.cursorPosition).toBe(11)
  })

  it("deletes when replacement is empty", () => {
    const result = replaceRange("hello world", 5, 11, "")
    expect(result.text).toBe("hello")
    expect(result.cursorPosition).toBe(5)
  })
})
