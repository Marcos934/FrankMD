import { describe, it, expect } from "vitest"
import {
  tokenize,
  computeWordDiff,
  lcsWordDiff
} from "../../app/javascript/lib/diff_utils.js"

describe("tokenize", () => {
  it("splits text into words", () => {
    const tokens = tokenize("hello world")
    expect(tokens).toEqual(["hello", " ", "world"])
  })

  it("preserves multiple spaces", () => {
    const tokens = tokenize("hello  world")
    expect(tokens).toEqual(["hello", "  ", "world"])
  })

  it("handles newlines", () => {
    const tokens = tokenize("hello\nworld")
    expect(tokens).toEqual(["hello", "\n", "world"])
  })

  it("handles empty string", () => {
    const tokens = tokenize("")
    expect(tokens).toEqual([])
  })

  it("handles leading/trailing spaces", () => {
    const tokens = tokenize("  hello  ")
    expect(tokens).toEqual(["  ", "hello", "  "])
  })
})

describe("computeWordDiff", () => {
  it("returns equal for identical text", () => {
    const diff = computeWordDiff("hello world", "hello world")
    expect(diff).toEqual([{ type: "equal", value: "hello world" }])
  })

  it("detects inserted word", () => {
    const diff = computeWordDiff("hello world", "hello beautiful world")
    expect(diff.some(d => d.type === "insert" && d.value.includes("beautiful"))).toBe(true)
  })

  it("detects deleted word", () => {
    const diff = computeWordDiff("hello beautiful world", "hello world")
    expect(diff.some(d => d.type === "delete" && d.value.includes("beautiful"))).toBe(true)
  })

  it("detects changed word", () => {
    const diff = computeWordDiff("hello world", "hello universe")
    expect(diff.some(d => d.type === "delete" && d.value.includes("world"))).toBe(true)
    expect(diff.some(d => d.type === "insert" && d.value.includes("universe"))).toBe(true)
  })

  it("handles empty strings", () => {
    expect(computeWordDiff("", "")).toEqual([])
    expect(computeWordDiff("hello", "")).toEqual([{ type: "delete", value: "hello" }])
    expect(computeWordDiff("", "hello")).toEqual([{ type: "insert", value: "hello" }])
  })
})

describe("lcsWordDiff", () => {
  it("returns equal for identical tokens", () => {
    const diff = lcsWordDiff(["a", "b", "c"], ["a", "b", "c"])
    expect(diff).toEqual([{ type: "equal", value: "abc" }])
  })

  it("detects insertions", () => {
    const diff = lcsWordDiff(["a", "c"], ["a", "b", "c"])
    expect(diff).toContainEqual({ type: "insert", value: "b" })
  })

  it("detects deletions", () => {
    const diff = lcsWordDiff(["a", "b", "c"], ["a", "c"])
    expect(diff).toContainEqual({ type: "delete", value: "b" })
  })

  it("handles empty arrays", () => {
    expect(lcsWordDiff([], [])).toEqual([])
  })

  it("handles all new tokens", () => {
    const diff = lcsWordDiff([], ["a", "b"])
    expect(diff).toEqual([{ type: "insert", value: "ab" }])
  })

  it("handles all deleted tokens", () => {
    const diff = lcsWordDiff(["a", "b"], [])
    expect(diff).toEqual([{ type: "delete", value: "ab" }])
  })

  it("merges consecutive operations", () => {
    const diff = lcsWordDiff(["a", "x", "y", "b"], ["a", "b"])
    // x and y should be merged into one delete
    const deleteOps = diff.filter(d => d.type === "delete")
    expect(deleteOps.length).toBe(1)
    expect(deleteOps[0].value).toBe("xy")
  })
})
