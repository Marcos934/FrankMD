import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
  findTableAtPosition,
  findCodeBlockAtPosition,
  generateHugoBlogPost,
  slugify
} from "../../app/javascript/lib/markdown_utils.js"

describe("findTableAtPosition", () => {
  it("finds table when cursor is on table row", () => {
    const text = `Some text

| Name | Age |
| --- | --- |
| Alice | 30 |

More text`

    // Position in the middle of the table (on "| Alice |" line)
    const pos = text.indexOf("| Alice")
    const result = findTableAtPosition(text, pos)

    expect(result).not.toBeNull()
    expect(result.lines).toHaveLength(3)
    expect(result.lines[0]).toBe("| Name | Age |")
  })

  it("returns null when not in table", () => {
    const text = `Some text

| Name | Age |
| --- | --- |
| Alice | 30 |

More text`

    const pos = text.indexOf("Some text")
    const result = findTableAtPosition(text, pos)

    expect(result).toBeNull()
  })

  it("returns null for single-line table", () => {
    const text = "| Just | One | Line |"
    const result = findTableAtPosition(text, 5)

    expect(result).toBeNull()
  })

  it("includes correct start and end positions", () => {
    const text = `| A | B |
| - | - |
| 1 | 2 |`

    const result = findTableAtPosition(text, 5)

    expect(result.startPos).toBe(0)
    expect(result.endPos).toBe(text.length)
  })

  it("handles table at document start", () => {
    const text = `| Header |
| --- |
| Value |
Some other text`

    const result = findTableAtPosition(text, 0)

    expect(result).not.toBeNull()
    expect(result.startLine).toBe(0)
    expect(result.lines).toHaveLength(3)
  })

  it("handles table at document end", () => {
    const text = `Some text
| Header |
| --- |
| Value |`

    const result = findTableAtPosition(text, text.length - 1)

    expect(result).not.toBeNull()
    expect(result.lines).toHaveLength(3)
  })
})

describe("findCodeBlockAtPosition", () => {
  it("finds code block when cursor is inside", () => {
    const text = `Some text

\`\`\`javascript
const x = 1
\`\`\`

More text`

    const pos = text.indexOf("const x")
    const result = findCodeBlockAtPosition(text, pos)

    expect(result).not.toBeNull()
    expect(result.language).toBe("javascript")
    expect(result.content).toContain("const x = 1")
  })

  it("returns null when not in code block", () => {
    const text = `Some text

\`\`\`javascript
const x = 1
\`\`\`

More text`

    const pos = text.indexOf("Some text")
    const result = findCodeBlockAtPosition(text, pos)

    expect(result).toBeNull()
  })

  it("handles code block without language", () => {
    const text = `\`\`\`
plain code
\`\`\``

    const result = findCodeBlockAtPosition(text, 10)

    expect(result).not.toBeNull()
    expect(result.language).toBe("")
  })

  it("finds correct block with multiple code blocks", () => {
    const text = `\`\`\`javascript
first
\`\`\`

\`\`\`python
second
\`\`\``

    const pos = text.indexOf("second")
    const result = findCodeBlockAtPosition(text, pos)

    expect(result).not.toBeNull()
    expect(result.language).toBe("python")
  })
})

describe("generateHugoBlogPost", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2024-03-15T14:30:45"))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("generates correct path structure", () => {
    const { notePath } = generateHugoBlogPost("My Blog Post")

    expect(notePath).toMatch(/^2024\/03\/15\/my-blog-post\/index\.md$/)
  })

  it("generates frontmatter with title", () => {
    const { content } = generateHugoBlogPost("My Blog Post")

    expect(content).toContain('title: "My Blog Post"')
  })

  it("escapes quotes in title", () => {
    const { content } = generateHugoBlogPost('Post with "quotes"')

    expect(content).toContain('title: "Post with \\"quotes\\""')
  })

  it("includes slug in frontmatter", () => {
    const { content } = generateHugoBlogPost("My Blog Post")

    expect(content).toContain('slug: "my-blog-post"')
  })

  it("includes draft: true", () => {
    const { content } = generateHugoBlogPost("Test")

    expect(content).toContain("draft: true")
  })

  it("includes tags section", () => {
    const { content } = generateHugoBlogPost("Test")

    expect(content).toContain("tags:")
    expect(content).toContain("-")
  })
})

describe("slugify", () => {
  it("converts to lowercase", () => {
    expect(slugify("Hello World")).toBe("hello-world")
  })

  it("replaces spaces with hyphens", () => {
    expect(slugify("hello world")).toBe("hello-world")
  })

  it("removes special characters", () => {
    expect(slugify("hello! world?")).toBe("hello-world")
  })

  it("handles accented characters", () => {
    expect(slugify("café")).toBe("cafe")
    expect(slugify("naïve")).toBe("naive")
    expect(slugify("résumé")).toBe("resume")
  })

  it("handles Eastern European characters", () => {
    expect(slugify("Škoda")).toBe("skoda")
    expect(slugify("Łódź")).toBe("lodz")
    expect(slugify("Dvořák")).toBe("dvorak")
  })

  it("removes leading/trailing hyphens", () => {
    expect(slugify("--hello--")).toBe("hello")
  })

  it("collapses multiple hyphens", () => {
    expect(slugify("hello   world")).toBe("hello-world")
  })

  it("handles German special characters", () => {
    expect(slugify("Größe")).toBe("grosse")
    expect(slugify("Müller")).toBe("muller")
  })

  it("handles empty string", () => {
    expect(slugify("")).toBe("")
  })

  it("handles numbers", () => {
    expect(slugify("Part 1 of 3")).toBe("part-1-of-3")
  })
})
