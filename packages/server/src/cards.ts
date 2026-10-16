import { createHash } from 'node:crypto'
import type { CardSource, NameMarkers, Schema } from '@sortiertool/shared/types'
import cardsData from '@sortiertool/shared/cards.json' with { type: 'json' }
import schemasData from '@sortiertool/shared/schemas.json' with { type: 'json' }
import markersData from '@sortiertool/shared/name-markers.json' with { type: 'json' }

/**
 * Server-side access to the shared card set, reference schemas and name markers, plus the
 * card-set version derived from their content.
 */

/** Canonical card set; its order is the row/column order of all matrices. */
export const cards = cardsData as CardSource[]

/**
 * Card-set version derived from what learners see, e.g. `A-M-3f9c2a1b`.
 *
 * First and last id plus a hash over order, image and text; `short` and `features` are
 * excluded so analysis-only edits keep the version.
 */
export const CARD_SET_VERSION = `${cards[0]?.id}-${cards[cards.length - 1]?.id}-${createHash('sha256')
  .update(JSON.stringify(cards.map(({ id, image, text }) => ({ id, image, text }))))
  .digest('hex')
  .slice(0, 8)}`

/**
 * Whether a session was recorded with a card set other than {@link CARD_SET_VERSION}.
 *
 * @param {string} version Card-set version stored with the session.
 * @returns {boolean} `true` if it differs from {@link CARD_SET_VERSION}.
 */
export function isCardSetOutdated(version: string): boolean {
  return version !== CARD_SET_VERSION
}

/** Reference schemas of the analysis. */
export const schemas = schemasData as Schema[]
/** Marker word list for pre-coding group names. */
export const nameMarkers = markersData as NameMarkers
