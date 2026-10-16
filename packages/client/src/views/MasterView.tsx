import { useCallback, useEffect, useMemo, useState } from 'react'
import '../ui.css'
import { getMaster, getMasterAnalysis, masterCsvUrl, masterJsonUrl } from '../lib/api'
import type { MasterAnalysis, MasterSession } from '../lib/api'
import { DEFAULT_SESSION_KEY } from '@sortiertool/shared/constants'
import { useLang } from '../lib/i18n'
import { formatDate } from '../lib/format'
import { LangSwitch } from '../components/LangSwitch'
import { AnalysisDashboard } from '../components/analysis/AnalysisDashboard'
import { SessionComparison } from '../components/analysis/SessionComparison'

/**
 * Which sessions an export covers: the filtered list, the checked ones, or all sessions except
 * the default (practice) session.
 */
type Scope = 'filtered' | 'selected' | 'all'

/**
 * Master/research view across ALL sessions: filterable session table, analysis of the checked
 * sessions (comparison of class means plus {@link AnalysisDashboard} per session) and CSV/JSON
 * exports for a chosen {@link Scope}.
 *
 * @param {object} props Component props.
 * @param {string} props.masterToken Master token from `?master=`.
 * @returns {JSX.Element} Master page, or a loading/error state.
 */
export function MasterView({ masterToken }: { masterToken: string }) {
  const { lang, t } = useLang()
  const [sessions, setSessions] = useState<MasterSession[] | null>(null)
  const [error, setError] = useState(false)

  const [search, setSearch] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [scope, setScope] = useState<Scope>('filtered')

  const [analysis, setAnalysis] = useState<MasterAnalysis | null>(null)
  const [analysisError, setAnalysisError] = useState(false)
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)
  const [shownKey, setShownKey] = useState<string | null>(null)

  /**
   * Reloads the session list.
   *
   * @returns {Promise<void>}
   */
  const refresh = useCallback(async () => {
    try {
      setError(false)
      setSessions((await getMaster(masterToken)).sessions)
    } catch {
      setError(true)
    }
  }, [masterToken])

  useEffect(() => {
    let active = true
    getMaster(masterToken)
      .then((d) => active && setSessions(d.sessions))
      .catch(() => active && setError(true))
    return () => {
      active = false
    }
  }, [masterToken])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (sessions ?? []).filter((s) => {
      if (q) {
        const hay = [s.sessionKey, s.klassenstufe, s.schulform, s.bundesland ?? '', s.note ?? '']
          .join(' ')
          .toLowerCase()
        if (!hay.includes(q)) return false
      }
      const day = s.createdAt.slice(0, 10)
      if (from && day < from) return false
      if (to && day > to) return false
      return true
    })
  }, [sessions, search, from, to])

  const total = sessions?.length ?? 0
  const submissionsInView = filtered.reduce((n, s) => n + s.submissionCount, 0)
  const excludedInView = filtered.reduce((n, s) => n + s.excludedCount, 0)
  // The practice (default) session is never part of "select all" or a filtered export.
  const filteredKeys = filtered
    .map((s) => s.sessionKey)
    .filter((key) => key !== DEFAULT_SESSION_KEY)
  const selectedKeys = (sessions ?? []).map((s) => s.sessionKey).filter((k) => selected.has(k))

  const exportKeys =
    scope === 'all' ? undefined : scope === 'selected' ? selectedKeys : filteredKeys
  const canExport = exportKeys === undefined || exportKeys.length > 0

  /**
   * Checks or unchecks one session.
   *
   * @param {string} key Session key.
   * @returns {void}
   */
  const toggle = (key: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  const allFilteredSelected = filteredKeys.length > 0 && filteredKeys.every((k) => selected.has(k))

  /**
   * Loads the analysis of the checked sessions and shows the first one.
   *
   * @returns {Promise<void>}
   */
  async function analyse() {
    setLoadingAnalysis(true)
    setAnalysisError(false)
    try {
      const a = await getMasterAnalysis(masterToken, selectedKeys)
      setAnalysis(a)
      setShownKey(a.sessions[0]?.session.sessionKey ?? null)
    } catch {
      setAnalysisError(true)
    } finally {
      setLoadingAnalysis(false)
    }
  }

  const header = (
    <div className="pagehead">
      <p className="links">
        <a href="/">{t.dash.back}</a>
      </p>
      <LangSwitch />
    </div>
  )

  if (error) {
    return (
      <div className="page">
        {header}
        <h1>{t.master.title}</h1>
        <p className="error">{t.master.unavailable}</p>
      </div>
    )
  }
  if (!sessions) {
    return (
      <div className="page">
        <p>{t.dash.loading}</p>
      </div>
    )
  }

  const shown = analysis?.sessions.find((s) => s.session.sessionKey === shownKey)
  const comparisonSchemas = analysis
    ? analysis.schemas.filter((s) => s.key in (analysis.comparison[0]?.scores ?? {}))
    : []

  return (
    <div className="page page--wide">
      {header}
      <h1>{t.master.title}</h1>
      <p className="muted">
        {t.master.summary(filtered.length, total, submissionsInView)}
        {excludedInView > 0 && ` · ${t.master.excluded(excludedInView)}`}
      </p>

      <div className="filterbar">
        <label>
          {t.master.search}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.master.searchPlaceholder}
          />
        </label>
        <label>
          {t.master.from}
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label>
          {t.master.to}
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        <button
          type="button"
          className="ghost"
          onClick={() => {
            setSearch('')
            setFrom('')
            setTo('')
          }}
        >
          {t.master.resetFilter}
        </button>
        <button type="button" className="ghost" onClick={() => void refresh()}>
          {t.dash.refresh}
        </button>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  aria-label={t.master.selectAll}
                  title={t.master.selectAll}
                  checked={allFilteredSelected}
                  onChange={() =>
                    setSelected((prev) => {
                      const next = new Set(prev)
                      for (const k of filteredKeys) {
                        if (allFilteredSelected) next.delete(k)
                        else next.add(k)
                      }
                      return next
                    })
                  }
                />
              </th>
              <th>{t.master.col.key}</th>
              <th>{t.master.col.klassenstufe}</th>
              <th>{t.master.col.schulform}</th>
              <th>{t.master.col.mlVorwissen}</th>
              <th>{t.master.col.bundesland}</th>
              <th>{t.master.col.status}</th>
              <th title={t.master.submissionsTitle}>{t.master.col.submissions}</th>
              <th>{t.master.col.created}</th>
              <th>{t.master.col.lastActivity}</th>
              <th>{t.master.col.note}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.sessionKey}>
                <td>
                  <input
                    type="checkbox"
                    aria-label={t.master.select(s.sessionKey)}
                    checked={selected.has(s.sessionKey)}
                    onChange={() => toggle(s.sessionKey)}
                  />
                </td>
                <td>
                  <code>{s.sessionKey}</code>
                  {s.sessionKey === DEFAULT_SESSION_KEY && (
                    <span className="muted" title={t.master.practiceTitle}>
                      {' '}
                      ({t.master.practice})
                    </span>
                  )}
                </td>
                <td>{s.klassenstufe}</td>
                <td>{s.schulform}</td>
                <td>{s.mlVorwissen}</td>
                <td>{s.bundesland ?? '—'}</td>
                <td title={s.closedAt ? t.master.closedOn(formatDate(s.closedAt, lang)) : undefined}>
                  {s.status === 'open' ? t.master.open : t.master.closed}
                </td>
                <td>
                  {s.submissionCount}
                  {s.excludedCount > 0 && (
                    <span className="muted" title={t.master.excludedTitle}>
                      {' '}
                      (+{s.excludedCount})
                    </span>
                  )}
                </td>
                <td>{formatDate(s.createdAt, lang)}</td>
                <td>{s.lastActivityAt ? formatDate(s.lastActivityAt, lang) : '—'}</td>
                <td>{s.note ?? ''}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={11} className="muted">
                  {t.master.noMatch}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <section className="analysis">
        <h2>{t.master.analysisTitle}</h2>
        <p className="muted">{t.master.analysisHint}</p>
        <div className="actions">
          <button
            type="button"
            disabled={selectedKeys.length === 0 || loadingAnalysis}
            onClick={() => void analyse()}
          >
            {t.master.analyze(selectedKeys.length)}
          </button>
        </div>
        {analysisError && <p className="error">{t.master.analysisFailed}</p>}
        {analysis && analysis.sessions.length > 0 && (
          <>
            {analysis.sessions.some(({ session }) => session.cardSetOutdated) && (
              <p className="notice notice--warn">
                {t.master.cardSetOutdated(
                  analysis.sessions
                    .filter(({ session }) => session.cardSetOutdated)
                    .map(({ session }) => session.sessionKey),
                )}
              </p>
            )}
            <h3>{t.master.comparisonTitle}</h3>
            <SessionComparison rows={analysis.comparison} schemas={comparisonSchemas} />

            <div className="segmented segmented--sessions" role="group" aria-label={t.master.sessionPick}>
              <span className="segmented__label">{t.master.sessionPick}</span>
              {analysis.sessions.map(({ session }) => (
                <button
                  key={session.sessionKey}
                  type="button"
                  className={session.sessionKey === shownKey ? 'is-active' : ''}
                  aria-pressed={session.sessionKey === shownKey}
                  onClick={() => setShownKey(session.sessionKey)}
                >
                  {session.sessionKey}
                </button>
              ))}
            </div>
            {shown && (
              <div className="master__session">
                <p className="muted">
                  {[
                    shown.session.klassenstufe,
                    shown.session.schulform,
                    shown.session.note,
                    shown.session.status === 'open' ? t.master.stillOpen : null,
                    t.master.cardSet(shown.session.cardSetVersion),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
                {shown.session.cardSetOutdated && (
                  <p className="notice notice--warn">{t.master.cardSetOutdatedSession}</p>
                )}
                <AnalysisDashboard
                  key={shown.session.sessionKey}
                  cards={analysis.cards}
                  schemas={analysis.schemas}
                  analysis={shown.analysis}
                  research
                  nameTypes={analysis.nameTypes}
                />
              </div>
            )}
          </>
        )}
      </section>

      <section className="analysis master__export">
        <h2>{t.master.exportTitle}</h2>
        <div className="segmented" role="radiogroup" aria-label={t.master.scope}>
          <span className="segmented__label">{t.master.scope}</span>
          {(
            [
              ['filtered', t.master.scopeFiltered(filteredKeys.length)],
              ['selected', t.master.scopeSelected(selectedKeys.length)],
              ['all', t.master.scopeAll],
            ] as [Scope, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={scope === value}
              className={scope === value ? 'is-active' : ''}
              onClick={() => setScope(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="actions">
          {canExport ? (
            <>
              <a className="btn" href={masterCsvUrl(masterToken, 'metrics', exportKeys)}>
                {t.master.csvMetrics}
              </a>
              <a className="btn" href={masterCsvUrl(masterToken, 'names', exportKeys)}>
                {t.master.csvNames}
              </a>
              <a className="btn" href={masterCsvUrl(masterToken, 'matrix', exportKeys)}>
                {t.master.csvMatrix}
              </a>
              <a className="btn" href={masterCsvUrl(masterToken, 'sessions', exportKeys)}>
                {t.master.csvSessions}
              </a>
              <a className="btn" href={masterJsonUrl(masterToken, exportKeys, 'groups')}>
                {t.master.jsonGroups}
              </a>
              <a className="btn" href={masterJsonUrl(masterToken, exportKeys, 'raw')}>
                {t.master.jsonRaw}
              </a>
            </>
          ) : (
            <span className="muted">{t.master.scopeEmpty}</span>
          )}
        </div>
      </section>
    </div>
  )
}
