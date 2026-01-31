import { describe, it, expect } from "vitest"
import { flattenTree } from "../../app/javascript/lib/tree_utils.js"

describe("flattenTree", () => {
  it("returns empty array for empty input", () => {
    expect(flattenTree([])).toEqual([])
    expect(flattenTree(null)).toEqual([])
    expect(flattenTree(undefined)).toEqual([])
  })

  it("returns files from flat list", () => {
    const tree = [
      { type: "file", name: "a.md", path: "a.md" },
      { type: "file", name: "b.md", path: "b.md" }
    ]
    const result = flattenTree(tree)
    expect(result).toHaveLength(2)
    expect(result[0].name).toBe("a.md")
    expect(result[1].name).toBe("b.md")
  })

  it("extracts files from nested folders", () => {
    const tree = [
      {
        type: "folder",
        name: "docs",
        path: "docs",
        children: [
          { type: "file", name: "readme.md", path: "docs/readme.md" }
        ]
      },
      { type: "file", name: "root.md", path: "root.md" }
    ]
    const result = flattenTree(tree)
    expect(result).toHaveLength(2)
    expect(result.map(f => f.path)).toContain("docs/readme.md")
    expect(result.map(f => f.path)).toContain("root.md")
  })

  it("handles deeply nested folders", () => {
    const tree = [
      {
        type: "folder",
        name: "a",
        path: "a",
        children: [
          {
            type: "folder",
            name: "b",
            path: "a/b",
            children: [
              {
                type: "folder",
                name: "c",
                path: "a/b/c",
                children: [
                  { type: "file", name: "deep.md", path: "a/b/c/deep.md" }
                ]
              }
            ]
          }
        ]
      }
    ]
    const result = flattenTree(tree)
    expect(result).toHaveLength(1)
    expect(result[0].path).toBe("a/b/c/deep.md")
  })

  it("ignores empty folders", () => {
    const tree = [
      {
        type: "folder",
        name: "empty",
        path: "empty",
        children: []
      },
      { type: "file", name: "file.md", path: "file.md" }
    ]
    const result = flattenTree(tree)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe("file.md")
  })

  it("handles folder without children property", () => {
    const tree = [
      {
        type: "folder",
        name: "no-children",
        path: "no-children"
        // no children property
      },
      { type: "file", name: "file.md", path: "file.md" }
    ]
    const result = flattenTree(tree)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe("file.md")
  })

  it("preserves file metadata", () => {
    const tree = [
      {
        type: "file",
        name: "test.md",
        path: "test.md",
        file_type: "markdown",
        size: 1024
      }
    ]
    const result = flattenTree(tree)
    expect(result[0].file_type).toBe("markdown")
    expect(result[0].size).toBe(1024)
  })
})
