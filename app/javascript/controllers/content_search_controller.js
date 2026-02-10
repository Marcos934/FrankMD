import { Controller } from "@hotwired/stimulus"
import { get } from "@rails/request.js"

// Content Search Controller
// Handles Ctrl+Shift+F content search dialog with regex support
// Dispatches content-search:selected event with path and line number

export default class extends Controller {
  static targets = [
    "dialog",
    "input",
    "results",
    "status",
    "spinner"
  ]

  connect() {
    this.searchResultsData = []
    this.selectedIndex = 0
    this.searchTimeout = null
    this.usingKeyboard = false
    this.isSearching = false
  }

  open() {
    this.searchResultsData = []
    this.selectedIndex = 0
    this.inputTarget.value = ""
    this.resultsTarget.innerHTML = ""
    this.statusTarget.textContent = window.t("status.type_to_search_regex")
    this.dialogTarget.showModal()
    this.inputTarget.focus()
  }

  close() {
    this.dialogTarget.close()
  }

  onInput() {
    const query = this.inputTarget.value.trim()

    // Debounce search
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout)
    }

    if (!query) {
      this.searchResultsData = []
      this.resultsTarget.innerHTML = ""
      this.statusTarget.textContent = window.t("status.type_to_search_regex")
      this.hideSpinner()
      return
    }

    this.statusTarget.textContent = window.t("status.searching")
    this.showSpinner()

    this.searchTimeout = setTimeout(async () => {
      await this.performSearch(query)
    }, 300)
  }

  showSpinner() {
    this.isSearching = true
    if (this.hasSpinnerTarget) {
      this.spinnerTarget.classList.remove("hidden")
    }
  }

  hideSpinner() {
    this.isSearching = false
    if (this.hasSpinnerTarget) {
      this.spinnerTarget.classList.add("hidden")
    }
  }

  async performSearch(query) {
    try {
      const response = await get(`/notes/search?q=${encodeURIComponent(query)}`, { responseKind: "html" })

      if (!response.ok) {
        throw new Error(window.t("errors.search_failed"))
      }

      const html = await response.text
      this.resultsTarget.innerHTML = html
      this.selectedIndex = 0

      // Count results from rendered buttons
      const buttons = this.resultsTarget.querySelectorAll("[data-index]")
      this.searchResultsData = Array.from(buttons).map(btn => ({
        path: btn.dataset.path,
        line_number: parseInt(btn.dataset.line)
      }))

      const count = this.searchResultsData.length
      const maxMsg = count >= 20 ? " (showing first 20)" : ""
      this.statusTarget.textContent = count === 0
        ? window.t("status.no_matches")
        : `${count} match${count === 1 ? "" : "es"} found${maxMsg} - use \u2191\u2193 to navigate, Enter to open`
    } catch (error) {
      console.error("Search error:", error)
      this.statusTarget.textContent = window.t("status.search_error")
      this.resultsTarget.innerHTML = ""
    } finally {
      this.hideSpinner()
    }
  }

  onKeydown(event) {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      this.usingKeyboard = true
      if (this.selectedIndex < this.searchResultsData.length - 1) {
        this.updateSelection(this.selectedIndex + 1)
        this.scrollIntoView()
      }
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      this.usingKeyboard = true
      if (this.selectedIndex > 0) {
        this.updateSelection(this.selectedIndex - 1)
        this.scrollIntoView()
      }
    } else if (event.key === "Enter") {
      event.preventDefault()
      this.selectCurrent()
    }
  }

  // Update selection without re-rendering entire list
  updateSelection(newIndex) {
    const oldSelected = this.resultsTarget.querySelector(`[data-index="${this.selectedIndex}"]`)
    const newSelected = this.resultsTarget.querySelector(`[data-index="${newIndex}"]`)

    if (oldSelected) {
      oldSelected.classList.remove("bg-[var(--theme-accent)]", "text-[var(--theme-accent-text)]")
      oldSelected.classList.add("hover:bg-[var(--theme-bg-hover)]")
      // Update icon color
      const oldIcon = oldSelected.querySelector("svg")
      if (oldIcon) oldIcon.classList.add("text-[var(--theme-text-muted)]")
      // Update line number color
      const oldLineNum = oldSelected.querySelector(".text-xs.opacity-80, .text-xs:not(.opacity-70)")
      if (oldLineNum && oldLineNum.classList.contains("opacity-80")) {
        oldLineNum.classList.remove("opacity-80")
        oldLineNum.classList.add("text-[var(--theme-text-muted)]")
      }
      // Update path color
      const oldPath = oldSelected.querySelector(".opacity-70")
      if (oldPath) {
        oldPath.classList.remove("opacity-70")
        oldPath.classList.add("text-[var(--theme-text-faint)]")
      }
      // Update context background
      const oldContext = oldSelected.querySelector(".bg-black\\/20")
      if (oldContext) {
        oldContext.classList.remove("bg-black/20")
        oldContext.classList.add("bg-[var(--theme-bg-tertiary)]")
      }
    }

    if (newSelected) {
      newSelected.classList.remove("hover:bg-[var(--theme-bg-hover)]")
      newSelected.classList.add("bg-[var(--theme-accent)]", "text-[var(--theme-accent-text)]")
      // Update icon color
      const newIcon = newSelected.querySelector("svg")
      if (newIcon) newIcon.classList.remove("text-[var(--theme-text-muted)]")
      // Update line number color
      const newLineNum = newSelected.querySelector(".text-xs.text-\\[var\\(--theme-text-muted\\)\\]")
      if (newLineNum) {
        newLineNum.classList.remove("text-[var(--theme-text-muted)]")
        newLineNum.classList.add("opacity-80")
      }
      // Update path color
      const newPath = newSelected.querySelector(".text-\\[var\\(--theme-text-faint\\)\\]")
      if (newPath) {
        newPath.classList.remove("text-[var(--theme-text-faint)]")
        newPath.classList.add("opacity-70")
      }
      // Update context background
      const newContext = newSelected.querySelector(".bg-\\[var\\(--theme-bg-tertiary\\)\\]")
      if (newContext) {
        newContext.classList.remove("bg-[var(--theme-bg-tertiary)]")
        newContext.classList.add("bg-black/20")
      }
    }

    this.selectedIndex = newIndex
  }

  scrollIntoView() {
    const selected = this.resultsTarget.querySelector(`[data-index="${this.selectedIndex}"]`)
    if (selected) {
      selected.scrollIntoView({ block: "nearest" })
    }
  }

  onHover(event) {
    // Ignore hover events when navigating with keyboard
    if (this.usingKeyboard) return

    const index = parseInt(event.currentTarget.dataset.index)
    if (index !== this.selectedIndex) {
      this.updateSelection(index)
    }
  }

  onMouseMove() {
    // Re-enable mouse selection when mouse moves
    this.usingKeyboard = false
  }

  selectFromClick(event) {
    const path = event.currentTarget.dataset.path
    const line = parseInt(event.currentTarget.dataset.line)
    this.dispatchSelected(path, line)
  }

  selectCurrent() {
    if (this.searchResultsData.length === 0) return
    const result = this.searchResultsData[this.selectedIndex]
    if (result) {
      this.dispatchSelected(result.path, result.line_number)
    }
  }

  dispatchSelected(path, lineNumber) {
    this.dispatch("selected", { detail: { path, lineNumber } })
    this.close()
  }
}
