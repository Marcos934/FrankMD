import { describe, it, expect } from "vitest"
import {
  encodePath,
  extractYouTubeId
} from "../../app/javascript/lib/url_utils.js"

describe("encodePath", () => {
  it("encodes path segments", () => {
    expect(encodePath("hello world/test file.md")).toBe("hello%20world/test%20file.md")
  })

  it("preserves forward slashes", () => {
    expect(encodePath("a/b/c")).toBe("a/b/c")
  })

  it("encodes special characters", () => {
    expect(encodePath("file#1.md")).toBe("file%231.md")
    expect(encodePath("file?query.md")).toBe("file%3Fquery.md")
  })

  it("handles empty path", () => {
    expect(encodePath("")).toBe("")
    expect(encodePath(null)).toBe("")
    expect(encodePath(undefined)).toBe("")
  })

  it("handles deeply nested paths", () => {
    expect(encodePath("a/b/c/d/e.md")).toBe("a/b/c/d/e.md")
  })

  it("encodes unicode characters", () => {
    expect(encodePath("café/résumé.md")).toBe("caf%C3%A9/r%C3%A9sum%C3%A9.md")
  })
})

describe("extractYouTubeId", () => {
  it("extracts ID from standard watch URL", () => {
    expect(extractYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ"))
      .toBe("dQw4w9WgXcQ")
  })

  it("extracts ID from short URL", () => {
    expect(extractYouTubeId("https://youtu.be/dQw4w9WgXcQ"))
      .toBe("dQw4w9WgXcQ")
  })

  it("extracts ID from embed URL", () => {
    expect(extractYouTubeId("https://www.youtube.com/embed/dQw4w9WgXcQ"))
      .toBe("dQw4w9WgXcQ")
  })

  it("extracts ID from v/ URL", () => {
    expect(extractYouTubeId("https://www.youtube.com/v/dQw4w9WgXcQ"))
      .toBe("dQw4w9WgXcQ")
  })

  it("returns the ID if just passed an ID", () => {
    expect(extractYouTubeId("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ")
  })

  it("returns null for non-YouTube URLs", () => {
    expect(extractYouTubeId("https://vimeo.com/123456")).toBeNull()
  })

  it("returns null for invalid URLs", () => {
    expect(extractYouTubeId("not a url")).toBeNull()
  })

  it("returns null for empty input", () => {
    expect(extractYouTubeId("")).toBeNull()
    expect(extractYouTubeId(null)).toBeNull()
    expect(extractYouTubeId(undefined)).toBeNull()
  })

  it("handles URL with additional parameters", () => {
    expect(extractYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s"))
      .toBe("dQw4w9WgXcQ")
  })

  it("handles URL without www", () => {
    expect(extractYouTubeId("https://youtube.com/watch?v=dQw4w9WgXcQ"))
      .toBe("dQw4w9WgXcQ")
  })
})
