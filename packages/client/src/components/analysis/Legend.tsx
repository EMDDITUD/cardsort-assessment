import type { ReactNode } from 'react'
import { useLang } from '../../lib/i18n'

/**
 * Color legend of a chart.
 *
 * @param {object} props Component props.
 * @param {{ key: string; label: string; color: string }[]} props.items Entries with swatch color.
 * @returns {JSX.Element} The legend list.
 */
export function Legend({ items }: { items: { key: string; label: string; color: string }[] }) {
  return (
    <ul className="legend">
      {items.map((item) => (
        <li key={item.key}>
          <span className="swatch" style={{ background: item.color }} aria-hidden="true" />
          {item.label}
        </li>
      ))}
    </ul>
  )
}

/**
 * Info line below a chart, announced to screen readers; shows the usage hint while nothing is
 * selected.
 *
 * @param {object} props Component props.
 * @param {ReactNode} [props.children] Details of the current selection.
 * @returns {JSX.Element} The info line.
 */
export function ChartInfo({ children }: { children?: ReactNode }) {
  const { t } = useLang()
  return (
    <p className="chartinfo" aria-live="polite">
      {children ?? <span className="muted">{t.ana.charts.tapHint}</span>}
    </p>
  )
}
