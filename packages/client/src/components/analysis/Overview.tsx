import type { SessionAnalysis } from '@sortiertool/shared/analysis'
import type { Schema } from '../../lib/types'
import { useLang } from '../../lib/i18n'
import { formatNumber, formatPercent } from '../../lib/format'
import { NEUTRAL_BAR } from '../../lib/chart'
import { readingFacts } from '../../lib/readingText'
import type { ReadingFact } from '../../lib/readingText'
import { BarList } from './BarList'
import { LeadDotPlot } from './LeadDotPlot'

/**
 * "Overview" tab of the analysis: key figures, generated reading text, agreement per schema,
 * hit rate per deep-structure category and the distribution of the deep-structure lead per
 * submission ({@link LeadDotPlot}).
 *
 * @param {object} props Component props.
 * @param {SessionAnalysis} props.analysis Analysis of the session.
 * @param {Schema[]} props.schemas Usable reference schemas.
 * @param {(participantNo: number) => void} props.onOpen Opens a single submission.
 * @returns {JSX.Element} The overview tab.
 */
export function Overview({
  analysis,
  schemas,
  onOpen,
}: {
  analysis: SessionAnalysis
  schemas: Schema[]
  onOpen: (participantNo: number) => void
}) {
  const { lang, t } = useLang()
  const deep = schemas.find((s) => s.role === 'tiefenstruktur')
  /**
   * Localized label of a schema.
   *
   * @param {string} key Schema key.
   * @returns {string} Label, or the key if the schema is unknown.
   */
  const label = (key: string) => schemas.find((s) => s.key === key)?.label[lang] ?? key
  /**
   * Localized labels of categories of a schema.
   *
   * @param {string} schemaKey Schema key.
   * @param {string[]} keys Category keys.
   * @returns {string[]} Labels, falling back to the keys.
   */
  const catLabel = (schemaKey: string, keys: string[]) => {
    const schema = schemas.find((s) => s.key === schemaKey)
    return keys.map((k) => schema?.categories.find((c) => c.key === k)?.label[lang] ?? k)
  }
  /**
   * Turns a fact from {@link readingFacts} into a localized sentence of the reading text.
   *
   * @param {ReadingFact} f Fact to verbalize.
   * @returns {string} The sentence.
   */
  const sentence = (f: ReadingFact): string => {
    const r = t.ana.reading
    switch (f.kind) {
      case 'nearChance':
        return r.nearChance
      case 'leaning':
        return r.leaning(label(f.toward), label(f.over))
      case 'balanced':
        return r.balanced(label(f.a), label(f.b))
      case 'recognized':
        return r.recognized(catLabel(f.schema, f.categories))
      case 'hardly':
        return r.hardly(catLabel(f.schema, f.categories))
      case 'split':
        return r.split(f.count, f.total, label(f.deepSchema))
    }
  }
  const facts = readingFacts(analysis, schemas)
  const meanGroups =
    analysis.submissions.reduce((sum, s) => sum + s.groupCount, 0) /
    Math.max(1, analysis.submissions.length)

  return (
    <div className="overview">
      <div className="kpis">
        <div className="kpi">
          <span className="kpi__value">{analysis.submissionCount}</span>
          <span className="kpi__label">{t.ana.kpiSubmissions}</span>
        </div>
        {deep && analysis.deepStructureBestShare !== null && (
          <div className="kpi">
            <span className="kpi__value">{formatPercent(analysis.deepStructureBestShare, lang)}</span>
            <span className="kpi__label">{t.ana.kpiDeepBest(deep.label[lang])}</span>
          </div>
        )}
        <div className="kpi">
          <span className="kpi__value">{formatNumber(meanGroups, lang, 1)}</span>
          <span className="kpi__label">{t.ana.kpiGroups}</span>
        </div>
      </div>

      {facts.length > 0 && (
        <section className="reading">
          <h3>{t.ana.readingTitle}</h3>
          <p>{facts.map(sentence).join(' ')}</p>
        </section>
      )}

      {schemas.length === 0 ? (
        <p className="notice">{t.ana.noSchemas}</p>
      ) : (
        <div className="overview__charts">
          <section>
            <h3>{t.ana.scoreTitle}</h3>
            <p className="muted">{t.ana.scoreHelp}</p>
            <BarList
              chance
              swatches={false}
              items={schemas.map((s) => ({
                key: s.key,
                label: t.ana.scoreLabel(s.label[lang]),
                value: analysis.means[s.key].score,
                color: NEUTRAL_BAR,
              }))}
            />
          </section>
          {deep && (
            <section>
              <h3>{t.ana.categoryTitle(deep.label[lang])}</h3>
              <p className="muted">{t.ana.categoryHelp}</p>
              <BarList
                items={deep.categories.map((c, k) => ({
                  key: c.key,
                  label: c.label[lang],
                  value: analysis.means[deep.key].categoryHitRates[k],
                  color: c.color,
                  note: t.ana.categorySingle,
                }))}
              />
            </section>
          )}
        </div>
      )}

      {deep && (
        <section>
          <h3>{t.ana.subs.distTitle}</h3>
          <LeadDotPlot submissions={analysis.submissions} schemas={schemas} onOpen={onOpen} />
        </section>
      )}
    </div>
  )
}
