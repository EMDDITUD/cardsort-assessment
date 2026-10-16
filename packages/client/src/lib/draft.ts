import type { CardPlacement, Group } from './types'

/**
 * Intermediate save of the sorting state per session (localStorage), restored after reload.
 * Expires after {@link DRAFT_MAX_AGE_MS}; coordinates are world pixels (not relative like a
 * submission).
 */

/**
 * Storage key of a session's draft.
 *
 * @param {string} sessionKey Session key.
 * @returns {string} localStorage key.
 */
const key = (sessionKey: string) => `ml-sortiertool:state:${sessionKey}`

/** Format version; bump on every change to {@link SortDraft} so older drafts are discarded. */
const DRAFT_VERSION = 1

/** Age after which a draft is discarded (12 h). */
const DRAFT_MAX_AGE_MS = 12 * 60 * 60 * 1000

/**
 * Sorting state as saved and restored.
 *
 * @property {CardPlacement[]} placements Placement of every card, world pixels.
 * @property {Group[]} groups Group frames, world pixels.
 * @property {string[]} pinnedIds Cards pinned open.
 * @property {string[]} frontOrder Card ids from back to front (last touched last).
 */
export interface SortDraft {
  placements: CardPlacement[]
  groups: Group[]
  pinnedIds: string[]
  frontOrder: string[]
}

/**
 * Draft as returned by {@link loadDraft}.
 *
 * @property {string} savedAt ISO timestamp of the save, shown in the resume prompt.
 */
export interface RestoredDraft extends SortDraft {
  savedAt: string
}

/**
 * Draft as stored in localStorage.
 *
 * @property {number} version {@link DRAFT_VERSION} at save time.
 * @property {string} savedAt ISO timestamp of the save.
 * @property {string[]} cardIds Card set at save time.
 */
interface StoredDraft extends SortDraft {
  version: number
  savedAt: string
  cardIds: string[]
}

/**
 * Saves the current sorting state of a session.
 *
 * @param {string} sessionKey Session key.
 * @param {SortDraft} draft State to save.
 * @param {string[]} cardIds Ids of the current card set, checked on load.
 * @returns {void}
 */
export function saveDraft(
  sessionKey: string,
  draft: SortDraft,
  cardIds: string[],
): void {
  try {
    const stored: StoredDraft = {
      version: DRAFT_VERSION,
      savedAt: new Date().toISOString(),
      cardIds,
      ...draft,
    }
    localStorage.setItem(key(sessionKey), JSON.stringify(stored))
  } catch {
    // Private mode or quota full: sorting continues without intermediate save.
  }
}

/**
 * Loads and validates a session's draft; an expired draft of the current format and card set is
 * deleted.
 *
 * Changed texts/images under the same card id are harmless, as placements only reference ids.
 *
 * @param {string} sessionKey Session key.
 * @param {string[]} cardIds Ids of the current card set.
 * @returns {RestoredDraft | null} The draft, or `null` if missing, expired, of another format or
 *   card set, or inconsistent.
 */
export function loadDraft(sessionKey: string, cardIds: string[]): RestoredDraft | null {
  try {
    const raw = localStorage.getItem(key(sessionKey))
    if (!raw) return null
    const d = JSON.parse(raw) as Partial<StoredDraft>
    if (d.version !== DRAFT_VERSION) return null
    if (!Array.isArray(d.placements) || !Array.isArray(d.groups)) return null
    if (!sameCardSet(d.cardIds, cardIds)) return null
    if (isExpired(d.savedAt)) {
      clearDraft(sessionKey)
      return null
    }

    // As many distinct card ids as the card set has; every group assignment points to an
    // existing group.
    const groupIds = new Set(d.groups.map((g) => g.id))
    const seen = new Set(d.placements.map((p) => p.cardId))
    if (seen.size !== cardIds.length) return null
    if (d.placements.some((p) => p.groupId !== null && !groupIds.has(p.groupId))) return null

    return {
      savedAt: d.savedAt as string,
      placements: d.placements,
      groups: d.groups,
      pinnedIds: Array.isArray(d.pinnedIds) ? d.pinnedIds : [],
      frontOrder: Array.isArray(d.frontOrder) ? d.frontOrder : [],
    }
  } catch {
    return null
  }
}

/**
 * Whether a draft is older than {@link DRAFT_MAX_AGE_MS}.
 *
 * @param {string | undefined} savedAt Stored ISO timestamp.
 * @returns {boolean} `true` if expired; a missing/unreadable timestamp counts as expired, one in
 *   the future (wrong device clock) as fresh.
 */
function isExpired(savedAt: string | undefined): boolean {
  if (typeof savedAt !== 'string') return true
  const t = Date.parse(savedAt)
  if (Number.isNaN(t)) return true
  return Date.now() - t > DRAFT_MAX_AGE_MS
}

/**
 * Deletes a session's draft.
 *
 * @param {string} sessionKey Session key.
 * @returns {void}
 */
export function clearDraft(sessionKey: string): void {
  try {
    localStorage.removeItem(key(sessionKey))
  } catch {
    // See above.
  }
}

/**
 * Whether the stored card ids equal the current card set (order ignored).
 *
 * @param {string[] | undefined} stored Card ids saved with the draft.
 * @param {string[]} current Ids of the current card set.
 * @returns {boolean} `true` if equally long and every stored id is in the current set
 *   (duplicates are not detected).
 */
function sameCardSet(stored: string[] | undefined, current: string[]): boolean {
  if (!Array.isArray(stored) || stored.length !== current.length) return false
  const set = new Set(current)
  return stored.every((id) => set.has(id))
}
