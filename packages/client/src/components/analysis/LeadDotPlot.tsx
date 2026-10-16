import type { SubmissionAnalysis } from '@sortiertool/shared/analysis'
import type { Schema } from '../../lib/types'
import { useLang } from '../../lib/i18n'
import { formatNumber, formatPercent, formatPoints } from '../../lib/format'
import { useChartSelection, useWidth } from '../../lib/chart'
import { ChartInfo } from './Legend'

/** Dot radius. */
const R = 7
/** Horizontal padding and axis height in pixels. */
const PAD_X = 20
const AXIS_H = 44
/** Axis grid step as a share (10 percentage points). */
const STEP = 0.1

/**
 * Dot plot of the deep-structure lead per submission (`deepStructureLead`: deep-structure score
 * minus the strongest surface score); stacked so dots never overlap. Mouse hover shows the
 * comparison; click/tap opens the submission.
 *
 * @param {object} props Component props.
 * @param {SubmissionAnalysis[]} props.submissions Analyzed submissions.
 * @param {Schema[]} props.schemas Usable schemas, including the deep-structure one.
 * @param {(participantNo: number) => void} props.onOpen Opens a single submission.
 * @returns {JSX.Element} The dot plot with info line.
 */
export function LeadDotPlot({
  submissions,
  schemas,
  onOpen,
}: {
  submissions: SubmissionAnalysis[]
  schemas: Schema[]
  onOpen: (participantNo: number) => void
}) {
  const { lang, t } = useLang()
  const deep = schemas.find((s) => s.role === 'tiefenstruktur')
  const surface = schemas.filter((s) => s.role === 'oberflaeche')
  const deepLabel = deep?.label[lang] ?? ''
  const [ref, width] = useWidth<HTMLDivElement>()
  const sel = useChartSelection()
  const dots = submissions
    .filter((s) => s.deepStructureLead !== null)
    .map((s) => ({ no: s.participantNo, lead: s.deepStructureLead as number }))
    .sort((a, b) => a.lead - b.lead)

  const extent = Math.max(0.2, Math.ceil(Math.max(...dots.map((d) => Math.abs(d.lead)), 0) / STEP) * STEP)
  const plotW = Math.max(200, width - 2 * PAD_X)
  /**
   * Maps a lead in `[-extent, extent]` to the x coordinate.
   *
   * @param {number} lead Deep-structure lead.
   * @returns {number} x in pixels.
   */
  const x = (lead: number) => PAD_X + ((lead + extent) / (2 * extent)) * plotW

  // Stacking: each dot goes to the lowest level where it overlaps no neighbor.
  const placed: { no: number; lead: number; cx: number; level: number }[] = []
  for (const d of dots) {
    const cx = x(d.lead)
    let level = 0
    while (placed.some((p) => p.level === level && Math.abs(p.cx - cx) < 2 * R + 1)) level++
    placed.push({ ...d, cx, level })
  }
  const levels = Math.max(1, ...placed.map((p) => p.level + 1))
  const plotH = levels * (2 * R + 2) + 12
  const baseY = plotH - R - 4

  const ticks: number[] = []
  for (let v = -extent; v <= extent + 1e-9; v += STEP) ticks.push(Math.round(v * 10) / 10)

  const shown = placed.find((p) => String(p.no) === sel.shown)
  let info = null
  const sub = shown && submissions.find((s) => s.participantNo === shown.no)
  if (shown && sub && deep && surface.length > 0) {
    const top = surface.reduce((a, b) => (sub.schemas[b.key].score > sub.schemas[a.key].score ? b : a))
    const d = { label: deepLabel, pct: formatPercent(sub.schemas[deep.key].score, lang) }
    const o = { label: top.label[lang], pct: formatPercent(sub.schemas[top.key].score, lang) }
    const [closer, other] = shown.lead >= 0 ? [d, o] : [o, d]
    info =
      Math.abs(shown.lead) < 1e-9
        ? t.ana.subs.dotInfoTie(shown.no, d.label, o.label, d.pct)
        : t.ana.subs.dotInfo(
            shown.no,
            closer.label,
            closer.pct,
            other.label,
            other.pct,
            formatNumber(Math.abs(shown.lead) * 100, lang, 1),
          )
  }

  return (
    <div className="chart" ref={ref}>
      <p className="muted">{t.ana.subs.distHelp(deepLabel)}</p>
      {width > 0 && (
        <svg width={plotW + 2 * PAD_X} height={plotH + AXIS_H} role="img" aria-label={t.ana.subs.dotAria}>
          {ticks.map((v) => (
            <g key={v}>
              <line x1={x(v)} x2={x(v)} y1={0} y2={plotH} className={v === 0 ? 'chart__zero' : 'chart__grid'} />
              <text x={x(v)} y={plotH + 16} textAnchor="middle" className="chart__label">
                {formatPoints(v, lang)}
              </text>
            </g>
          ))}
          <text x={PAD_X + plotW / 2} y={plotH + 36} textAnchor="middle" className="chart__label chart__label--muted">
            {t.ana.subs.axis}
          </text>
          <text x={PAD_X} y={plotH + 36} className="chart__label chart__label--muted">
            ← {t.ana.subs.left}
          </text>
          <text x={PAD_X + plotW} y={plotH + 36} textAnchor="end" className="chart__label chart__label--muted">
            {t.ana.subs.right(deepLabel)} →
          </text>
          {placed.map((p) => {
            const active = sel.shown === String(p.no)
            return (
              <g key={p.no} {...sel.bind(String(p.no))} onClick={() => onOpen(p.no)} className="dots__dot">
                <circle cx={p.cx} cy={baseY - p.level * (2 * R + 2)} r={R} className={active ? 'is-active' : ''} />
              </g>
            )
          })}
        </svg>
      )}
      <ChartInfo>{info}</ChartInfo>
    </div>
  )
}
