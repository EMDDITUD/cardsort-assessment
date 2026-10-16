import { useCallback, useState } from 'react'
import type { SessionAnalysis } from '@sortiertool/shared/analysis'
import type { CardSource, NameType, Schema } from '../../lib/types'
import { useLang } from '../../lib/i18n'
import { CardGraph } from '../CardGraph'
import { BarList } from './BarList'
import { Dendrogram } from './Dendrogram'
import { GroupNames } from './GroupNames'
import { Heatmap } from './Heatmap'
import { Overview } from './Overview'
import { SubmissionDetail } from './SubmissionDetail'
import { SubmissionTable } from './SubmissionTable'

/** Dashboard tab; `names` is only shown in the research view. */
type Tab = 'overview' | 'charts' | 'names' | 'submissions'
/** Visualization shown in the `charts` tab. */
type ChartView = 'graph' | 'heatmap' | 'dendrogram' | 'categories'
/** Tabs and chart views in display order. */
const TABS: Tab[] = ['overview', 'charts', 'names', 'submissions']
const VIEWS: ChartView[] = ['categories', 'graph', 'dendrogram', 'heatmap']

/**
 * Analysis of one session in tabs (overview, visualizations, group names, single submissions),
 * shared by the teacher's admin view and the research view; opens a submission as overlay.
 *
 * Only schemas the analysis could compute (`analysis.schemaKeys`) are offered.
 *
 * @param {object} props Component props.
 * @param {CardSource[]} props.cards Card set of the session.
 * @param {Schema[]} props.schemas All reference schemas.
 * @param {SessionAnalysis} props.analysis Analysis of the session.
 * @param {boolean} [props.research=false] Research view: adds the group-names tab and columns.
 * @param {NameType[]} [props.nameTypes] Name types for the group-name coding (research only).
 * @returns {JSX.Element} The dashboard, or a hint when there are no submissions.
 */
export function AnalysisDashboard({
  cards,
  schemas,
  analysis,
  research = false,
  nameTypes,
}: {
  cards: CardSource[]
  schemas: Schema[]
  analysis: SessionAnalysis
  research?: boolean
  nameTypes?: NameType[]
}) {
  const { lang, t } = useLang()
  const usable = analysis.schemaKeys
    .map((key) => schemas.find((s) => s.key === key))
    .filter((s): s is Schema => s !== undefined)
  const deep = usable.find((s) => s.role === 'tiefenstruktur')

  const [tab, setTab] = useState<Tab>('overview')
  const [schemaKey, setSchemaKey] = useState<string | null>(deep?.key ?? usable[0]?.key ?? null)
  const [view, setView] = useState<ChartView>(usable.length > 0 ? 'categories' : 'graph')
  const [detailNo, setDetailNo] = useState<number | null>(null)
  /**
   * Closes the submission overlay.
   *
   * @returns {void}
   */
  const closeDetail = useCallback(() => setDetailNo(null), [])

  const schema = usable.find((s) => s.key === schemaKey) ?? null
  const detail = analysis.submissions.find((s) => s.participantNo === detailNo)

  if (analysis.submissionCount === 0) return <p className="muted">{t.ana.empty}</p>

  /**
   * Segmented button group for a single choice.
   *
   * @template T
   * @param {string} label Group label, also used as `aria-label`.
   * @param {{ value: T; label: string }[]} options Choices in display order.
   * @param {T} current Selected value.
   * @param {(v: T) => void} onChange Called with the clicked value.
   * @returns {JSX.Element} The button group.
   */
  const segmented = <T extends string>(
    label: string,
    options: { value: T; label: string }[],
    current: T,
    onChange: (v: T) => void,
  ) => (
    <div className="segmented" role="group" aria-label={label}>
      <span className="segmented__label">{label}</span>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={o.value === current ? 'is-active' : ''}
          aria-pressed={o.value === current}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )

  return (
    <div className="dashboard">
      <div className="tabs" role="tablist" aria-label={t.ana.tabsLabel}>
        {TABS.filter((key) => key !== 'names' || research).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            className={tab === key ? 'is-active' : ''}
            onClick={() => setTab(key)}
          >
            {t.ana.tabs[key]}
          </button>
        ))}
      </div>

      <div className="tabpanel" role="tabpanel">
        {tab === 'overview' && <Overview analysis={analysis} schemas={usable} onOpen={setDetailNo} />}

        {tab === 'charts' && (
          <>
            <div className="controls">
              {segmented(
                t.ana.charts.viewLabel,
                VIEWS.filter((v) => v !== 'categories' || schema).map((v) => ({
                  value: v,
                  label: t.ana.charts.views[v],
                })),
                view,
                setView,
              )}
              {schema &&
                segmented(
                  t.ana.charts.schema,
                  usable.map((s) => ({ value: s.key, label: s.label[lang] })),
                  schema.key,
                  setSchemaKey,
                )}
            </div>

            {view === 'graph' && (
              <div className="chart">
                <CardGraph
                  cards={cards}
                  matrix={analysis.cooccurrence}
                  submissionCount={analysis.submissionCount}
                  schema={schema}
                />
                <p className="muted">{t.ana.charts.graphHelp}</p>
              </div>
            )}
            {view === 'heatmap' && <Heatmap cards={cards} analysis={analysis} schema={schema} />}
            {view === 'dendrogram' && (
              <Dendrogram cards={cards} analysis={analysis} schema={schema} />
            )}
            {view === 'categories' && schema && (
              <div className="chart">
                <h3>{t.ana.categoryTitle(schema.label[lang])}</h3>
                <p className="muted">{t.ana.categoryHelp}</p>
                <BarList
                  items={schema.categories.map((c, k) => ({
                    key: c.key,
                    label: c.label[lang],
                    value: analysis.means[schema.key].categoryHitRates[k],
                    color: c.color,
                    note: t.ana.categorySingle,
                  }))}
                />
              </div>
            )}
          </>
        )}

        {tab === 'names' && research && (
          <GroupNames
            names={analysis.names}
            cards={cards}
            nameTypes={nameTypes}
          />
        )}

        {tab === 'submissions' && (
          <section>
            <h3>{t.ana.subs.tableTitle}</h3>
            <p className="muted">
              {t.ana.subs.tableHelp}
              {deep && <> {t.ana.subs.leadHelp(deep.label[lang])}</>}
            </p>
            <SubmissionTable
              submissions={analysis.submissions}
              schemas={usable}
              deep={deep}
              research={research}
              onOpen={setDetailNo}
            />
          </section>
        )}
      </div>

      {detail && (
        <SubmissionDetail
          submission={detail}
          cards={cards}
          schemas={usable}
          colorSchema={schema}
          onClose={closeDetail}
        />
      )}
    </div>
  )
}
