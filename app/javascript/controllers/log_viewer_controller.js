import { Controller } from "@hotwired/stimulus"
import { get } from "@rails/request.js"

// Log Viewer Controller
// Opens a dialog showing the last 100 lines of the Rails log
// and a Config tab showing current configuration with value sources
// Triggered by keyboard shortcut Ctrl+Shift+O (via app_controller)

export default class extends Controller {
  static targets = ["dialog", "content", "status", "environment", "title",
                     "configContent", "tabLogs", "tabConfig"]

  async open() {
    if (!this.hasDialogTarget) return

    this.activeTab = "logs"
    this.dialogTarget.showModal()
    this.showLoading()
    await this.fetchLogs()
  }

  close() {
    if (this.hasDialogTarget) {
      this.dialogTarget.close()
    }
  }

  showLoading() {
    if (this.activeTab === "config") {
      if (this.hasConfigContentTarget) {
        this.configContentTarget.textContent = "Loading..."
      }
    } else {
      if (this.hasContentTarget) {
        this.contentTarget.textContent = "Loading..."
      }
    }
    if (this.hasStatusTarget) {
      this.statusTarget.textContent = ""
    }
  }

  showLogs() {
    this.activeTab = "logs"
    this.updateTabStyles()
    if (this.hasContentTarget) this.contentTarget.classList.remove("hidden")
    if (this.hasConfigContentTarget) this.configContentTarget.classList.add("hidden")
    if (this.hasTitleTarget) this.titleTarget.textContent = "Rails Log"
  }

  async showConfig() {
    this.activeTab = "config"
    this.updateTabStyles()
    if (this.hasContentTarget) this.contentTarget.classList.add("hidden")
    if (this.hasConfigContentTarget) this.configContentTarget.classList.remove("hidden")
    if (this.hasTitleTarget) this.titleTarget.textContent = "Configuration"

    this.showLoading()
    await this.fetchConfig()
  }

  updateTabStyles() {
    const activeClasses = "border-[var(--theme-accent)] text-[var(--theme-text-primary)]"
    const inactiveClasses = "border-transparent text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)]"

    if (this.hasTabLogsTarget && this.hasTabConfigTarget) {
      if (this.activeTab === "logs") {
        this.tabLogsTarget.className = `px-4 py-2 text-xs font-medium border-b-2 ${activeClasses}`
        this.tabConfigTarget.className = `px-4 py-2 text-xs font-medium border-b-2 ${inactiveClasses}`
      } else {
        this.tabLogsTarget.className = `px-4 py-2 text-xs font-medium border-b-2 ${inactiveClasses}`
        this.tabConfigTarget.className = `px-4 py-2 text-xs font-medium border-b-2 ${activeClasses}`
      }
    }
  }

  async fetchLogs() {
    try {
      const response = await get("/logs/tail?lines=100", { responseKind: "json" })

      if (!response.ok) {
        throw new Error(`HTTP ${response.statusCode}`)
      }

      const data = await response.json

      if (this.hasEnvironmentTarget) {
        this.environmentTarget.textContent = `${data.environment} - ${data.file}`
      }

      if (this.hasContentTarget) {
        if (data.lines && data.lines.length > 0) {
          this.contentTarget.textContent = data.lines.join("\n")
          // Scroll to bottom
          this.contentTarget.scrollTop = this.contentTarget.scrollHeight
        } else {
          this.contentTarget.textContent = "(log is empty)"
        }
      }

      if (this.hasStatusTarget) {
        this.statusTarget.textContent = `${data.lines?.length || 0} lines`
      }
    } catch (error) {
      console.error("[FrankMD] Failed to fetch logs:", error)
      if (this.hasContentTarget) {
        this.contentTarget.textContent = `Error loading logs: ${error.message}`
      }
    }
  }

  async fetchConfig() {
    try {
      const response = await get("/logs/config", { responseKind: "json" })

      if (!response.ok) {
        throw new Error(`HTTP ${response.statusCode}`)
      }

      const data = await response.json

      if (this.hasEnvironmentTarget) {
        this.environmentTarget.textContent = `${data.environment} - ${data.config_file_exists ? data.config_file : "(no .fed file)"}`
      }

      if (this.hasConfigContentTarget) {
        this.configContentTarget.innerHTML = this.renderConfigTable(data)
      }

      if (this.hasStatusTarget) {
        this.statusTarget.textContent = `${data.entries?.length || 0} keys`
      }
    } catch (error) {
      console.error("[FrankMD] Failed to fetch config:", error)
      if (this.hasConfigContentTarget) {
        this.configContentTarget.textContent = `Error loading config: ${error.message}`
      }
    }
  }

  renderConfigTable(data) {
    const sourceLabel = (source) => {
      switch (source) {
        case "file": return `<span class="text-green-400 font-bold">.fed</span>`
        case "env": return `<span class="text-yellow-400 font-bold">ENV</span>`
        case "default": return `<span class="text-[var(--theme-text-muted)]">default</span>`
        default: return source
      }
    }

    const escapeHtml = (str) => {
      if (str === null || str === undefined) return "<span class='text-[var(--theme-text-muted)]'>nil</span>"
      const div = document.createElement("div")
      div.textContent = String(str)
      return div.innerHTML
    }

    let html = ""

    // Header info
    html += `<div class="mb-4 p-3 rounded bg-[var(--theme-bg-secondary)] border border-[var(--theme-border)]">`
    html += `<div><strong>Config file:</strong> ${escapeHtml(data.config_file)}</div>`
    html += `<div><strong>File exists:</strong> ${data.config_file_exists ? "yes" : "no"}</div>`
    html += `<div><strong>AI configured in .fed:</strong> ${data.ai_configured_in_file ? "yes (ENV AI vars ignored)" : "no (using ENV vars)"}</div>`
    html += `</div>`

    // Table
    html += `<table class="w-full border-collapse">`
    html += `<thead><tr class="border-b border-[var(--theme-border)]">`
    html += `<th class="text-left py-1.5 px-2 text-[var(--theme-text-muted)]">Key</th>`
    html += `<th class="text-left py-1.5 px-2 text-[var(--theme-text-muted)]">Value</th>`
    html += `<th class="text-left py-1.5 px-2 text-[var(--theme-text-muted)]">Source</th>`
    html += `<th class="text-left py-1.5 px-2 text-[var(--theme-text-muted)]">ENV var</th>`
    html += `</tr></thead><tbody>`

    for (const entry of data.entries) {
      const rowClass = entry.source === "file" ? "bg-green-900/10" :
                       entry.source === "env" ? "bg-yellow-900/10" : ""
      html += `<tr class="border-b border-[var(--theme-border)]/30 ${rowClass}">`
      html += `<td class="py-1.5 px-2 font-mono">${escapeHtml(entry.key)}</td>`
      html += `<td class="py-1.5 px-2 font-mono">${escapeHtml(entry.value)}</td>`
      html += `<td class="py-1.5 px-2">${sourceLabel(entry.source)}</td>`
      html += `<td class="py-1.5 px-2 text-[var(--theme-text-muted)]">${entry.env_var ? escapeHtml(entry.env_var) : "-"}</td>`
      html += `</tr>`
    }

    html += `</tbody></table>`
    return html
  }

  async refresh() {
    this.showLoading()
    if (this.activeTab === "config") {
      await this.fetchConfig()
    } else {
      await this.fetchLogs()
    }
  }

  onDialogClick(event) {
    // Close when clicking backdrop
    if (event.target === this.dialogTarget) {
      this.close()
    }
  }

  onKeydown(event) {
    if (event.key === "Escape") {
      this.close()
    }
  }
}
