import { describe, it, expect } from "vitest"
import {
  calculateStats,
  formatReadTime,
  formatFileSize
} from "../../app/javascript/lib/stats_utils.js"

describe("calculateStats", () => {
  it("counts words correctly", () => {
    const stats = calculateStats("Hello world this is a test")
    expect(stats.wordCount).toBe(6)
  })

  it("counts characters correctly", () => {
    const stats = calculateStats("Hello")
    expect(stats.charCount).toBe(5)
  })

  it("handles empty text", () => {
    const stats = calculateStats("")
    expect(stats.wordCount).toBe(0)
    expect(stats.charCount).toBe(0)
    expect(stats.byteSize).toBe(0)
    expect(stats.readTimeMinutes).toBe(0)
  })

  it("handles null/undefined", () => {
    expect(calculateStats(null).wordCount).toBe(0)
    expect(calculateStats(undefined).wordCount).toBe(0)
  })

  it("handles multiple spaces between words", () => {
    const stats = calculateStats("Hello    world")
    expect(stats.wordCount).toBe(2)
  })

  it("handles newlines", () => {
    const stats = calculateStats("Hello\nworld\ntest")
    expect(stats.wordCount).toBe(3)
  })

  it("calculates read time", () => {
    // 200 words should be 1 minute
    const words = Array(200).fill("word").join(" ")
    const stats = calculateStats(words)
    expect(stats.readTimeMinutes).toBe(1)
  })

  it("rounds read time up", () => {
    // 201 words should be 2 minutes (ceiling)
    const words = Array(201).fill("word").join(" ")
    const stats = calculateStats(words)
    expect(stats.readTimeMinutes).toBe(2)
  })

  it("calculates byte size for ASCII", () => {
    const stats = calculateStats("Hello")
    expect(stats.byteSize).toBe(5)
  })

  it("calculates byte size for UTF-8", () => {
    const stats = calculateStats("café") // é is 2 bytes in UTF-8
    expect(stats.byteSize).toBe(5)
  })
})

describe("formatReadTime", () => {
  it("shows '< 1 min' for 0 minutes", () => {
    expect(formatReadTime(0)).toBe("< 1 min")
  })

  it("shows '< 1 min' for 1 minute", () => {
    expect(formatReadTime(1)).toBe("< 1 min")
  })

  it("shows minutes for 2+", () => {
    expect(formatReadTime(2)).toBe("2 min")
    expect(formatReadTime(10)).toBe("10 min")
  })
})

describe("formatFileSize", () => {
  it("formats bytes", () => {
    expect(formatFileSize(0)).toBe("0 B")
    expect(formatFileSize(100)).toBe("100 B")
    expect(formatFileSize(1023)).toBe("1023 B")
  })

  it("formats kilobytes", () => {
    expect(formatFileSize(1024)).toBe("1.0 KB")
    expect(formatFileSize(1536)).toBe("1.5 KB")
    expect(formatFileSize(10240)).toBe("10 KB")
  })

  it("formats megabytes", () => {
    expect(formatFileSize(1048576)).toBe("1.0 MB")
    expect(formatFileSize(1572864)).toBe("1.5 MB")
  })

  it("formats gigabytes", () => {
    expect(formatFileSize(1073741824)).toBe("1.0 GB")
  })

  it("shows decimal only when meaningful", () => {
    // Small values show 1 decimal
    expect(formatFileSize(1536)).toBe("1.5 KB")
    // Large values show no decimal
    expect(formatFileSize(10240)).toBe("10 KB")
  })
})
