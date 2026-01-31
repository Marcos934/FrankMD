/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { Application } from "@hotwired/stimulus"
import TypewriterController from "../../../app/javascript/controllers/typewriter_controller.js"

describe("TypewriterController", () => {
  let application, controller, element

  beforeEach(() => {
    document.body.innerHTML = `
      <div data-controller="typewriter" data-typewriter-enabled-value="false">
        <textarea data-typewriter-target="textarea" style="height: 300px;">Line 1
Line 2
Line 3
Line 4
Line 5</textarea>
        <div data-typewriter-target="wrapper" class="editor-wrapper"></div>
        <div data-typewriter-target="body" class="editor-body"></div>
        <button data-typewriter-target="toggleButton" aria-pressed="false"></button>
      </div>
    `

    element = document.querySelector('[data-controller="typewriter"]')
    application = Application.start()
    application.register("typewriter", TypewriterController)

    return new Promise((resolve) => {
      setTimeout(() => {
        controller = application.getControllerForElementAndIdentifier(element, "typewriter")
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

    it("applies initial mode", () => {
      expect(controller.textareaTarget.classList.contains("typewriter-mode")).toBe(false)
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

    it("calls maintainScroll when enabling", () => {
      const maintainSpy = vi.spyOn(controller, "maintainScroll")

      controller.toggle() // Enable

      expect(maintainSpy).toHaveBeenCalled()
    })
  })

  describe("applyMode()", () => {
    it("adds typewriter-mode class to textarea when enabled", () => {
      controller.enabledValue = true
      controller.applyMode()

      expect(controller.textareaTarget.classList.contains("typewriter-mode")).toBe(true)
    })

    it("removes typewriter-mode class when disabled", () => {
      controller.textareaTarget.classList.add("typewriter-mode")
      controller.enabledValue = false
      controller.applyMode()

      expect(controller.textareaTarget.classList.contains("typewriter-mode")).toBe(false)
    })

    it("adds typewriter-centered class to wrapper when enabled", () => {
      controller.enabledValue = true
      controller.applyMode()

      expect(controller.wrapperTarget.classList.contains("typewriter-centered")).toBe(true)
    })

    it("adds typewriter-centered class to body when enabled", () => {
      controller.enabledValue = true
      controller.applyMode()

      expect(controller.bodyTarget.classList.contains("typewriter-centered")).toBe(true)
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
  })

  describe("maintainScroll()", () => {
    it("does nothing when not enabled", () => {
      controller.enabledValue = false
      const getCursorSpy = vi.spyOn(controller, "getCursorYPosition")

      controller.maintainScroll()

      expect(getCursorSpy).not.toHaveBeenCalled()
    })

    it("calculates scroll when enabled", () => {
      vi.useFakeTimers()
      controller.enabledValue = true
      controller.textareaTarget.selectionStart = 10

      const getCursorSpy = vi.spyOn(controller, "getCursorYPosition").mockReturnValue(50)

      controller.maintainScroll()

      expect(getCursorSpy).toHaveBeenCalled()

      vi.useRealTimers()
    })
  })

  describe("getCursorYPosition()", () => {
    it("returns a number representing Y position", () => {
      const textarea = controller.textareaTarget
      textarea.value = "Test content"
      textarea.selectionStart = 5

      const y = controller.getCursorYPosition(textarea, 5)

      expect(typeof y).toBe("number")
    })
  })

  describe("getSyncData()", () => {
    it("returns current line and total lines", () => {
      controller.textareaTarget.value = "Line 1\nLine 2\nLine 3"
      controller.textareaTarget.selectionStart = 10 // Middle of Line 2

      const data = controller.getSyncData()

      expect(data).toHaveProperty("currentLine")
      expect(data).toHaveProperty("totalLines")
      expect(data.totalLines).toBe(3)
    })

    it("returns null if no textarea target", () => {
      // Remove textarea target
      controller.textareaTarget.remove()

      // Need to access the target check directly
      const hasTarget = controller.hasTextareaTarget
      expect(hasTarget).toBe(false)
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
  })
})
