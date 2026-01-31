/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { Application } from "@hotwired/stimulus"
import DragDropController from "../../../app/javascript/controllers/drag_drop_controller.js"

// Mock window.t translation function
global.window = global.window || {}
window.t = (key) => key

describe("DragDropController", () => {
  let application, controller, element

  beforeEach(() => {
    document.body.innerHTML = `
      <div data-controller="drag-drop">
        <div data-drag-drop-target="tree" class="file-tree">
          <div class="tree-item" data-path="folder1" data-type="folder" draggable="true">Folder 1</div>
          <div class="tree-item" data-path="folder1/file1.md" data-type="file" draggable="true">File 1</div>
          <div class="tree-item" data-path="folder2" data-type="folder" draggable="true">Folder 2</div>
        </div>
      </div>
    `

    // Mock CSRF token
    const meta = document.createElement("meta")
    meta.name = "csrf-token"
    meta.content = "test-token"
    document.head.appendChild(meta)

    element = document.querySelector('[data-controller="drag-drop"]')
    application = Application.start()
    application.register("drag-drop", DragDropController)

    return new Promise((resolve) => {
      setTimeout(() => {
        controller = application.getControllerForElementAndIdentifier(element, "drag-drop")
        resolve()
      }, 0)
    })
  })

  afterEach(() => {
    application.stop()
    vi.restoreAllMocks()
    document.head.querySelector('meta[name="csrf-token"]')?.remove()
  })

  describe("connect()", () => {
    it("initializes with null draggedItem", () => {
      expect(controller.draggedItem).toBeNull()
    })
  })

  describe("onDragStart()", () => {
    it("stores dragged item info", () => {
      const item = element.querySelector('[data-path="folder1/file1.md"]')
      const event = {
        currentTarget: item,
        dataTransfer: {
          effectAllowed: null,
          setData: vi.fn()
        }
      }

      controller.onDragStart(event)

      expect(controller.draggedItem).toEqual({
        path: "folder1/file1.md",
        type: "file"
      })
    })

    it("sets dataTransfer data", () => {
      const item = element.querySelector('[data-path="folder1/file1.md"]')
      const setDataMock = vi.fn()
      const event = {
        currentTarget: item,
        dataTransfer: {
          effectAllowed: null,
          setData: setDataMock
        }
      }

      controller.onDragStart(event)

      expect(event.dataTransfer.effectAllowed).toBe("move")
      expect(setDataMock).toHaveBeenCalledWith("text/plain", "folder1/file1.md")
    })

    it("adds dragging class", () => {
      const item = element.querySelector('[data-path="folder1/file1.md"]')
      const event = {
        currentTarget: item,
        dataTransfer: {
          effectAllowed: null,
          setData: vi.fn()
        }
      }

      controller.onDragStart(event)

      expect(item.classList.contains("dragging")).toBe(true)
    })
  })

  describe("onDragEnd()", () => {
    it("clears draggedItem", () => {
      controller.draggedItem = { path: "test.md", type: "file" }
      const item = element.querySelector('[data-path="folder1/file1.md"]')
      item.classList.add("dragging", "drag-ghost")

      controller.onDragEnd({ currentTarget: item })

      expect(controller.draggedItem).toBeNull()
    })

    it("removes dragging classes", () => {
      const item = element.querySelector('[data-path="folder1/file1.md"]')
      item.classList.add("dragging", "drag-ghost")

      controller.onDragEnd({ currentTarget: item })

      expect(item.classList.contains("dragging")).toBe(false)
      expect(item.classList.contains("drag-ghost")).toBe(false)
    })
  })

  describe("onDragOver()", () => {
    it("prevents default and sets drop effect", () => {
      const event = {
        preventDefault: vi.fn(),
        dataTransfer: { dropEffect: null }
      }

      controller.onDragOver(event)

      expect(event.preventDefault).toHaveBeenCalled()
      expect(event.dataTransfer.dropEffect).toBe("move")
    })
  })

  describe("onDragEnter()", () => {
    it("adds drop-highlight to valid folder target", () => {
      controller.draggedItem = { path: "folder1/file1.md", type: "file" }
      const folder = element.querySelector('[data-path="folder2"]')
      const event = {
        preventDefault: vi.fn(),
        currentTarget: folder
      }

      controller.onDragEnter(event)

      expect(folder.classList.contains("drop-highlight")).toBe(true)
    })

    it("does not highlight when dragging onto itself", () => {
      controller.draggedItem = { path: "folder1", type: "folder" }
      const folder = element.querySelector('[data-path="folder1"]')
      const event = {
        preventDefault: vi.fn(),
        currentTarget: folder
      }

      controller.onDragEnter(event)

      expect(folder.classList.contains("drop-highlight")).toBe(false)
    })

    it("does not highlight files (only folders are valid targets)", () => {
      controller.draggedItem = { path: "folder1/file1.md", type: "file" }
      const file = element.querySelector('[data-path="folder1/file1.md"]')
      const event = {
        preventDefault: vi.fn(),
        currentTarget: file
      }

      controller.onDragEnter(event)

      expect(file.classList.contains("drop-highlight")).toBe(false)
    })
  })

  describe("onDragLeave()", () => {
    it("removes drop-highlight when leaving element", () => {
      const folder = element.querySelector('[data-path="folder2"]')
      folder.classList.add("drop-highlight")

      // Mock getBoundingClientRect
      folder.getBoundingClientRect = () => ({
        left: 0,
        right: 100,
        top: 0,
        bottom: 50
      })

      const event = {
        currentTarget: folder,
        clientX: 150, // Outside element
        clientY: 25
      }

      controller.onDragLeave(event)

      expect(folder.classList.contains("drop-highlight")).toBe(false)
    })
  })

  describe("onDrop()", () => {
    it("prevents default and stops propagation", async () => {
      controller.draggedItem = { path: "folder1/file1.md", type: "file" }
      const folder = element.querySelector('[data-path="folder2"]')
      folder.classList.add("drop-highlight")

      const event = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        currentTarget: folder
      }

      // Mock fetch to reject (we'll test the API call separately)
      global.fetch = vi.fn().mockRejectedValue(new Error("test"))
      global.alert = vi.fn()

      await controller.onDrop(event)

      expect(event.preventDefault).toHaveBeenCalled()
      expect(event.stopPropagation).toHaveBeenCalled()
    })

    it("removes drop-highlight class", async () => {
      controller.draggedItem = { path: "folder1/file1.md", type: "file" }
      const folder = element.querySelector('[data-path="folder2"]')
      folder.classList.add("drop-highlight")

      global.fetch = vi.fn().mockResolvedValue({ ok: true })

      await controller.onDrop({
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        currentTarget: folder
      })

      expect(folder.classList.contains("drop-highlight")).toBe(false)
    })
  })

  describe("onDragOverRoot()", () => {
    it("prevents default and sets drop effect", () => {
      const event = {
        preventDefault: vi.fn(),
        dataTransfer: { dropEffect: null }
      }

      controller.onDragOverRoot(event)

      expect(event.preventDefault).toHaveBeenCalled()
      expect(event.dataTransfer.dropEffect).toBe("move")
    })
  })

  describe("onDragEnterRoot()", () => {
    it("adds drop-highlight-root for nested items", () => {
      controller.draggedItem = { path: "folder1/file1.md", type: "file" }
      const event = { preventDefault: vi.fn() }

      controller.onDragEnterRoot(event)

      expect(controller.treeTarget.classList.contains("drop-highlight-root")).toBe(true)
    })

    it("does not highlight for root-level items", () => {
      controller.draggedItem = { path: "root-file.md", type: "file" }
      const event = { preventDefault: vi.fn() }

      controller.onDragEnterRoot(event)

      expect(controller.treeTarget.classList.contains("drop-highlight-root")).toBe(false)
    })
  })

  describe("disconnect()", () => {
    it("clears draggedItem", () => {
      controller.draggedItem = { path: "test.md", type: "file" }

      controller.disconnect()

      expect(controller.draggedItem).toBeNull()
    })
  })
})
