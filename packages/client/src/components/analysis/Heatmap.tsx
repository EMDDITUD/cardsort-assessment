import type { SessionAnalysis } from '@sortiertool/shared/analysis'
import type { CardSource, Schema } from '../../lib/types'
import { useLang } from '../../lib/i18n'
import { formatPercent } from '../../lib/format'
import {
  cardLabel,
  categoryOf,
  orderBySchema,
  shareFill,
  shareInk,
  useChartSelection,
  useWidth,
} from '../../lib/chart'
import { ChartInfo, Legend } from './Legend'

/** Width reserved for the row labels: card id + short name. */
const LABEL_W = 132
/** Height of the column header (letter only). */
const HEAD_H = 30
/** Thickness of the category color stripes along the axes. */
const STRIPE = 5
/** Cell size bounds; the minimum still fits "100 %". */
const CELL_MIN = 34
const CELL_MAX = 46

/**
 * Card×card heatmap of co-occurrence shares, cell size fitted to the container width.
 *
 * Ordered by the categories of `schema` (category runs outlined on the diagonal); without a
 * schema in dendrogram leaf order, so clusters show up as dark blocks. Tapping a cell shows its
 * exact share in the info line.
 *
 * @param {object} props Component props.
 * @param {CardSource[]} props.cards Card set in matrix order.
 * @param {SessionAnalysis} props.analysis Analysis providing shares, counts and leaf order.
 * @param {Schema | null} props.schema Reference schema for order and colors, or `null`.
 * @returns {JSX.Element} The heatmap with info line, scale and legend.
 */
export function Heatmap({
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
  const order = schema ? orderBySchema(cards, schema) : analysis.leafOrder
  const cell = Math.max(CELL_MIN, Math.min(CELL_MAX, Math.floor((width - LABEL_W - 4) / n)))
  const size = n * cell
  const svgW = LABEL_W + size + 2
  const svgH = HEAD_H + size + 2

  // Runs of the same category in display order → outlined blocks on the diagonal.
  const blocks: { start: number; end: number; color: string }[] = []
  if (schema) {
    order.forEach((cardIdx, pos) => {
      const cat = categoryOf(cards[cardIdx], schema)
      const last = blocks[blocks.length - 1]
      if (cat && last && last.color === cat.color && last.end === pos - 1) last.end = pos
      else if (cat) blocks.push({ start: pos, end: pos, color: cat.color })
    })
  }

  const selected = sel.shown ? sel.shown.split('-').map(Number) : null
  let info = null
  if (selected) {
    const [i, j] = selected
    info = t.ana.charts.heatmapCell(
      cardLabel(cards[i], lang),
      cardLabel(cards[j], lang),
      formatPercent(analysis.shares[i][j], lang),
      analysis.cooccurrence[i][j],
      analysis.submissionCount,
    )
  }

  return (
    <div className="chart" ref={ref}>
      <p className="muted">
        {schema ? t.ana.charts.heatmapHelp : t.ana.charts.heatmapHelpNoSchema}
      </p>
      <div className="chart__scroll">
        {width > 0 && (
          <svg width={svgW} height={svgH} role="img" aria-label={t.ana.charts.heatmapAria}>
            {order.map((cardIdx, pos) => {
              const cat = schema ? categoryOf(cards[cardIdx], schema) : undefined
              const x = LABEL_W + pos * cell
              return (
                <g key={`c${cardIdx}`}>
                  <text
                    x={x + cell / 2}
                    y={HEAD_H - STRIPE - 8}
                    textAnchor="middle"
                    className="chart__label chart__label--strong"
                  >
                    {cards[cardIdx].id}
                  </text>
                  {cat && (
                    <rect x={x + 1} y={HEAD_H - STRIPE - 2} width={cell - 2} height={STRIPE} fill={cat.color} />
                  )}
                </g>
              )
            })}
            {order.map((rowIdx, row) => {
              const cat = schema ? categoryOf(cards[rowIdx], schema) : undefined
              const y = HEAD_H + row * cell
              return (
                <g key={`r${rowIdx}`}>
                  {cat && (
                    <rect x={LABEL_W - STRIPE - 2} y={y + 1} width={STRIPE} height={cell - 2} fill={cat.color} />
                  )}
                  <text
                    x={LABEL_W - STRIPE - 8}
                    y={y + cell / 2}
                    textAnchor="end"
                    dominantBaseline="central"
                    className="chart__label"
                  >
                    {cardLabel(cards[rowIdx], lang)}
                  </text>
                  {order.map((colIdx, col) => {
                    const x = LABEL_W + col * cell
                    if (rowIdx === colIdx) {
                      return (
                        <rect key={colIdx} x={x} y={y} width={cell} height={cell} className="heatmap__diag" />
                      )
                    }
                    const share = analysis.shares[rowIdx][colIdx]
                    const key = `${rowIdx}-${colIdx}`
                    return (
                      <g key={colIdx} {...sel.bind(key)} className="heatmap__cell">
                        <rect
                          x={x}
                          y={y}
                          width={cell}
                          height={cell}
                          fill={shareFill(share)}
                          stroke="#ffffff"
                        />
                        <text
                          x={x + cell / 2}
                          y={y + cell / 2}
                          textAnchor="middle"
                          dominantBaseline="central"
                          className="heatmap__value"
                          fill={shareInk(share)}
                        >
                          {/* Whole percent; the info line shows the exact value */}
                          {formatPercent(Math.round(share * 100) / 100, lang)}
                        </text>
                      </g>
                    )
                  })}
                </g>
              )
            })}
            {/* Selection drawn after all cells so neighboring cells don't cover its outline */}
            {selected && (
              <rect
                x={LABEL_W + order.indexOf(selected[1]) * cell}
                y={HEAD_H + order.indexOf(selected[0]) * cell}
                width={cell}
                height={cell}
                className="heatmap__selected"
              />
            )}
            {blocks.map((b) => (
              <rect
                key={`b${b.start}`}
                x={LABEL_W + b.start * cell}
                y={HEAD_H + b.start * cell}
                width={(b.end - b.start + 1) * cell}
                height={(b.end - b.start + 1) * cell}
                fill="none"
                stroke={b.color}
                strokeWidth={3}
                pointerEvents="none"
              />
            ))}
          </svg>
        )}
      </div>
      <ChartInfo>{info}</ChartInfo>
      <div className="heatmap__scale">
        <span>{formatPercent(0, lang)}</span>
        <span className="heatmap__ramp" aria-hidden="true" />
        <span>{formatPercent(1, lang)}</span>
        <span className="muted">{t.ana.charts.scale}</span>
      </div>
      {schema && (
        <Legend
          items={schema.categories.map((c) => ({ key: c.key, label: c.label[lang], color: c.color }))}
        />
      )}
    </div>
  )
}
