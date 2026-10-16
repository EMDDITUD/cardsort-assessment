import { useLang } from '../../lib/i18n'
import { formatPercent } from '../../lib/format'

/**
 * One bar of a {@link BarList}.
 *
 * @property {string} key React key.
 * @property {string} label Row label.
 * @property {number | null} value Share in `[0, 1]`; `null` = not computable (text instead of
 *   bar).
 * @property {string} color Bar and swatch color.
 * @property {string} [note] Replaces the value when `value` is `null`.
 */
export interface BarItem {
  key: string
  label: string
  value: number | null
  color: string
  note?: string
}

/**
 * Horizontal percentage bars with label, track and formatted value per row.
 *
 * @param {object} props Component props.
 * @param {BarItem[]} props.items Bars in display order.
 * @param {boolean} [props.chance=false] Draws the 50 % line (chance level) across all bars.
 * @param {boolean} [props.swatches=true] Shows a color swatch before each label.
 * @returns {JSX.Element} The bar list.
 */
export function BarList({
  items,
  chance = false,
  swatches = true,
}: {
  items: BarItem[]
  chance?: boolean
  swatches?: boolean
}) {
  const { lang, t } = useLang()
  return (
    <div className={`barlist${chance ? ' barlist--chance' : ''}`}>
      {chance && (
        <div className="barlist__row barlist__row--axis" aria-hidden="true">
          <span />
          <span className="barlist__track barlist__track--axis">
            <span className="barlist__chance-label">
              {t.ana.chance} {formatPercent(0.5, lang)}
            </span>
          </span>
          <span />
        </div>
      )}
      {items.map((item) => (
        <div className="barlist__row" key={item.key}>
          <span className="barlist__label">
            {swatches && (
              <span className="swatch" style={{ background: item.color }} aria-hidden="true" />
            )}
            {item.label}
          </span>
          <span className="barlist__track">
            {item.value !== null && (
              <span
                className="barlist__fill"
                style={{ width: `${item.value * 100}%`, background: item.color }}
              />
            )}
          </span>
          <span className="barlist__value">
            {item.value === null ? (item.note ?? t.ana.none) : formatPercent(item.value, lang)}
          </span>
        </div>
      ))}
    </div>
  )
}
