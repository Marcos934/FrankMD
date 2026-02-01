// Line number mode constants and utilities
// Used by both app_controller and CodeMirror extensions

export const LINE_NUMBER_MODES = {
  OFF: 0,
  ABSOLUTE: 1,
  RELATIVE: 2
}

export function normalizeLineNumberMode(value, fallback = LINE_NUMBER_MODES.ABSOLUTE) {
  const parsed = Number.parseInt(value, 10)
  if (parsed === LINE_NUMBER_MODES.OFF || parsed === LINE_NUMBER_MODES.ABSOLUTE || parsed === LINE_NUMBER_MODES.RELATIVE) {
    return parsed
  }
  return fallback
}

export function nextLineNumberMode(mode) {
  if (mode === LINE_NUMBER_MODES.OFF) return LINE_NUMBER_MODES.ABSOLUTE
  if (mode === LINE_NUMBER_MODES.ABSOLUTE) return LINE_NUMBER_MODES.RELATIVE
  return LINE_NUMBER_MODES.OFF
}
