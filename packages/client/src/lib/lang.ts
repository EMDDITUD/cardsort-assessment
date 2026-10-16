import type { Lang } from './types'

/** localStorage key of the chosen language. */
const KEY = 'ml-sortiertool:lang'

/** Language used without URL parameter or stored choice. */
export const DEFAULT_LANG: Lang = 'de'

/**
 * Type guard for supported languages.
 *
 * @param {unknown} value Candidate value.
 * @returns {boolean} `true` for `'de'` or `'en'`.
 */
function isLang(value: unknown): value is Lang {
  return value === 'de' || value === 'en'
}

/**
 * Determines the active language: `?lang=` beats the stored choice beats {@link DEFAULT_LANG}.
 * A valid URL parameter is stored as well.
 *
 * @returns {Lang} Active language.
 */
export function readLang(): Lang {
  const fromUrl = new URLSearchParams(window.location.search).get('lang')?.toLowerCase()
  if (isLang(fromUrl)) {
    writeLang(fromUrl)
    return fromUrl
  }
  try {
    const stored = localStorage.getItem(KEY)
    if (isLang(stored)) return stored
  } catch {
    // Private mode: the language only applies to this page.
  }
  return DEFAULT_LANG
}

/**
 * Remembers the chosen language in localStorage.
 *
 * @param {Lang} lang Language to store.
 * @returns {void}
 */
export function writeLang(lang: Lang): void {
  try {
    localStorage.setItem(KEY, lang)
  } catch {
    // See above.
  }
}
