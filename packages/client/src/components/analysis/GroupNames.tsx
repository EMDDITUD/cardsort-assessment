import { useState } from 'react'
import { UNCLEAR_NAME_TYPE, normalizeName } from '@sortiertool/shared/analysis'
import type { NameStat } from '@sortiertool/shared/analysis'
import type { CardSource, NameType } from '../../lib/types'
import { useLang } from '../../lib/i18n'
import { cardLabel } from '../../lib/chart'
import { UNGROUPED_COLOR } from '../../lib/config'
import { BarList } from './BarList'

/**
 * Research tab of the group names: frequency list with spelling variants and cards per name,
 * search and card filter, plus the share per name type of the automatic pre-coding.
 *
 * @param {object} props Component props.
 * @param {NameStat[]} props.names Name statistics of the session.
 * @param {CardSource[]} props.cards Card set of the session.
 * @param {NameType[]} [props.nameTypes] Name types; without them the coding chart is hidden.
 * @returns {JSX.Element} The group-names tab.
 */
export function GroupNames({
  names,
  cards,
  nameTypes,
}: {
  names: NameStat[]
  cards: CardSource[]
  nameTypes?: NameType[]
}) {
  const { lang, t } = useLang()
  const [query, setQuery] = useState('')
  const [cardId, setCardId] = useState<string | null>(null)
  const byId = new Map(cards.map((c) => [c.id, c]))

  const q = normalizeName(query)
  const shown = names
    .filter((n) => !q || n.variants.some((v) => normalizeName(v.name).includes(q)))
    .filter((n) => !cardId || (n.cardCounts[cardId] ?? 0) > 0)
    .sort((a, b) => (cardId ? (b.cardCounts[cardId] ?? 0) - (a.cardCounts[cardId] ?? 0) : 0))
  const groupCount = names.reduce((sum, n) => sum + n.count, 0)

  /**
   * Label and color of a name type; unknown keys count as "unclear".
   *
   * @param {string | undefined} key Name type key.
   * @returns {{ label: string; color: string }} Localized label and color.
   */
  const typeInfo = (key: string | undefined) => {
    const type = nameTypes?.find((nt) => nt.key === key)
    return type
      ? { label: type.label[lang], color: type.color }
      : { label: t.ana.names.unclear, color: UNGROUPED_COLOR }
  }

  return (
    <div className="names">
      <p className="muted">{t.ana.names.summary(names.length, groupCount)}</p>

      {nameTypes && groupCount > 0 && (
        <div className="names__coding">
          <h3>{t.ana.names.codingTitle}</h3>
          <p className="muted">{t.ana.names.codingHelp}</p>
          <BarList
            items={[...nameTypes.map((nt) => nt.key), UNCLEAR_NAME_TYPE].map((key) => ({
              key,
              ...typeInfo(key),
              value:
                names.filter((n) => n.type === key).reduce((sum, n) => sum + n.count, 0) /
                groupCount,
            }))}
          />
        </div>
      )}

      <div className="filterbar">
        <label>
          {t.ana.names.search}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.ana.names.searchPlaceholder}
          />
        </label>
        <div className="names__cards" role="group" aria-label={t.ana.names.cardFilter}>
          <span className="names__cards-label">{t.ana.names.cardFilter}</span>
          <button
            type="button"
            className={`chip${cardId === null ? ' is-active' : ''}`}
            aria-pressed={cardId === null}
            onClick={() => setCardId(null)}
          >
            {t.ana.names.allCards}
          </button>
          {cards.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`chip${cardId === c.id ? ' is-active' : ''}`}
              aria-pressed={cardId === c.id}
              onClick={() => setCardId(cardId === c.id ? null : c.id)}
            >
              {cardLabel(c, lang)}
            </button>
          ))}
        </div>
      </div>

      {cardId && byId.get(cardId) && (
        <p className="names__for">{t.ana.names.forCard(cardLabel(byId.get(cardId)!, lang))}</p>
      )}

      {shown.length === 0 ? (
        <p className="muted">{t.ana.names.none}</p>
      ) : (
        <ul className="names__list">
          {shown.map((n) => {
            const type = n.type !== undefined ? typeInfo(n.type) : null
            return (
              <li key={n.normalized} className="names__item">
                <span className="names__count">
                  {t.ana.names.times(cardId ? (n.cardCounts[cardId] ?? 0) : n.count)}
                </span>
                <div className="names__main">
                  <div className="names__title">
                    <strong>{n.variants[0].name}</strong>
                    {type && (
                      <span className="pill" style={{ borderColor: type.color }}>
                        <span className="swatch" style={{ background: type.color }} aria-hidden="true" />
                        {type.label}
                      </span>
                    )}
                    <span className="muted">{t.ana.names.usedBy(n.participantNos.length)}</span>
                  </div>
                  {n.variants.length > 1 && (
                    <div className="muted names__variants">
                      {t.ana.names.variants(n.variants.slice(1).map((v) => v.name).join(', '))}
                    </div>
                  )}
                  <div className="names__chips">
                    {Object.entries(n.cardCounts)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([id, count]) => (
                        <span
                          key={id}
                          className={`chip chip--static${id === cardId ? ' is-active' : ''}`}
                          title={t.ana.names.cardCount(
                            byId.get(id) ? cardLabel(byId.get(id)!, lang) : id,
                            count,
                          )}
                        >
                          {id}
                          {count > 1 && <small>×{count}</small>}
                        </span>
                      ))}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
