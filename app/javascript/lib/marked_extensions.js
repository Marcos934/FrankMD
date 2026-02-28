// Marked extensions for custom markdown syntax
// Adds support for: superscript, subscript, highlight, and emoji shortcodes

// Import emoji data from the picker controller
// We need to extract this to avoid circular dependencies
import { getEmojiMap } from "lib/emoji_data"

// Superscript extension: ^text^ -> <sup>text</sup>
export const superscriptExtension = {
  name: "superscript",
  level: "inline",
  start(src) {
    return src.indexOf("^")
  },
  tokenizer(src) {
    // Match ^text^ but not ^^
    const match = src.match(/^\^([^\^]+)\^/)
    if (match) {
      return {
        type: "superscript",
        raw: match[0],
        text: match[1]
      }
    }
  },
  renderer(token) {
    return `<sup>${token.text}</sup>`
  }
}

// Subscript extension: ~text~ -> <sub>text</sub>
// Note: GFM uses ~~ for strikethrough, so we need single ~
export const subscriptExtension = {
  name: "subscript",
  level: "inline",
  start(src) {
    return src.indexOf("~")
  },
  tokenizer(src) {
    // Match ~text~ but not ~~ (strikethrough)
    const match = src.match(/^~([^~]+)~(?!~)/)
    if (match) {
      return {
        type: "subscript",
        raw: match[0],
        text: match[1]
      }
    }
  },
  renderer(token) {
    return `<sub>${token.text}</sub>`
  }
}

// Highlight extension: ==text== -> <mark>text</mark>
export const highlightExtension = {
  name: "highlight",
  level: "inline",
  start(src) {
    return src.indexOf("==")
  },
  tokenizer(src) {
    const match = src.match(/^==([^=]+)==/)
    if (match) {
      return {
        type: "highlight",
        raw: match[0],
        text: match[1]
      }
    }
  },
  renderer(token) {
    return `<mark>${token.text}</mark>`
  }
}

// Color extension: [text]{color} -> <span style="color:color">text</span>
export const colorExtension = {
  name: "color",
  level: "inline",
  start(src) {
    return src.indexOf("[")
  },
  tokenizer(src) {
    // Match [text]{color} pattern - use non-greedy matching to avoid swallowing multiple tags
    const match = src.match(/^\[((?:(?!\]\{).)*)\]\{([a-zA-Z#0-9-]+)\}/)
    if (match) {
      return {
        type: "color",
        raw: match[0],
        text: match[1],
        color: match[2]
      }
    }
  },
  renderer(token) {
    // Support both color names and hex codes
    return `<span style="color:${token.color}">${token.text}</span>`
  }
}

// Emoji extension: :shortcode: -> emoji character
export const emojiExtension = {
  name: "emoji",
  level: "inline",
  start(src) {
    return src.indexOf(":")
  },
  tokenizer(src) {
    // Match :shortcode: pattern
    const match = src.match(/^:([a-z0-9_+-]+):/)
    if (match) {
      const shortcode = match[1]
      const emojiMap = getEmojiMap()
      const emoji = emojiMap[shortcode]
      if (emoji) {
        return {
          type: "emoji",
          raw: match[0],
          emoji: emoji
        }
      }
    }
  },
  renderer(token) {
    return token.emoji
  }
}

// Export all extensions as an array for easy use with marked.use()
export const allExtensions = [
  superscriptExtension,
  subscriptExtension,
  highlightExtension,
  colorExtension,
  emojiExtension
]
