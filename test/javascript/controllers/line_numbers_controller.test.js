/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { Application } from "@hotwired/stimulus"
import LineNumbersController from "../../../app/javascript/controllers/line_numbers_controller.js"

describe("LineNumbersController", () => {
  let application, controller, element, cleanupMirror

  beforeEach(() => {
    // Create a fresh DOM for each test
    document.body.innerHTML = `
      <div data-controller="line-numbers" data-line-numbers-mode-value="0">
        <div data-line-numbers-target="gutter" class="hidden" style="width: 3rem;">
          <pre data-line-numbers-target="numbers"></pre>
        </div>
        <textarea data-line-numbers-target="textarea" style="font-size: 14px; line-height: 21px;">Line 1
Line 2
Line 3</textarea>
      </div>
    `

    // Mock requestAnimationFrame to execute immediately
    vi.spyOn(window, "requestAnimationFrame").mockImplementation(function (cb) {
      cb()
      return 1
    })
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(function () {})

    // Mock ResizeObserver
    global.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }

    element = document.querySelector('[data-controller="line-numbers"]')
    application = Application.start()
    application.register("line-numbers", LineNumbersController)

    return new Promise((resolve) => {
      setTimeout(() => {
        controller = application.getControllerForElementAndIdentifier(element, "line-numbers")
        // Store cleanup function
        cleanupMirror = () => {
          if (controller && controller.lineNumberMirror) {
            try {
              if (controller.lineNumberMirror.parentNode) {
                controller.lineNumberMirror.parentNode.removeChild(controller.lineNumberMirror)
              }
            } catch (e) {
              // Ignore cleanup errors
            }
            controller.lineNumberMirror = null
          }
        }
        resolve()
      }, 0)
    })
  })

  afterEach(() => {
    // Clean up mirror element
    if (cleanupMirror) cleanupMirror()
    application.stop()
    document.body.innerHTML = ""
    vi.restoreAllMocks()
  })

  describe("connect()", () => {
    it("initializes with mode OFF by default", () => {
      expect(controller.modeValue).toBe(0)
    })

    it("hides gutter when mode is OFF", () => {
      expect(controller.gutterTarget.classList.contains("hidden")).toBe(true)
    })
  })

  describe("toggle()", () => {
    it("cycles from OFF to ABSOLUTE", () => {
      controller.modeValue = 0 // OFF
      controller.toggle()

      expect(controller.modeValue).toBe(1) // ABSOLUTE
    })

    it("cycles from ABSOLUTE to RELATIVE", () => {
      controller.modeValue = 1 // ABSOLUTE
      controller.toggle()

      expect(controller.modeValue).toBe(2) // RELATIVE
    })

    it("cycles from RELATIVE to OFF", () => {
      controller.modeValue = 2 // RELATIVE
      controller.toggle()

      expect(controller.modeValue).toBe(0) // OFF
    })

    it("dispatches mode-changed event", () => {
      const dispatchSpy = vi.spyOn(controller, "dispatch")
      controller.modeValue = 0

      controller.toggle()

      expect(dispatchSpy).toHaveBeenCalledWith("mode-changed", {
        detail: { mode: 1 }
      })
    })
  })

  describe("applyMode()", () => {
    it("shows gutter when mode is ABSOLUTE", () => {
      controller.modeValue = 1
      controller.applyMode()

      expect(controller.gutterTarget.classList.contains("hidden")).toBe(false)
    })

    it("shows gutter when mode is RELATIVE", () => {
      controller.modeValue = 2
      controller.applyMode()

      expect(controller.gutterTarget.classList.contains("hidden")).toBe(false)
    })

    it("hides gutter when mode is OFF", () => {
      controller.modeValue = 0
      controller.applyMode()

      expect(controller.gutterTarget.classList.contains("hidden")).toBe(true)
    })
  })

  describe("scheduleUpdate()", () => {
    it("does nothing when mode is OFF", () => {
      controller.modeValue = 0
      const updateSpy = vi.spyOn(controller, "update")

      controller.scheduleUpdate()

      expect(updateSpy).not.toHaveBeenCalled()
    })

    it("schedules update when mode is not OFF", () => {
      controller.modeValue = 1
      const updateSpy = vi.spyOn(controller, "update")

      controller.scheduleUpdate()

      expect(updateSpy).toHaveBeenCalled()
    })
  })

  describe("syncScroll()", () => {
    it("applies scroll transform to numbers", () => {
      controller.modeValue = 1
      controller.textareaTarget.scrollTop = 100

      controller.syncScroll()

      expect(controller.numbersTarget.style.transform).toBe("translateY(-100px)")
    })

    it("does nothing when mode is OFF", () => {
      controller.modeValue = 0
      controller.numbersTarget.style.transform = ""

      controller.syncScroll()

      expect(controller.numbersTarget.style.transform).toBe("")
    })
  })

  describe("setMode()", () => {
    it("sets mode value and applies it", () => {
      const applySpy = vi.spyOn(controller, "applyMode")
      const updateSpy = vi.spyOn(controller, "scheduleUpdate")

      controller.setMode(2)

      expect(controller.modeValue).toBe(2)
      expect(applySpy).toHaveBeenCalled()
      expect(updateSpy).toHaveBeenCalled()
    })

    it("normalizes invalid mode values", () => {
      controller.setMode(99)

      expect(controller.modeValue).toBe(0) // Falls back to OFF
    })
  })
})
