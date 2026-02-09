import { Controller } from "@hotwired/stimulus"
import { getEditorContent } from "lib/codemirror_adapter"

export default class extends Controller {
  connect() {
    this._scrollSource = null
    this._scrollSourceTimeout = null
    this.typewriterModeEnabled = false
  }

  disconnect() {
    if (this._scrollSourceTimeout) clearTimeout(this._scrollSourceTimeout)
  }

  // === Controller Lookups ===

  _getController(name, selector) {
    const element = document.querySelector(selector)
    if (element) {
      return this.application.getControllerForElementAndIdentifier(element, name)
    }
    return null
  }

  getCodemirrorController() {
    return this._getController("codemirror", '[data-controller~="codemirror"]')
  }

  getPreviewController() {
    return this._getController("preview", '[data-controller~="preview"]')
  }

  // === Event Handlers ===

  onTypewriterToggled(event) {
    const { enabled } = event.detail
    this.typewriterModeEnabled = enabled
  }

  onEditorScroll(event) {
    const previewController = this.getPreviewController()
    if (!previewController || !previewController.isVisible) return

    if (this._scrollSource === "preview") return

    this._markScrollFromEditor()

    const scrollRatio = event.detail?.scrollRatio || 0
    previewController.syncScrollRatio(scrollRatio)
  }

  onPreviewScroll(event) {
    const codemirrorController = this.getCodemirrorController()
    if (!codemirrorController) return

    if (this._scrollSource === "editor") return

    this._markScrollFromPreview()

    const { scrollRatio, sourceLine, totalLines } = event.detail
    const scrollInfo = codemirrorController.getScrollInfo()
    const maxScroll = scrollInfo.height - scrollInfo.clientHeight
    if (maxScroll <= 0) return

    if (scrollRatio <= 0.01) {
      if (scrollInfo.top !== 0) {
        codemirrorController.scrollTo(0)
      }
      return
    }

    if (scrollRatio >= 0.99) {
      if (Math.abs(scrollInfo.top - maxScroll) > 1) {
        codemirrorController.scrollTo(maxScroll)
      }
      return
    }

    let targetScroll

    if (sourceLine && totalLines > 1) {
      const lineRatio = (sourceLine - 1) / (totalLines - 1)
      targetScroll = lineRatio * maxScroll
    } else {
      targetScroll = scrollRatio * maxScroll
    }

    if (Math.abs(scrollInfo.top - targetScroll) > 5) {
      codemirrorController.scrollTo(targetScroll)
    }
  }

  onPreviewToggled(event) {
    const { visible } = event.detail
    if (visible) {
      this.updatePreview()
      const codemirrorController = this.getCodemirrorController()
      const previewController = this.getPreviewController()
      if (codemirrorController && previewController) {
        const scrollRatio = codemirrorController.getScrollRatio()
        previewController.syncScrollRatio(scrollRatio)
      }
    }
  }

  // === Public API ===

  updatePreviewWithSync() {
    const previewController = this.getPreviewController()
    if (!previewController || !previewController.isVisible) return

    const codemirrorController = this.getCodemirrorController()
    const textarea = document.querySelector('[data-app-target="textarea"]')
    const content = getEditorContent(codemirrorController, textarea)

    if (this.typewriterModeEnabled) {
      const cursorInfo = codemirrorController ? codemirrorController.getCursorPosition() : { offset: 0 }
      previewController.updateWithSync(content, {
        cursorPos: cursorInfo.offset,
        typewriterMode: true
      })
    } else {
      previewController.render(content)
    }
  }

  updatePreview() {
    const previewController = this.getPreviewController()
    if (!previewController || !previewController.isVisible) return

    const codemirrorController = this.getCodemirrorController()
    const textarea = document.querySelector('[data-app-target="textarea"]')
    const content = getEditorContent(codemirrorController, textarea)

    previewController.render(content)
  }

  syncPreviewScrollToCursor() {
    const previewController = this.getPreviewController()
    if (previewController) {
      previewController.syncToCursor()
    }
  }

  // === Internal ===

  _markScrollFromEditor() {
    this._scrollSource = "editor"
    if (this._scrollSourceTimeout) {
      clearTimeout(this._scrollSourceTimeout)
    }
    this._scrollSourceTimeout = setTimeout(() => {
      this._scrollSource = null
    }, 400)
  }

  _markScrollFromPreview() {
    this._scrollSource = "preview"
    if (this._scrollSourceTimeout) {
      clearTimeout(this._scrollSourceTimeout)
    }
    this._scrollSourceTimeout = setTimeout(() => {
      this._scrollSource = null
    }, 400)
  }
}
