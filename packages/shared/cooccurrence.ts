import type { CardPlacement } from './types'

/**
 * Co-occurrence of cards across sortings: card×card matrix of a single submission and the
 * aggregate over all submissions of a session.
 */

/**
 * Minimal card reference; only the id is needed to order rows and columns.
 *
 * @property {string} id Card id, used as row/column label.
 */
type CardRef = { id: string }

/** CSV field separator and line break of all matrix exports. */
const SEPARATOR = ','
const NEWLINE = '\r\n'

/**
 * Whether two cards lie in the same group. Ungrouped (`null`, grey) never counts as shared.
 *
 * @param {string | null} a Group id of the first card.
 * @param {string | null} b Group id of the second card.
 * @returns {boolean} `true` if both have the same non-null group id.
 */
function sameGroup(a: string | null, b: string | null): boolean {
  return a !== null && a === b
}

/**
 * Serializes a square matrix as CSV with the labels as header row and first column.
 *
 * @param {string[]} labels Row/column labels in matrix order.
 * @param {string[][]} rows Cell values, one array per row.
 * @returns {string} CSV text.
 */
function rowsToCsv(labels: string[], rows: string[][]): string {
  const lines = [['', ...labels].join(SEPARATOR)]
  rows.forEach((cells, i) => lines.push([labels[i], ...cells].join(SEPARATOR)))
  return lines.join(NEWLINE)
}

/**
 * Card×card matrix of ONE sorting as CSV.
 *
 * @param {CardRef[]} cards Cards in matrix order.
 * @param {CardPlacement[]} placements Placements of the submission.
 * @returns {string} CSV with `1` = same group, `0` = not, `-` = diagonal.
 */
export function buildCoOccurrenceCsv(
  cards: CardRef[],
  placements: CardPlacement[],
): string {
  const groupByCard = new Map(placements.map((p) => [p.cardId, p.groupId]))
  const labels = cards.map((c) => c.id)
  const rows = cards.map((rowCard, i) => {
    const rowGroup = groupByCard.get(rowCard.id) ?? null
    return cards.map((colCard, j) => {
      if (i === j) return '-'
      const colGroup = groupByCard.get(colCard.id) ?? null
      return sameGroup(rowGroup, colGroup) ? '1' : '0'
    })
  })
  return rowsToCsv(labels, rows)
}

/**
 * Aggregates several submissions into one co-occurrence matrix.
 *
 * @param {CardRef[]} cards Cards in matrix order.
 * @param {{ placements: CardPlacement[] }[]} submissions Submissions to aggregate.
 * @returns {number[][]} Symmetric matrix; cell = number of submissions in which both cards lie
 *   in the same group, diagonal `0`.
 */
export function buildAggregateMatrix(
  cards: CardRef[],
  submissions: { placements: CardPlacement[] }[],
): number[][] {
  const n = cards.length
  const matrix = Array.from({ length: n }, () => new Array<number>(n).fill(0))
  for (const sub of submissions) {
    const groupByCard = new Map(sub.placements.map((p) => [p.cardId, p.groupId]))
    for (let i = 0; i < n; i++) {
      const gi = groupByCard.get(cards[i].id) ?? null
      for (let j = 0; j < n; j++) {
        if (i !== j && sameGroup(gi, groupByCard.get(cards[j].id) ?? null)) {
          matrix[i][j]++
        }
      }
    }
  }
  return matrix
}

/**
 * {@link buildAggregateMatrix} as CSV.
 *
 * @param {CardRef[]} cards Cards in matrix order.
 * @param {{ placements: CardPlacement[] }[]} submissions Submissions to aggregate.
 * @returns {string} CSV with counts per card pair and `-` on the diagonal.
 */
export function buildAggregateCsv(
  cards: CardRef[],
  submissions: { placements: CardPlacement[] }[],
): string {
  const matrix = buildAggregateMatrix(cards, submissions)
  const labels = cards.map((c) => c.id)
  const rows = matrix.map((row, i) =>
    row.map((value, j) => (i === j ? '-' : String(value))),
  )
  return rowsToCsv(labels, rows)
}
