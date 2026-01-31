import { Controller } from "@hotwired/stimulus"
import { encodePath } from "lib/url_utils"

// Drag and Drop Controller
// Handles file and folder drag-and-drop in the file tree
// Dispatches drag-drop:item-moved event with { oldPath, newPath, type }

export default class extends Controller {
  static targets = ["tree"]

  connect() {
    this.draggedItem = null
  }

  disconnect() {
    this.draggedItem = null
  }

  // Item drag start
  onDragStart(event) {
    const target = event.currentTarget
    this.draggedItem = {
      path: target.dataset.path,
      type: target.dataset.type
    }
    event.dataTransfer.effectAllowed = "move"
    event.dataTransfer.setData("text/plain", target.dataset.path)
    target.classList.add("dragging")

    // Add a slight delay to show the dragging state
    setTimeout(() => {
      target.classList.add("drag-ghost")
    }, 0)
  }

  // Item drag end
  onDragEnd(event) {
    event.currentTarget.classList.remove("dragging", "drag-ghost")
    this.draggedItem = null

    // Remove all drop highlights
    if (this.hasTreeTarget) {
      this.treeTarget.querySelectorAll(".drop-highlight").forEach(el => {
        el.classList.remove("drop-highlight")
      })
      this.treeTarget.classList.remove("drop-highlight-root")
    }
  }

  // Allow drop
  onDragOver(event) {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }

  // Highlight valid drop target
  onDragEnter(event) {
    event.preventDefault()
    const target = event.currentTarget

    if (!this.draggedItem) return

    // Don't allow dropping on itself or its children
    if (this.draggedItem.path === target.dataset.path) return
    if (target.dataset.path.startsWith(this.draggedItem.path + "/")) return

    // Only folders are valid drop targets
    if (target.dataset.type === "folder") {
      target.classList.add("drop-highlight")
    }
  }

  // Remove highlight when leaving
  onDragLeave(event) {
    const target = event.currentTarget
    // Check if we're actually leaving the element (not just entering a child)
    const rect = target.getBoundingClientRect()
    const x = event.clientX
    const y = event.clientY

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      target.classList.remove("drop-highlight")
    }
  }

  // Handle drop on folder
  async onDrop(event) {
    event.preventDefault()
    event.stopPropagation()

    const target = event.currentTarget
    target.classList.remove("drop-highlight")

    if (!this.draggedItem) return
    if (target.dataset.type !== "folder") return

    const sourcePath = this.draggedItem.path
    const targetFolder = target.dataset.path

    // Don't drop on itself or its parent
    if (sourcePath === targetFolder) return
    if (sourcePath.startsWith(targetFolder + "/")) return

    // Get the item name
    const itemName = sourcePath.split("/").pop()
    const newPath = `${targetFolder}/${itemName}`

    // Don't move to same location
    const currentParent = sourcePath.split("/").slice(0, -1).join("/")
    if (currentParent === targetFolder) return

    await this.moveItem(sourcePath, newPath, this.draggedItem.type)
  }

  // Root tree drag over
  onDragOverRoot(event) {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }

  // Root tree drag enter
  onDragEnterRoot(event) {
    event.preventDefault()
    if (!this.draggedItem) return
    if (!this.hasTreeTarget) return

    // Only highlight if the item is not already at root
    if (this.draggedItem.path.includes("/")) {
      this.treeTarget.classList.add("drop-highlight-root")
    }
  }

  // Root tree drag leave
  onDragLeaveRoot(event) {
    if (!this.hasTreeTarget) return

    // Only remove highlight if we're leaving the file tree entirely
    const rect = this.treeTarget.getBoundingClientRect()
    const x = event.clientX
    const y = event.clientY

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      this.treeTarget.classList.remove("drop-highlight-root")
    }
  }

  // Handle drop to root
  async onDropToRoot(event) {
    event.preventDefault()
    event.stopPropagation()

    if (this.hasTreeTarget) {
      this.treeTarget.classList.remove("drop-highlight-root")
    }

    if (!this.draggedItem) return

    const sourcePath = this.draggedItem.path

    // If already at root, do nothing
    if (!sourcePath.includes("/")) return

    const itemName = sourcePath.split("/").pop()
    const newPath = itemName

    await this.moveItem(sourcePath, newPath, this.draggedItem.type)
  }

  // Move item to new location
  async moveItem(oldPath, newPath, type) {
    try {
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || ""
      const endpoint = type === "file" ? "notes" : "folders"
      const response = await fetch(`/${endpoint}/${encodePath(oldPath)}/rename`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken
        },
        body: JSON.stringify({ new_path: newPath })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || window.t("errors.failed_to_move"))
      }

      // Dispatch event for parent controller to handle state updates
      this.dispatch("item-moved", {
        detail: { oldPath, newPath, type }
      })
    } catch (error) {
      console.error("Error moving item:", error)
      alert(error.message)
    }
  }
}
