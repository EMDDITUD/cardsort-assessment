import type { Lang } from './types'

/** Number/date locale per UI language. */
const LOCALE: Record<Lang, string> = { de: 'de-DE', en: 'en-GB' }

/**
 * Formats a share as percentage.
 *
 * @param {number} share Share in `[0, 1]`.
 * @param {Lang} lang UI language.
 * @returns {string} Percentage with at most one decimal, e.g. `42,5 %`.
 */
export function formatPercent(share: number, lang: Lang): string {
  return new Intl.NumberFormat(LOCALE[lang], {
    style: 'percent',
    maximumFractionDigits: 1,
  }).format(share)
}

/**
 * Formats a plain number.
 *
 * @param {number} value Number to format.
 * @param {Lang} lang UI language.
 * @param {number} [digits=1] Maximum fraction digits.
 * @returns {string} Localized number.
 */
export function formatNumber(value: number, lang: Lang, digits = 1): string {
  return new Intl.NumberFormat(LOCALE[lang], { maximumFractionDigits: digits }).format(value)
}

/**
 * Formats the difference of two shares as signed percentage points, without unit (the unit
 * comes from the dictionary).
 *
 * @param {number} diff Difference of two shares in `[-1, 1]`.
 * @param {Lang} lang UI language.
 * @returns {string} Signed number of points, e.g. `+3,2`; `0` without sign.
 */
export function formatPoints(diff: number, lang: Lang): string {
  return new Intl.NumberFormat(LOCALE[lang], {
    maximumFractionDigits: 1,
    signDisplay: 'exceptZero',
  }).format(diff * 100)
}

/**
 * Formats a timestamp as full local date and time.
 *
 * @param {string} iso ISO timestamp.
 * @param {Lang} lang UI language.
 * @returns {string} Localized date and time.
 */
export function formatDateTime(iso: string, lang: Lang): string {
  return new Date(iso).toLocaleString(LOCALE[lang])
}

/**
 * Formats a timestamp as short date and time (for tables).
 *
 * @param {string} iso ISO timestamp.
 * @param {Lang} lang UI language.
 * @returns {string} Short localized date and time.
 */
export function formatDateTimeShort(iso: string, lang: Lang): string {
  return new Intl.DateTimeFormat(LOCALE[lang], { dateStyle: 'short', timeStyle: 'short' }).format(
    new Date(iso),
  )
}

/**
 * Formats a timestamp as local date only.
 *
 * @param {string} iso ISO timestamp.
 * @param {Lang} lang UI language.
 * @returns {string} Localized date.
 */
export function formatDate(iso: string, lang: Lang): string {
  return new Date(iso).toLocaleDateString(LOCALE[lang])
}
