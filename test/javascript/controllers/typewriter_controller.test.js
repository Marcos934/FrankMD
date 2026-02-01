/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { Application } from "@hotwired/stimulus"
import TypewriterController from "../../../app/javascript/controllers/typewriter_controller.js"

describe("TypewriterController", () => {
  let application, controller, element, mockCodemirrorController

  beforeEach(() => {
    // Create mock CodeMirror controller
    mockCodemirrorController = {
      setTypewriterMode: vi.fn(),
      maintainTypewriterScroll: vi.fn(),
      getTypewriterSyncData: vi.fn().mockReturnValue({ currentLine: 2, totalLines: 5 })
    }

    document.body.innerHTML = `
      <div data-controller="typewriter" data-typewriter-enabled-value="false">
        <div data-typewriter-target="wrapper" class="editor-wrapper"></div>
        <div data-typewriter-target="body" class="editor-body"></div>
        <button data-typewriter-target="toggleButton" aria-pressed="false"></button>
        <div data-controller="codemirror" data-typewriter-target="editor"></div>
      </div>
    `

    element = document.querySelector('[data-controller="typewriter"]')
    application = Application.start()
    application.register("typewriter", TypewriterController)

    return new Promise((resolve) => {
      setTimeout(() => {
        controller = application.getControllerForElementAndIdentifier(element, "typewriter")
        // Mock the getCodemirrorController method
        controller.getCodemirrorController = vi.fn().mockReturnValue(mockCodemirrorController)
        resolve()
      }, 0)
    })
  })

  afterEach(() => {
    application.stop()
    vi.restoreAllMocks()
  })

  describe("connect()", () => {
    it("initializes with enabled=false by default", () => {
      expect(controller.enabledValue).toBe(false)
    })

    it("applies initial mode on connect", () => {
      // When disabled, wrapper should not have typewriter-centered class
      expect(controller.wrapperTarget.classList.contains("typewriter-centered")).toBe(false)
    })
  })

  describe("toggle()", () => {
    it("toggles enabled state", () => {
      expect(controller.enabledValue).toBe(false)

      controller.toggle()

      expect(controller.enabledValue).toBe(true)

      controller.toggle()

      expect(controller.enabledValue).toBe(false)
    })

    it("dispatches toggled event", () => {
      const dispatchSpy = vi.spyOn(controller, "dispatch")

      controller.toggle()

      expect(dispatchSpy).toHaveBeenCalledWith("toggled", {
        detail: { enabled: true }
      })
    })

    it("calls CodeMirror setTypewriterMode when toggling", () => {
      controller.toggle() // Enable

      expect(mockCodemirrorController.setTypewriterMode).toHaveBeenCalledWith(true)

      controller.toggle() // Disable

      expect(mockCodemirrorController.setTypewriterMode).toHaveBeenCalledWith(false)
    })
  })

  describe("applyMode()", () => {
    it("adds typewriter-centered class to wrapper when enabled", () => {
      controller.enabledValue = true
      controller.applyMode()

      expect(controller.wrapperTarget.classList.contains("typewriter-centered")).toBe(true)
    })

    it("removes typewriter-centered class from wrapper when disabled", () => {
      controller.wrapperTarget.classList.add("typewriter-centered")
      controller.enabledValue = false
      controller.applyMode()

      expect(controller.wrapperTarget.classList.contains("typewriter-centered")).toBe(false)
    })

    it("adds typewriter-centered class to body when enabled", () => {
      controller.enabledValue = true
      controller.applyMode()

      expect(controller.bodyTarget.classList.contains("typewriter-centered")).toBe(true)
    })

    it("removes typewriter-centered class from body when disabled", () => {
      controller.bodyTarget.classList.add("typewriter-centered")
      controller.enabledValue = false
      controller.applyMode()

      expect(controller.bodyTarget.classList.contains("typewriter-centered")).toBe(false)
    })

    it("updates toggle button aria-pressed", () => {
      controller.enabledValue = true
      controller.applyMode()

      expect(controller.toggleButtonTarget.getAttribute("aria-pressed")).toBe("true")

      controller.enabledValue = false
      controller.applyMode()

      expect(controller.toggleButtonTarget.getAttribute("aria-pressed")).toBe("false")
    })

    it("adds bg-hover class to button when enabled", () => {
      controller.enabledValue = true
      controller.applyMode()

      expect(controller.toggleButtonTarget.classList.contains("bg-[var(--theme-bg-hover)]")).toBe(true)
    })

    it("removes bg-hover class from button when disabled", () => {
      controller.toggleButtonTarget.classList.add("bg-[var(--theme-bg-hover)]")
      controller.enabledValue = false
      controller.applyMode()

      expect(controller.toggleButtonTarget.classList.contains("bg-[var(--theme-bg-hover)]")).toBe(false)
    })
  })

  describe("maintainScroll()", () => {
    it("does nothing when not enabled", () => {
      controller.enabledValue = false

      controller.maintainScroll()

      expect(mockCodemirrorController.maintainTypewriterScroll).not.toHaveBeenCalled()
    })

    it("calls CodeMirror maintainTypewriterScroll when enabled", () => {
      controller.enabledValue = true

      controller.maintainScroll()

      expect(mockCodemirrorController.maintainTypewriterScroll).toHaveBeenCalled()
    })

    it("handles missing CodeMirror controller gracefully", () => {
      controller.getCodemirrorController = vi.fn().mockReturnValue(null)
      controller.enabledValue = true

      // Should not throw
      expect(() => controller.maintainScroll()).not.toThrow()
    })
  })

  describe("getSyncData()", () => {
    it("returns sync data from CodeMirror controller", () => {
      const data = controller.getSyncData()

      expect(data).toEqual({ currentLine: 2, totalLines: 5 })
      expect(mockCodemirrorController.getTypewriterSyncData).toHaveBeenCalled()
    })

    it("returns null if no CodeMirror controller available", () => {
      controller.getCodemirrorController = vi.fn().mockReturnValue(null)

      const data = controller.getSyncData()

      expect(data).toBeNull()
    })
  })

  describe("isEnabled", () => {
    it("returns enabled state", () => {
      expect(controller.isEnabled).toBe(false)

      controller.enabledValue = true

      expect(controller.isEnabled).toBe(true)
    })
  })

  describe("setEnabled()", () => {
    it("sets enabled value and applies mode", () => {
      const applySpy = vi.spyOn(controller, "applyMode")

      controller.setEnabled(true)

      expect(controller.enabledValue).toBe(true)
      expect(applySpy).toHaveBeenCalled()
    })

    it("syncs with CodeMirror controller", () => {
      controller.setEnabled(true)

      expect(mockCodemirrorController.setTypewriterMode).toHaveBeenCalledWith(true)

      controller.setEnabled(false)

      expect(mockCodemirrorController.setTypewriterMode).toHaveBeenCalledWith(false)
    })
  })

  describe("getCodemirrorController()", () => {
    it("finds CodeMirror controller by data-controller attribute", () => {
      // Restore original implementation for this test
      controller.getCodemirrorController = TypewriterController.prototype.getCodemirrorController.bind(controller)

      // Mock the application's getControllerForElementAndIdentifier
      const mockController = { test: true }
      controller.application.getControllerForElementAndIdentifier = vi.fn().mockReturnValue(mockController)

      controller.getCodemirrorController()

      expect(controller.application.getControllerForElementAndIdentifier).toHaveBeenCalled()
    })

    it("returns null if no CodeMirror element found", () => {
      // Remove the codemirror element
      document.querySelector('[data-controller="codemirror"]').remove()

      // Restore original implementation
      controller.getCodemirrorController = TypewriterController.prototype.getCodemirrorController.bind(controller)

      expect(controller.getCodemirrorController()).toBeNull()
    })
  })
})
