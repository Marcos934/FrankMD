import { Controller } from "@hotwired/stimulus"
import {
  LINE_NUMBER_MODES,
  normalizeLineNumberMode,
  nextLineNumberMode,
  buildRelativeLineLabels,
  buildAbsoluteLineLabels
} from "lib/line_numbers"

// Line Numbers Controller
// Handles line number gutter display with absolute/relative modes
// Dispatches line-numbers:mode-changed event when mode is toggled

export default class extends Controller {
  static targets = ["gutter", "numbers", "textarea"]

  static values = {
    mode: { type: Number, default: 0 } // 0=OFF, 1=ABSOLUTE, 2=RELATIVE
  }

  connect() {
    this.lineNumberMirror = null
    this.lineNumberUpdateHandle = null
    this.lineNumberResizeObserver = null

    this.ensureLineNumberMirror()
    this.applyMode()
    this.scheduleUpdate()
    this.setupResizeObserver()
  }

  disconnect() {
    if (this.lineNumberResizeObserver) {
      this.lineNumberResizeObserver.disconnect()
    }
    if (this.lineNumberMirror) {
      this.lineNumberMirror.remove()
      this.lineNumberMirror = null
    }
    if (this.lineNumberUpdateHandle) {
      cancelAnimationFrame(this.lineNumberUpdateHandle)
    }
  }

  setupResizeObserver() {
    if (!this.hasTextareaTarget) return

    if (typeof ResizeObserver !== "undefined") {
      this.lineNumberResizeObserver = new ResizeObserver(() => {
        this.scheduleUpdate()
      })
      this.lineNumberResizeObserver.observe(this.textareaTarget)
    }
  }

  // Toggle between line number modes (OFF -> ABSOLUTE -> RELATIVE -> OFF)
  toggle() {
    this.modeValue = nextLineNumberMode(this.modeValue)
    this.applyMode()
    this.scheduleUpdate()

    // Dispatch event for config saving
    this.dispatch("mode-changed", { detail: { mode: this.modeValue } })
  }

  // Apply current mode visibility
  applyMode() {
    if (!this.hasGutterTarget) return
    const isVisible = this.modeValue !== LINE_NUMBER_MODES.OFF
    this.gutterTarget.classList.toggle("hidden", !isVisible)
    if (!isVisible && this.hasNumbersTarget) {
      this.numbersTarget.textContent = ""
    }
  }

  // Schedule an update on next animation frame
  scheduleUpdate() {
    if (!this.hasGutterTarget || !this.hasNumbersTarget || !this.hasTextareaTarget) return
    if (this.modeValue === LINE_NUMBER_MODES.OFF) return

    if (this.lineNumberUpdateHandle) {
      cancelAnimationFrame(this.lineNumberUpdateHandle)
    }

    this.lineNumberUpdateHandle = requestAnimationFrame(() => {
      this.update()
    })
  }

  // Update line number display
  update() {
    if (!this.hasGutterTarget || !this.hasNumbersTarget || !this.hasTextareaTarget) return
    if (this.modeValue === LINE_NUMBER_MODES.OFF) return

    this.lineNumberUpdateHandle = null

    const { totalVisualLines, cursorVisualIndex, visualCountsPerLine } = this.getVisualLineMetrics()
    const labels = this.modeValue === LINE_NUMBER_MODES.RELATIVE
      ? buildRelativeLineLabels(totalVisualLines, cursorVisualIndex)
      : buildAbsoluteLineLabels(visualCountsPerLine)

    const textareaStyle = window.getComputedStyle(this.textareaTarget)
    this.numbersTarget.style.lineHeight = textareaStyle.lineHeight
    this.numbersTarget.style.fontFamily = textareaStyle.fontFamily
    this.numbersTarget.textContent = labels.join("\n")

    let labelWidth = String(Math.max(visualCountsPerLine.length, 1)).length
    if (this.modeValue === LINE_NUMBER_MODES.RELATIVE) {
      const maxDistance = Math.max(cursorVisualIndex, totalVisualLines - 1 - cursorVisualIndex)
      labelWidth = String(maxDistance).length + (maxDistance > 0 ? 1 : 0)
    }
    const digits = Math.max(2, labelWidth)
    this.gutterTarget.style.width = `calc(${digits}ch + 1.5rem)`

    this.syncScroll()
  }

  // Sync line number scroll with textarea
  syncScroll() {
    if (!this.hasNumbersTarget || !this.hasTextareaTarget) return
    if (this.modeValue === LINE_NUMBER_MODES.OFF) return

    const scrollTop = this.textareaTarget.scrollTop
    this.numbersTarget.style.transform = `translateY(-${scrollTop}px)`
  }

  // Calculate visual line metrics for wrapped lines
  getVisualLineMetrics() {
    this.ensureLineNumberMirror()
    this.updateLineNumberMirrorStyle()

    const value = this.textareaTarget.value
    const cursorPos = this.textareaTarget.selectionStart || 0
    const lineHeight = this.getTextareaLineHeight()
    const textareaStyle = window.getComputedStyle(this.textareaTarget)
    const paddingTop = parseFloat(textareaStyle.paddingTop) || 0
    const paddingBottom = parseFloat(textareaStyle.paddingBottom) || 0

    const lines = value.split("\n")
    const beforeCursor = value.slice(0, cursorPos)
    const currentLineIndex = beforeCursor.split("\n").length - 1
    const lastNewlineIndex = beforeCursor.lastIndexOf("\n")
    const columnIndex = beforeCursor.length - (lastNewlineIndex + 1)

    const measureLine = (text) => {
      const content = text.length ? text : "\u200b"
      this.lineNumberMirror.textContent = content
      const contentHeight = Math.max(0, this.lineNumberMirror.scrollHeight - paddingTop - paddingBottom)
      return Math.max(1, Math.round(contentHeight / lineHeight))
    }

    const visualCountsPerLine = lines.map(measureLine)
    const totalVisualLines = visualCountsPerLine.reduce((sum, count) => sum + count, 0)

    const visualLinesBefore = visualCountsPerLine.slice(0, currentLineIndex).reduce((sum, count) => sum + count, 0)
    const currentLineText = lines[currentLineIndex] || ""
    const currentLinePrefix = currentLineText.slice(0, columnIndex)
    const cursorOffset = Math.max(0, measureLine(currentLinePrefix) - 1)
    const cursorVisualIndex = Math.min(totalVisualLines - 1, visualLinesBefore + cursorOffset)

    return { totalVisualLines, cursorVisualIndex, visualCountsPerLine }
  }

  // Get textarea line height
  getTextareaLineHeight() {
    const style = window.getComputedStyle(this.textareaTarget)
    const lineHeight = parseFloat(style.lineHeight)
    if (!Number.isFinite(lineHeight)) {
      const fontSize = parseFloat(style.fontSize) || 14
      return fontSize * 1.5
    }
    return lineHeight
  }

  // Create hidden mirror element for line measurement
  ensureLineNumberMirror() {
    if (this.lineNumberMirror) return

    const mirror = document.createElement("div")
    mirror.setAttribute("aria-hidden", "true")
    mirror.style.position = "absolute"
    mirror.style.top = "0"
    mirror.style.left = "-9999px"
    mirror.style.visibility = "hidden"
    mirror.style.pointerEvents = "none"
    mirror.style.whiteSpace = "pre-wrap"
    mirror.style.wordBreak = "break-word"
    mirror.style.overflowWrap = "break-word"
    mirror.style.boxSizing = "border-box"

    document.body.appendChild(mirror)
    this.lineNumberMirror = mirror
  }

  // Update mirror element styles to match textarea
  updateLineNumberMirrorStyle() {
    const style = window.getComputedStyle(this.textareaTarget)

    this.lineNumberMirror.style.width = `${this.textareaTarget.clientWidth}px`
    this.lineNumberMirror.style.fontFamily = style.fontFamily
    this.lineNumberMirror.style.fontSize = style.fontSize
    this.lineNumberMirror.style.fontWeight = style.fontWeight
    this.lineNumberMirror.style.lineHeight = style.lineHeight
    this.lineNumberMirror.style.letterSpacing = style.letterSpacing
    this.lineNumberMirror.style.padding = style.padding
    this.lineNumberMirror.style.tabSize = style.tabSize
  }

  // Set mode value externally (e.g., from config reload)
  setMode(mode) {
    this.modeValue = normalizeLineNumberMode(mode, LINE_NUMBER_MODES.OFF)
    this.applyMode()
    this.scheduleUpdate()
  }
}
