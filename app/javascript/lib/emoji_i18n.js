// Emoji i18n module - loads translated emoji data from emojibase
// Provides locale-aware emoji search while keeping our shortcodes

// Map app locales to emojibase locales
const LOCALE_MAP = {
  "en": "en",
  "pt-BR": "pt",
  "pt-PT": "pt",
  "es": "es",
  "ja": "ja",
  "ko": "ko",
  "he": "en"  // Hebrew not supported, fallback to English
}

// Cache for loaded locale data
const localeCache = {}

// Current locale
let currentLocale = "en"

/**
 * Set the current locale for emoji search
 * @param {string} locale - App locale code (e.g., "pt-BR", "ja")
 */
export function setEmojiLocale(locale) {
  currentLocale = LOCALE_MAP[locale] || "en"
}

/**
 * Get the emojibase locale code for the current app locale
 * @returns {string} Emojibase locale code
 */
export function getEmojibaseLocale() {
  return currentLocale
}

/**
 * Load emoji data for a locale from CDN
 * @param {string} locale - Emojibase locale code
 * @returns {Promise<Array>} Array of emoji objects with label, tags, emoji
 */
async function loadLocaleData(locale) {
  if (localeCache[locale]) {
    return localeCache[locale]
  }

  try {
    const url = `https://cdn.jsdelivr.net/npm/emojibase-data@latest/${locale}/compact.json`
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to load emoji data for ${locale}`)
    }
    const data = await response.json()
    localeCache[locale] = data
    return data
  } catch (error) {
    console.error(`Failed to load emoji locale ${locale}:`, error)
    // Fallback to English if locale fails
    if (locale !== "en") {
      return loadLocaleData("en")
    }
    return []
  }
}

/**
 * Get translated emoji data for current locale
 * @returns {Promise<Array>} Array of emoji objects
 */
export async function getTranslatedEmojis() {
  return loadLocaleData(currentLocale)
}

/**
 * Build a search index from emojibase data
 * Maps unicode emoji to searchable terms (label + tags)
 * @param {Array} emojibaseData - Data from emojibase
 * @returns {Map} Map of emoji character -> {label, tags, searchTerms}
 */
export function buildSearchIndex(emojibaseData) {
  const index = new Map()

  for (const entry of emojibaseData) {
    if (!entry.unicode && !entry.emoji) continue

    const emoji = entry.unicode || entry.emoji
    const label = entry.label || ""
    const tags = entry.tags || []

    // Combine label and tags into searchable terms
    const searchTerms = [label, ...tags].join(" ").toLowerCase()

    index.set(emoji, {
      label,
      tags,
      searchTerms
    })
  }

  return index
}

/**
 * Preload emoji data for a locale
 * Call this early to avoid delay when opening picker
 * @param {string} appLocale - App locale code
 */
export async function preloadEmojiData(appLocale) {
  const locale = LOCALE_MAP[appLocale] || "en"
  await loadLocaleData(locale)
}
