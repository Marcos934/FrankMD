import { Controller } from "@hotwired/stimulus"
import { calculateTypewriterScroll, getTypewriterSyncData } from "lib/typewriter_utils"

// Typewriter Controller
// Handles typewriter mode - focused writing with cursor centered in viewport
// Dispatches typewriter:toggled event with { enabled }

export default class extends Controller {
  static targets = ["textarea", "wrapper", "body", "toggleButton"]

  static values = {
    enabled: { type: Boolean, default: false }
  }

  connect() {
    this.applyMode()
  }

  // Toggle typewriter mode on/off
  toggle() {
    this.enabledValue = !this.enabledValue
    this.applyMode()

    // Immediately apply typewriter scroll if enabling
    if (this.enabledValue) {
      this.maintainScroll()
    }

    // Dispatch event for parent controller to handle config save and sidebar/preview coordination
    this.dispatch("toggled", { detail: { enabled: this.enabledValue } })
  }

  // Apply current mode to UI elements
  applyMode() {
    if (this.hasTextareaTarget) {
      this.textareaTarget.classList.toggle("typewriter-mode", this.enabledValue)
    }
    if (this.hasWrapperTarget) {
      this.wrapperTarget.classList.toggle("typewriter-centered", this.enabledValue)
    }
    if (this.hasBodyTarget) {
      this.bodyTarget.classList.toggle("typewriter-centered", this.enabledValue)
    }
    if (this.hasToggleButtonTarget) {
      this.toggleButtonTarget.classList.toggle("bg-[var(--theme-bg-hover)]", this.enabledValue)
      this.toggleButtonTarget.setAttribute("aria-pressed", this.enabledValue.toString())
    }
  }

  // Keep cursor at center (50%) of the editor in typewriter mode
  maintainScroll() {
    if (!this.enabledValue) return
    if (!this.hasTextareaTarget) return

    const textarea = this.textareaTarget
    const cursorPos = textarea.selectionStart

    // Use mirror div technique to get accurate cursor position
    const cursorY = this.getCursorYPosition(textarea, cursorPos)

    // Calculate desired scroll position using utility function
    const desiredScrollTop = calculateTypewriterScroll(cursorY, textarea.clientHeight)

    // Use setTimeout to ensure we run after all browser scroll behavior
    setTimeout(() => {
      textarea.scrollTop = desiredScrollTop
    }, 0)
  }

  // Get cursor Y position using mirror div technique
  getCursorYPosition(textarea, cursorPos) {
    // Create a mirror div that matches the textarea's styling
    const mirror = document.createElement("div")
    const style = window.getComputedStyle(textarea)

    // Copy relevant styles
    mirror.style.cssText = `
      position: absolute;
      top: -9999px;
      left: -9999px;
      width: ${textarea.clientWidth}px;
      height: auto;
      font-family: ${style.fontFamily};
      font-size: ${style.fontSize};
      font-weight: ${style.fontWeight};
      line-height: ${style.lineHeight};
      padding: ${style.padding};
      border: ${style.border};
      white-space: pre-wrap;
      word-wrap: break-word;
      overflow-wrap: break-word;
    `

    // Get text before cursor and add a marker span
    const textBefore = textarea.value.substring(0, cursorPos)
    mirror.textContent = textBefore

    // Add a marker element at cursor position
    const marker = document.createElement("span")
    marker.textContent = "|"
    mirror.appendChild(marker)

    document.body.appendChild(mirror)
    const cursorY = marker.offsetTop
    document.body.removeChild(mirror)

    return cursorY
  }

  // Get sync data for preview controller
  getSyncData() {
    if (!this.hasTextareaTarget) return null

    const textarea = this.textareaTarget
    return getTypewriterSyncData(textarea.value, textarea.selectionStart)
  }

  // Check if typewriter mode is enabled
  get isEnabled() {
    return this.enabledValue
  }

  // Set enabled state externally (e.g., from config)
  setEnabled(enabled) {
    this.enabledValue = enabled
    this.applyMode()
  }
}
