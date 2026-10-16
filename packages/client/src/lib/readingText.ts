import type { SessionAnalysis } from '@sortiertool/shared/analysis'
import type { Schema } from './types'

/**
 * Rules of the automatic reading text in the dashboard overview. Yields facts with schema and
 * category keys only; the wording happens in the dictionary (`t.ana.reading`).
 */

/** Threshold below which ALL class means count as following no schema clearly (chance = 0.5). */
export const NEAR_CHANCE = 0.55
/** Minimum gap of the class means from which a direction ("rather by …") is named. */
export const CLEAR_MARGIN = 0.03
/** Hit rate of a category from which it counts as "often recognized" … */
export const RECOGNIZED = 0.5
/** … and below which it counts as "hardly recognized". */
export const HARDLY = 0.3

/**
 * One statement of the reading text.
 *
 * - `nearChance`: no schema is followed clearly.
 * - `leaning`: class means favour schema `toward` over `over` (schema keys).
 * - `balanced`: deep structure and the strongest surface schema are on par.
 * - `recognized` / `hardly`: categories (keys) of `schema` with high / low hit rate.
 * - `split`: `count` of `total` submissions follow the deep-structure schema `deepSchema` best.
 */
export type ReadingFact =
  | { kind: 'nearChance' }
  | { kind: 'leaning'; toward: string; over: string }
  | { kind: 'balanced'; a: string; b: string }
  | { kind: 'recognized'; schema: string; categories: string[] }
  | { kind: 'hardly'; schema: string; categories: string[] }
  | { kind: 'split'; deepSchema: string; count: number; total: number }

/**
 * Derives the reading-text facts of a session from its analysis.
 *
 * Compares the deep-structure schema with the strongest surface schema, then lists well and
 * poorly recognized deep-structure categories and how many submissions follow it best.
 *
 * @param {SessionAnalysis} analysis Analysis of the session.
 * @param {Schema[]} schemas Reference schemas.
 * @returns {ReadingFact[]} Facts in reading order; empty without deep-structure schema or
 *   submissions.
 */
export function readingFacts(analysis: SessionAnalysis, schemas: Schema[]): ReadingFact[] {
  const usable = schemas.filter((s) => s.key in analysis.means)
  const deep = usable.find((s) => s.role === 'tiefenstruktur')
  const surface = usable
    .filter((s) => s.role === 'oberflaeche')
    .sort((a, b) => analysis.means[b.key].score - analysis.means[a.key].score)
  if (!deep || analysis.submissionCount === 0) return []

  const facts: ReadingFact[] = []
  const deepScore = analysis.means[deep.key].score
  const top = surface[0]
  if (Math.max(...usable.map((s) => analysis.means[s.key].score)) < NEAR_CHANCE) {
    facts.push({ kind: 'nearChance' })
  } else if (top) {
    const diff = deepScore - analysis.means[top.key].score
    if (diff >= CLEAR_MARGIN) facts.push({ kind: 'leaning', toward: deep.key, over: top.key })
    else if (diff <= -CLEAR_MARGIN) facts.push({ kind: 'leaning', toward: top.key, over: deep.key })
    else facts.push({ kind: 'balanced', a: deep.key, b: top.key })
  }

  const rates = deep.categories
    .map((c, k) => ({ key: c.key, rate: analysis.means[deep.key].categoryHitRates[k] }))
    .filter((x): x is { key: string; rate: number } => x.rate !== null)
  const recognized = rates.filter((x) => x.rate >= RECOGNIZED).sort((a, b) => b.rate - a.rate)
  const hardly = rates.filter((x) => x.rate < HARDLY).sort((a, b) => a.rate - b.rate)
  if (recognized.length > 0) {
    facts.push({ kind: 'recognized', schema: deep.key, categories: recognized.map((x) => x.key) })
  }
  if (hardly.length > 0) {
    facts.push({ kind: 'hardly', schema: deep.key, categories: hardly.map((x) => x.key) })
  }

  // Must count like `deepStructureBestShare` (shared/analysis.ts), else text and figure disagree.
  const total = analysis.submissions.filter((s) => s.deepStructureLead !== null).length
  if (total > 0 && analysis.deepStructureBestShare !== null) {
    facts.push({
      kind: 'split',
      deepSchema: deep.key,
      count: Math.round(analysis.deepStructureBestShare * total),
      total,
    })
  }
  return facts
}
