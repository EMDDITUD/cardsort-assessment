import { LANGS, useLang } from '../lib/i18n'

/**
 * Language toggle (DE/EN) for the dashboard headers.
 *
 * @returns {JSX.Element} Button group, one button per language.
 */
export function LangSwitch() {
  const { lang, setLang, t } = useLang()
  return (
    <div className="langswitch" role="group" aria-label={t.menu.language}>
      {LANGS.map((entry) => (
        <button
          key={entry.lang}
          type="button"
          className={`langswitch__btn${entry.lang === lang ? ' is-active' : ''}`}
          aria-pressed={entry.lang === lang}
          onClick={() => setLang(entry.lang)}
        >
          {entry.name}
        </button>
      ))}
    </div>
  )
}
