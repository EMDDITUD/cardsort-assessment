/**
 * Receipt of the own submission per session (sessionStorage), so resubmitting updates it instead
 * of creating a new one.
 */

/**
 * Storage key of a session's receipt.
 *
 * @param {string} sessionKey Session key.
 * @returns {string} sessionStorage key.
 */
const key = (sessionKey: string) => `ml-sortiertool:receipt:${sessionKey}`

/** Device-wide token of schema v1; only cleaned up. */
const LEGACY_TOKEN_KEY = 'ml-sortiertool:participant'
try {
  localStorage.removeItem(LEGACY_TOKEN_KEY)
} catch {
  // Private mode — nothing to clean up.
}

/**
 * Reads the receipt of the own submission in a session.
 *
 * @param {string} sessionKey Session key.
 * @returns {string | undefined} Receipt, or `undefined` before the first submission or without
 *   storage.
 */
export function getReceipt(sessionKey: string): string | undefined {
  try {
    return sessionStorage.getItem(key(sessionKey)) ?? undefined
  } catch {
    return undefined
  }
}

/**
 * Stores the receipt the server returned for the own submission.
 *
 * @param {string} sessionKey Session key.
 * @param {string} receipt Receipt from the submit response.
 * @returns {void}
 */
export function setReceipt(sessionKey: string, receipt: string): void {
  try {
    sessionStorage.setItem(key(sessionKey), receipt)
  } catch {
    // Without storage, every submit creates a new submission.
  }
}

/**
 * Forgets the receipt, so the next submit creates a new submission (e.g. next person).
 *
 * @param {string} sessionKey Session key.
 * @returns {void}
 */
export function clearReceipt(sessionKey: string): void {
  try {
    sessionStorage.removeItem(key(sessionKey))
  } catch {
    // See above.
  }
}
