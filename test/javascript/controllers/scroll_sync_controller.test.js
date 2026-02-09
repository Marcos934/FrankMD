/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { Application } from "@hotwired/stimulus"
import ScrollSyncController from "../../../app/javascript/controllers/scroll_sync_controller"

vi.mock("lib/codemirror_adapter", () => ({
  getEditorContent: vi.fn((cm, ta) => cm ? cm.getValue() : "")
}))

describe("ScrollSyncController", () => {
  let application
  let container
  let controller

  const mockPreviewController = {
    isVisible: true,
    syncScrollRatio: vi.fn(),
    syncToCursor: vi.fn(),
    render: vi.fn(),
    updateWithSync: vi.fn(),
    getScrollRatio: vi.fn(() => 0),
  }

  const mockCodemirrorController = {
    getValue: vi.fn(() => "# Hello"),
    getCursorPosition: vi.fn(() => ({ offset: 0 })),
    getScrollRatio: vi.fn(() => 0.5),
    getScrollInfo: vi.fn(() => ({ top: 0, height: 1000, clientHeight: 500 })),
    scrollTo: vi.fn(),
  }

  beforeEach(async () => {
    document.body.innerHTML = `
      <div data-controller="scroll-sync"></div>
    `

    container = document.querySelector('[data-controller="scroll-sync"]')

    application = Application.start()
    application.register("scroll-sync", ScrollSyncController)

    await new Promise((resolve) => setTimeout(resolve, 10))
    controller = application.getControllerForElementAndIdentifier(container, "scroll-sync")

    // Override controller lookups
    controller.getPreviewController = () => mockPreviewController
    controller.getCodemirrorController = () => mockCodemirrorController

    // Reset mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    if (controller && controller._scrollSourceTimeout) {
      clearTimeout(controller._scrollSourceTimeout)
    }
    vi.restoreAllMocks()
    application.stop()
    document.body.innerHTML = ""
  })

  describe("onEditorScroll()", () => {
    it("syncs preview scroll ratio when preview is visible", () => {
      controller.onEditorScroll({ detail: { scrollRatio: 0.5 } })

      expect(mockPreviewController.syncScrollRatio).toHaveBeenCalledWith(0.5)
    })

    it("does not sync when preview is not visible", () => {
      mockPreviewController.isVisible = false

      controller.onEditorScroll({ detail: { scrollRatio: 0.5 } })

      expect(mockPreviewController.syncScrollRatio).not.toHaveBeenCalled()
      mockPreviewController.isVisible = true
    })

    it("does not sync when scroll source is preview (feedback loop prevention)", () => {
      controller._scrollSource = "preview"

      controller.onEditorScroll({ detail: { scrollRatio: 0.5 } })

      expect(mockPreviewController.syncScrollRatio).not.toHaveBeenCalled()
    })

    it("marks scroll source as editor", () => {
      controller.onEditorScroll({ detail: { scrollRatio: 0.5 } })

      expect(controller._scrollSource).toBe("editor")
    })
  })

  describe("onPreviewScroll()", () => {
    it("syncs editor scroll position based on ratio", () => {
      controller.onPreviewScroll({
        detail: { scrollRatio: 0.5, sourceLine: null, totalLines: 0 }
      })

      expect(mockCodemirrorController.scrollTo).toHaveBeenCalled()
    })

    it("does not sync when scroll source is editor (feedback loop prevention)", () => {
      controller._scrollSource = "editor"

      controller.onPreviewScroll({
        detail: { scrollRatio: 0.5, sourceLine: null, totalLines: 0 }
      })

      expect(mockCodemirrorController.scrollTo).not.toHaveBeenCalled()
    })

    it("scrolls to top when scrollRatio is near 0", () => {
      // Set top to non-zero so the scroll call triggers
      mockCodemirrorController.getScrollInfo.mockReturnValue({
        top: 100, height: 1000, clientHeight: 500
      })

      controller.onPreviewScroll({
        detail: { scrollRatio: 0.005, sourceLine: null, totalLines: 0 }
      })

      expect(mockCodemirrorController.scrollTo).toHaveBeenCalledWith(0)
    })

    it("scrolls to bottom when scrollRatio is near 1", () => {
      mockCodemirrorController.getScrollInfo.mockReturnValue({
        top: 0, height: 1000, clientHeight: 500
      })

      controller.onPreviewScroll({
        detail: { scrollRatio: 0.995, sourceLine: null, totalLines: 0 }
      })

      expect(mockCodemirrorController.scrollTo).toHaveBeenCalledWith(500) // maxScroll
    })

    it("uses line-based sync when sourceLine is available", () => {
      mockCodemirrorController.getScrollInfo.mockReturnValue({
        top: 0, height: 1000, clientHeight: 500
      })

      controller.onPreviewScroll({
        detail: { scrollRatio: 0.5, sourceLine: 50, totalLines: 100 }
      })

      // lineRatio = (50-1)/(100-1) ≈ 0.4949, targetScroll ≈ 0.4949 * 500 ≈ 247
      expect(mockCodemirrorController.scrollTo).toHaveBeenCalled()
    })

    it("does not scroll when maxScroll is 0", () => {
      mockCodemirrorController.getScrollInfo.mockReturnValue({
        top: 0, height: 500, clientHeight: 500
      })

      controller.onPreviewScroll({
        detail: { scrollRatio: 0.5, sourceLine: null, totalLines: 0 }
      })

      expect(mockCodemirrorController.scrollTo).not.toHaveBeenCalled()
    })

    it("marks scroll source as preview", () => {
      controller.onPreviewScroll({
        detail: { scrollRatio: 0.5, sourceLine: null, totalLines: 0 }
      })

      expect(controller._scrollSource).toBe("preview")
    })
  })

  describe("feedback loop prevention", () => {
    it("editor scroll does not trigger reverse sync", () => {
      // Editor scrolls first
      controller.onEditorScroll({ detail: { scrollRatio: 0.5 } })
      expect(controller._scrollSource).toBe("editor")

      // Preview scroll should be blocked
      controller.onPreviewScroll({
        detail: { scrollRatio: 0.3, sourceLine: null, totalLines: 0 }
      })
      expect(mockCodemirrorController.scrollTo).not.toHaveBeenCalled()
    })

    it("scroll source clears after timeout", async () => {
      controller.onEditorScroll({ detail: { scrollRatio: 0.5 } })
      expect(controller._scrollSource).toBe("editor")

      // Wait for timeout (400ms)
      await new Promise((resolve) => setTimeout(resolve, 450))

      expect(controller._scrollSource).toBeNull()
    })
  })

  describe("updatePreviewWithSync()", () => {
    it("renders content without sync in normal mode", () => {
      controller.typewriterModeEnabled = false

      controller.updatePreviewWithSync()

      expect(mockPreviewController.render).toHaveBeenCalled()
      expect(mockPreviewController.updateWithSync).not.toHaveBeenCalled()
    })

    it("uses updateWithSync in typewriter mode", () => {
      controller.typewriterModeEnabled = true

      controller.updatePreviewWithSync()

      expect(mockPreviewController.updateWithSync).toHaveBeenCalled()
      expect(mockPreviewController.render).not.toHaveBeenCalled()
    })

    it("does nothing when preview is not visible", () => {
      mockPreviewController.isVisible = false

      controller.updatePreviewWithSync()

      expect(mockPreviewController.render).not.toHaveBeenCalled()
      mockPreviewController.isVisible = true
    })
  })

  describe("updatePreview()", () => {
    it("renders content via preview controller", () => {
      controller.updatePreview()

      expect(mockPreviewController.render).toHaveBeenCalled()
    })

    it("does nothing when preview is not visible", () => {
      mockPreviewController.isVisible = false

      controller.updatePreview()

      expect(mockPreviewController.render).not.toHaveBeenCalled()
      mockPreviewController.isVisible = true
    })
  })

  describe("onPreviewToggled()", () => {
    it("updates preview and syncs scroll when preview becomes visible", () => {
      controller.onPreviewToggled({ detail: { visible: true } })

      expect(mockPreviewController.render).toHaveBeenCalled()
      expect(mockPreviewController.syncScrollRatio).toHaveBeenCalledWith(0.5)
    })

    it("does nothing when preview is hidden", () => {
      controller.onPreviewToggled({ detail: { visible: false } })

      expect(mockPreviewController.render).not.toHaveBeenCalled()
      expect(mockPreviewController.syncScrollRatio).not.toHaveBeenCalled()
    })
  })

  describe("onTypewriterToggled()", () => {
    it("tracks typewriter mode state", () => {
      controller.onTypewriterToggled({ detail: { enabled: true } })
      expect(controller.typewriterModeEnabled).toBe(true)

      controller.onTypewriterToggled({ detail: { enabled: false } })
      expect(controller.typewriterModeEnabled).toBe(false)
    })
  })
})
