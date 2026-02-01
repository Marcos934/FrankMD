import { Controller } from "@hotwired/stimulus"

// Typewriter Controller
// Handles typewriter mode - focused writing with cursor centered in viewport
// Now delegates scroll management to CodeMirror's typewriter extension
// Dispatches typewriter:toggled event with { enabled }

export default class extends Controller {
  static targets = ["wrapper", "body", "toggleButton", "editor"]

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

    // If CodeMirror is available, toggle its typewriter mode
    const codemirrorController = this.getCodemirrorController()
    if (codemirrorController) {
      codemirrorController.setTypewriterMode(this.enabledValue)
    }

    // Dispatch event for parent controller to handle config save and sidebar/preview coordination
    this.dispatch("toggled", { detail: { enabled: this.enabledValue } })
  }

  // Apply current mode to UI elements
  applyMode() {
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
  // Now delegates to CodeMirror's typewriter extension
  maintainScroll() {
    if (!this.enabledValue) return

    const codemirrorController = this.getCodemirrorController()
    if (codemirrorController) {
      codemirrorController.maintainTypewriterScroll()
    }
  }

  // Get sync data for preview controller
  getSyncData() {
    const codemirrorController = this.getCodemirrorController()
    if (codemirrorController) {
      return codemirrorController.getTypewriterSyncData()
    }
    return null
  }

  // Check if typewriter mode is enabled
  get isEnabled() {
    return this.enabledValue
  }

  // Set enabled state externally (e.g., from config)
  setEnabled(enabled) {
    this.enabledValue = enabled
    this.applyMode()

    // Sync with CodeMirror
    const codemirrorController = this.getCodemirrorController()
    if (codemirrorController) {
      codemirrorController.setTypewriterMode(enabled)
    }
  }

  // Get the CodeMirror controller
  getCodemirrorController() {
    const element = document.querySelector('[data-controller~="codemirror"]')
    if (element) {
      return this.application.getControllerForElementAndIdentifier(element, "codemirror")
    }
    return null
  }
}
