import { useState } from 'react'
import type { CSSProperties } from 'react'
import cardsData from '@sortiertool/shared/cards.json'
import type { CardSource, CardPlacement, Group, SortState } from './lib/types'
import { closeSession, createSession, submitSorting } from './lib/api'
import { toRelativeState } from './lib/relative'
import { WORLD } from './lib/config'

/**
 * DEV-only test data generator; `App.tsx` mounts it only when `import.meta.env.DEV` is set.
 */

/** Card set the simulated submissions are built from. */
const cards = cardsData as CardSource[]
/** Group colors of the simulated submissions. */
const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']

/**
 * Random integer in `[0, n)`.
 *
 * @param {number} n Exclusive upper bound.
 * @returns {number} Random integer.
 */
function randInt(n: number): number {
  return Math.floor(Math.random() * n)
}
/**
 * Random element of a list.
 *
 * @template T
 * @param {T[]} xs Non-empty list to pick from.
 * @returns {T} Randomly chosen element.
 */
function pick<T>(xs: T[]): T {
  return xs[randInt(xs.length)]
}

/**
 * Group-name candidates per reference category, with spelling variants so the normalized name
 * counting has something to merge.
 */
const NAMES: Record<string, string[]> = {
  klassifikation: ['Sortieren', 'sortieren', 'Einordnen', 'Erkennen'],
  regression: ['Vorhersagen', 'Vorhersage', 'Berechnen', 'Prognose'],
  clustering: ['Ähnlichkeiten finden', 'Gruppieren', 'Muster'],
  verstaerkend: ['Lernen durch Ausprobieren', 'Optimieren', 'Selbst lernen'],
  industrie: ['Industrie', 'Wirtschaft', 'Firma'],
  natur: ['Natur', 'Umwelt', 'Tiere'],
  gesundheit: ['Medizin', 'Gesundheit', 'medizin '],
  verkehr: ['Verkehr', 'Autos'],
  text: ['Text', 'Texte'],
  strukturiert: ['Zahlen', 'Daten'],
  audio: ['Audio', 'Geräusche', 'Töne'],
  grafik: ['Bilder', 'Kamera'],
}

/** Reference schema each simulated submission follows; duplicates weight the draw. */
const STRATEGIES = ['lernverfahren', 'lernverfahren', 'domaene', 'domaene', 'darstellung']

/**
 * Simulates one submission: groups the cards by a random reference schema, then moves a random
 * share of cards into other groups (or leaves them grey) so no submission matches perfectly.
 *
 * @returns {SortState} Sorting in relative coordinates, ready to submit.
 */
function simulateState(): SortState {
  const schema = pick(STRATEGIES)
  const categories = [...new Set(cards.map((c) => c.features?.[schema] ?? '?'))]
  const groups: Group[] = categories.map((cat, i) => ({
    id: `g${i + 1}`,
    name: pick(NAMES[cat] ?? [`Gruppe ${i + 1}`]),
    color: COLORS[i % COLORS.length],
    x: 60 + i * 300,
    y: 80,
    width: 260,
    height: 360,
  }))
  const noise = 0.1 + Math.random() * 0.25
  const placements: CardPlacement[] = cards.map((c) => {
    let groupIdx: number | null = categories.indexOf(c.features?.[schema] ?? '?')
    const r = Math.random()
    if (r < 0.03) groupIdx = null // rarely ungrouped (grey)
    else if (r < noise) groupIdx = randInt(groups.length)
    const g = groupIdx === null ? null : groups[groupIdx]
    return {
      cardId: c.id,
      onCanvas: true,
      x: g ? g.x + 20 + randInt(g.width - 80) : 700 + randInt(120),
      y: g ? g.y + 20 + randInt(g.height - 80) : 520 + randInt(220),
      groupId: g ? g.id : null,
    }
  })
  return toRelativeState({ placements, groups }, WORLD)
}

/** Fixed bottom-left placement so the button never covers the views. */
const STYLE: CSSProperties = {
  position: 'fixed',
  left: 12,
  bottom: 12,
  zIndex: 9999,
  padding: '8px 12px',
  font: '600 13px system-ui, sans-serif',
  background: '#1e293b',
  color: '#fff',
  border: '1px solid #0f172a',
  borderRadius: 8,
  cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(0,0,0,.25)',
  opacity: 0.92,
}

/**
 * Button that creates a test session with 15–25 simulated submissions, closes it and opens its
 * admin dashboard in a new tab.
 *
 * @returns {JSX.Element} Floating seed button.
 */
export function DevSeedButton() {
  const [busy, setBusy] = useState(false)

  /**
   * Creates the session, submits the simulated sortings, closes the session and navigates the
   * new tab to its admin view.
   *
   * @returns {Promise<void>}
   */
  async function seed() {
    // Open the tab synchronously within the click gesture, otherwise the popup blocker kicks in.
    const tab = window.open('', '_blank')
    setBusy(true)
    try {
      const studentCount = 15 + randInt(11)
      const session = await createSession({
        klassenstufe: '9',
        schulform: 'Gymnasium',
        mlVorwissen: '2',
        note: 'TESTDATEN (dev)',
      })
      // Without a receipt, the server creates a new submission per call.
      await Promise.all(
        Array.from({ length: studentCount }, () =>
          submitSorting(session.sessionKey, simulateState()),
        ),
      )
      // The dashboard only evaluates closed sessions.
      await closeSession(session.adminKey)
      const adminUrl = `${window.location.origin}/?admin=${encodeURIComponent(
        session.adminKey,
      )}`
      if (tab) tab.location.href = adminUrl
      else window.location.href = adminUrl
    } catch (e) {
      tab?.close()
      console.error(e)
      alert('Testdaten anlegen fehlgeschlagen. Läuft der Server (Port 3001)?')
    } finally {
      setBusy(false)
    }
  }

  return (
    <button type="button" style={STYLE} disabled={busy} onClick={() => void seed()}>
      {busy ? 'Erzeuge Testdaten…' : '🧪 Testdaten + Admin'}
    </button>
  )
}
