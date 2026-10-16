import type { SessionAnalysis } from '@sortiertool/shared/analysis'
import type { CardSource, Schema } from '../../lib/types'
import { useLang } from '../../lib/i18n'
import { formatPercent } from '../../lib/format'
import { cardLabel, categoryOf, useChartSelection, useWidth } from '../../lib/chart'
import { UNGROUPED_COLOR } from '../../lib/config'
import { ChartInfo, Legend } from './Legend'

/** Layout in pixels: row height, label column, axis height, right padding. */
const ROW_H = 30
const LABEL_W = 150
const AXIS_H = 40
const PAD_R = 24
/** Grid lines as linkage distances. */
const TICKS = [0, 0.25, 0.5, 0.75, 1]
/** Threshold line: merges left of it were grouped together in ≥ 50 % of submissions. */
const HALF = 0.5

/**
 * Horizontal HAC dendrogram of the cards; leaves colored by the categories of `schema`.
 *
 * The x axis shows 1 − linkage distance ("sorted together on average"): 100 % on the left, 0 %
 * on the right. Tapping a merge node lists its cards in the info line.
 *
 * @param {object} props Component props.
 * @param {CardSource[]} props.cards Card set in matrix order.
 * @param {SessionAnalysis} props.analysis Analysis providing merges and leaf order.
 * @param {Schema | null} props.schema Reference schema for leaf colors, or `null` (grey).
 * @returns {JSX.Element} The dendrogram with info line and legend.
 */
export function Dendrogram({
  cards,
  analysis,
  schema,
}: {
  cards: CardSource[]
  analysis: SessionAnalysis
  schema: Schema | null
}) {
  const { lang, t } = useLang()
  const [ref, width] = useWidth<HTMLDivElement>()
  const sel = useChartSelection()
  const n = cards.length
  const plotW = Math.max(160, width - LABEL_W - PAD_R)
  /**
   * Maps a linkage distance to the x coordinate, clamped to `[0, 1]`.
   *
   * @param {number} distance Linkage distance.
   * @returns {number} x in pixels.
   */
  const x = (distance: number) => LABEL_W + Math.min(1, Math.max(0, distance)) * plotW
  const height = n * ROW_H + AXIS_H

  // Node positions: leaves in dendrogram order, merges centered between their children.
  const pos = new Map<number, { x: number; y: number }>()
  analysis.leafOrder.forEach((leaf, row) => pos.set(leaf, { x: LABEL_W, y: row * ROW_H + ROW_H / 2 }))
  const members = new Map<number, number[]>(cards.map((_, i) => [i, [i]]))
  analysis.merges.forEach((m, k) => {
    const a = pos.get(m.a)!
    const b = pos.get(m.b)!
    pos.set(n + k, { x: x(m.distance), y: (a.y + b.y) / 2 })
    members.set(n + k, [...members.get(m.a)!, ...members.get(m.b)!])
  })

  let info = null
  if (sel.shown) {
    const k = Number(sel.shown)
    const m = analysis.merges[k]
    info = t.ana.charts.dendroMerge(
      formatPercent(1 - m.distance, lang),
      members
        .get(n + k)!
        .slice()
        .sort((a, b) => a - b)
        .map((i) => cards[i].id)
        .join(', '),
    )
  }

  return (
    <div className="chart" ref={ref}>
      <p className="muted">{t.ana.charts.dendroHelp}</p>
      {width > 0 && (
        <svg width={LABEL_W + plotW + PAD_R} height={height} role="img" aria-label={t.ana.charts.dendroAria}>
          {TICKS.map((d) => (
            <g key={d}>
              <line x1={x(d)} x2={x(d)} y1={0} y2={n * ROW_H} className="chart__grid" />
              <text x={x(d)} y={n * ROW_H + 16} textAnchor="middle" className="chart__label">
                {formatPercent(1 - d, lang)}
              </text>
            </g>
          ))}
          <text x={LABEL_W + plotW / 2} y={n * ROW_H + 34} textAnchor="middle" className="chart__label chart__label--muted">
            {t.ana.charts.dendroAxis}
          </text>
          <line
            x1={x(HALF)}
            x2={x(HALF)}
            y1={0}
            y2={n * ROW_H}
            className="chart__threshold"
          />
          {/* Branches: elbow from each child to the merge node */}
          {analysis.merges.map((m, k) => {
            const node = pos.get(n + k)!
            const a = pos.get(m.a)!
            const b = pos.get(m.b)!
            const active = sel.shown === String(k)
            return (
              <g key={k}>
                <path
                  d={`M${a.x},${a.y} H${node.x} V${b.y} H${b.x}`}
                  className={`dendro__branch${active ? ' is-active' : ''}`}
                />
                <circle cx={node.x} cy={node.y} r={active ? 5 : 3.5} className="dendro__node" />
                <circle cx={node.x} cy={node.y} r={14} className="chart__hit" {...sel.bind(String(k))} />
              </g>
            )
          })}
          {analysis.leafOrder.map((leaf, row) => {
            const cat = schema ? categoryOf(cards[leaf], schema) : undefined
            const y = row * ROW_H + ROW_H / 2
            return (
              <g key={leaf}>
                <circle cx={LABEL_W - 10} cy={y} r={6} fill={cat?.color ?? UNGROUPED_COLOR} />
                <text x={LABEL_W - 22} y={y} textAnchor="end" dominantBaseline="central" className="chart__label">
                  {cardLabel(cards[leaf], lang)}
                </text>
              </g>
            )
          })}
        </svg>
      )}
      <ChartInfo>{info}</ChartInfo>
      {schema && (
        <Legend
          items={schema.categories.map((c) => ({ key: c.key, label: c.label[lang], color: c.color }))}
        />
      )}
    </div>
  )
}
