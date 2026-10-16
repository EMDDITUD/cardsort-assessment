import type { SessionComparison as Row } from '@sortiertool/shared/analysis'
import type { Schema } from '../../lib/types'
import { useLang } from '../../lib/i18n'
import { formatPercent } from '../../lib/format'
import { NEUTRAL_BAR } from '../../lib/chart'
import { Legend } from './Legend'

/**
 * Research view: class means of several sessions side by side (one row per session, not pooled).
 *
 * @param {object} props Component props.
 * @param {Row[]} props.rows Comparison row per session.
 * @param {Schema[]} props.schemas Usable reference schemas.
 * @returns {JSX.Element} Score table and, with a deep-structure schema, the category table.
 */
export function SessionComparison({ rows, schemas }: { rows: Row[]; schemas: Schema[] }) {
  const { lang, t } = useLang()
  const deep = schemas.find((s) => s.role === 'tiefenstruktur')

  /**
   * Table cell content: mini bar with percentage.
   *
   * @param {number | null | undefined} value Share in `[0, 1]`; missing values render as text.
   * @param {string} color Bar color.
   * @param {boolean} [chance=false] Marks the 50 % chance level on the track.
   * @returns {ReactNode} Mini bar or placeholder text.
   */
  const bar = (value: number | null | undefined, color: string, chance = false) =>
    value === null || value === undefined ? (
      t.ana.none
    ) : (
      <span className="minibar">
        <span className={`minibar__track${chance ? ' minibar__track--chance' : ''}`}>
          <span className="minibar__fill" style={{ width: `${value * 100}%`, background: color }} />
        </span>
        {formatPercent(value, lang)}
      </span>
    )

  return (
    <div className="comparison">
      <p className="muted">{t.master.comparisonHelp}</p>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>{t.master.colSession}</th>
              <th className="num">{t.master.colN}</th>
              {schemas.map((s) => (
                <th key={s.key} className="num">
                  {t.ana.scoreLabel(s.label[lang])}
                </th>
              ))}
              {deep && <th className="num">{t.master.colDeepBest(deep.label[lang])}</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.sessionKey}>
                <td>
                  <code>{r.sessionKey}</code>
                </td>
                <td className="num">{r.submissionCount}</td>
                {schemas.map((s) => (
                  <td key={s.key} className="num">
                    {bar(r.scores[s.key], NEUTRAL_BAR, true)}
                  </td>
                ))}
                {deep && <td className="num">{bar(r.deepStructureBestShare, NEUTRAL_BAR)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {deep && (
        <>
          <h3>{t.master.comparisonCategories(deep.label[lang])}</h3>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{t.master.colSession}</th>
                  {deep.categories.map((c) => (
                    <th key={c.key} className="num">
                      <span className="swatch" style={{ background: c.color }} aria-hidden="true" />
                      {c.label[lang]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.sessionKey}>
                    <td>
                      <code>{r.sessionKey}</code>
                    </td>
                    {deep.categories.map((c, k) => (
                      <td key={c.key} className="num">
                        {bar(r.categoryHitRates[deep.key]?.[k], c.color)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Legend
            items={deep.categories.map((c) => ({ key: c.key, label: c.label[lang], color: c.color }))}
          />
        </>
      )}
    </div>
  )
}
