import { Controller } from "@hotwired/stimulus"
import { get } from "@rails/request.js"
import { normalizeLineNumberMode } from "lib/line_numbers"

// EditorConfigController
// Manages editor configuration via Stimulus values synced from server.
// Applies settings to CodeMirror, preview, and CSS custom properties.

export default class extends Controller {
  static outlets = ["codemirror", "preview"]

  static values = {
    font: { type: String, default: "cascadia-code" },
    fontSize: { type: Number, default: 14 },
    editorWidth: { type: Number, default: 72 },
    previewZoom: { type: Number, default: 100 },
    lineNumbers: { type: Number, default: 0 },
    typewriterMode: { type: Boolean, default: false },
    indent: { type: Number, default: 2 },
    theme: { type: String, default: "" }
  }

  static editorFonts = [
    { id: "cascadia-code", name: "Cascadia Code", family: "'Cascadia Code', monospace" },
    { id: "consolas", name: "Consolas", family: "Consolas, monospace" },
    { id: "dejavu-mono", name: "DejaVu Sans Mono", family: "'DejaVu Mono', monospace" },
    { id: "fira-code", name: "Fira Code", family: "'Fira Code', monospace" },
    { id: "hack", name: "Hack", family: "Hack, monospace" },
    { id: "jetbrains-mono", name: "JetBrains Mono", family: "'JetBrains Mono', monospace" },
    { id: "roboto-mono", name: "Roboto Mono", family: "'Roboto Mono', monospace" },
    { id: "source-code-pro", name: "Source Code Pro", family: "'Source Code Pro', monospace" },
    { id: "ubuntu-mono", name: "Ubuntu Mono", family: "'Ubuntu Mono', monospace" }
  ]

  connect() {
    // Apply all settings on connect
    this.applyFont()
    this.applyEditorWidth()
    this.applyPreviewZoom()
    this.applyLineNumbers()
    this.applyTheme()
  }

  // === Value Change Callbacks ===

  fontValueChanged() {
    if (this.element.isConnected) this.applyFont()
  }

  fontSizeValueChanged() {
    if (this.element.isConnected) this.applyFont()
  }

  editorWidthValueChanged() {
    if (this.element.isConnected) this.applyEditorWidth()
  }

  previewZoomValueChanged() {
    if (this.element.isConnected) this.applyPreviewZoom()
  }

  lineNumbersValueChanged() {
    if (this.element.isConnected) this.applyLineNumbers()
  }

  themeValueChanged() {
    if (this.element.isConnected) this.applyTheme()
  }

  // === Apply Methods ===

  applyFont() {
    const font = this.constructor.editorFonts.find(f => f.id === this.fontValue)
    const codemirror = this.getCodemirrorController()
    if (codemirror && font) {
      codemirror.setFontFamily(font.family)
      codemirror.setFontSize(this.fontSizeValue)
    }
  }

  applyEditorWidth() {
    document.documentElement.style.setProperty("--editor-width", `${this.editorWidthValue}ch`)
  }

  applyPreviewZoom() {
    const preview = this.getPreviewController()
    if (preview) {
      preview.zoomValue = this.previewZoomValue
    }
  }

  applyLineNumbers() {
    const mode = normalizeLineNumberMode(this.lineNumbersValue, "off")
    const codemirror = this.getCodemirrorController()
    if (codemirror) {
      codemirror.setLineNumberMode(mode)
    }
  }

  applyTheme() {
    if (this.themeValue) {
      window.dispatchEvent(new CustomEvent("frankmd:config-changed", {
        detail: { theme: this.themeValue }
      }))
    }
  }

  // === Reload from Server ===

  async reload() {
    try {
      const response = await get("/config/editor")
      if (response.ok) {
        const html = await response.text
        this.element.outerHTML = html
      }
    } catch (error) {
      console.warn("Error reloading editor config:", error)
    }
  }

  // === Controller Getters (via Stimulus Outlets) ===

  getCodemirrorController() { return this.hasCodemirrorOutlet ? this.codemirrorOutlet : null }
  getPreviewController() { return this.hasPreviewOutlet ? this.previewOutlet : null }

  // === Public Getters for App Controller ===

  get currentFont() { return this.fontValue }
  get currentFontSize() { return this.fontSizeValue }
  get editorWidth() { return this.editorWidthValue }
  get previewZoom() { return this.previewZoomValue }
  get lineNumberMode() { return normalizeLineNumberMode(this.lineNumbersValue, "off") }
  get typewriterModeEnabled() { return this.typewriterModeValue }
  get editorIndent() { return this.indentValue }
  get fonts() { return this.constructor.editorFonts }
}
