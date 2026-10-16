import { randomBytes, randomUUID, timingSafeEqual } from 'node:crypto'

/**
 * Crypto helpers: typeable session/admin keys, the secret master token and constant-time
 * comparison.
 */

/** Key alphabet without the easily confused characters O/0/I/1. */
const KEY_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/**
 * Random key from {@link KEY_ALPHABET}.
 *
 * @param {number} length Number of characters.
 * @returns {string} Random key.
 */
function randomKey(length: number): string {
  const bytes = randomBytes(length)
  let key = ''
  for (let i = 0; i < length; i++) {
    key += KEY_ALPHABET[bytes[i] % KEY_ALPHABET.length]
  }
  return key
}

/**
 * Session key learners type to join.
 *
 * @param {number} [length=6] Number of characters.
 * @returns {string} Random session key.
 */
export function generateSessionKey(length = 6): string {
  return randomKey(length)
}

/**
 * Admin key for the teacher's session management.
 *
 * @param {number} [length=8] Number of characters.
 * @returns {string} Random admin key.
 */
export function generateAdminKey(length = 8): string {
  return randomKey(length)
}

/**
 * Normalizes a self-chosen admin key (trimmed, upper case).
 *
 * @param {string} raw Key as entered.
 * @returns {string} Normalized key.
 */
export function normalizeAdminKey(raw: string): string {
  return raw.trim().toUpperCase()
}

/**
 * Validates a self-chosen admin key: 8–24 characters A–Z/0–9.
 *
 * For new keys only; not applied on login.
 *
 * @param {string} key Normalized key.
 * @returns {boolean} Whether the key is acceptable.
 */
export function isValidAdminKey(key: string): boolean {
  return /^[A-Z0-9]{8,24}$/.test(key)
}

/**
 * Secret master token for the research access.
 *
 * @returns {string} 48 hex characters.
 */
export function generateMasterToken(): string {
  return randomBytes(24).toString('hex')
}

/**
 * Constant-time string comparison for secrets.
 *
 * @param {string} a First string.
 * @param {string} b Second string.
 * @returns {boolean} Whether both are equal.
 */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

export { randomUUID }
