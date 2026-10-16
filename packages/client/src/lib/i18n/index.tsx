import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Lang } from '../types'
import { DEFAULT_LANG, readLang, writeLang } from '../lang'
import { de } from './de'
import type { Dict } from './de'
import { en } from './en'

/**
 * Language switching of the UI: provider holding the active language and {@link useLang} as the
 * single access point to the dictionary.
 */

/** Dictionary contract of all languages, defined by the German dictionary. */
export type { Dict }

/** Dictionary per language. */
const DICTS: Record<Lang, Dict> = { de, en }

/**
 * Value provided by {@link LanguageProvider}.
 *
 * @property {Lang} lang Active language.
 * @property {(lang: Lang) => void} setLang Switches and remembers the language.
 * @property {Dict} t Dictionary of the active language.
 */
interface LanguageContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
  t: Dict
}

/** Context with a German fallback for components rendered outside the provider. */
const LanguageContext = createContext<LanguageContextValue>({
  lang: DEFAULT_LANG,
  setLang: () => {},
  t: de,
})

/**
 * Provides the active language and its dictionary to the app; starts with {@link readLang} and
 * keeps `<html lang>` in sync.
 *
 * @param {object} props Component props.
 * @param {ReactNode} props.children App subtree.
 * @returns {JSX.Element} Context provider around `children`.
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => readLang())

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  /**
   * Switches the language and remembers it.
   *
   * @param {Lang} next Language to switch to.
   * @returns {void}
   */
  const setLang = useCallback((next: Lang) => {
    writeLang(next)
    setLangState(next)
  }, [])

  const value = useMemo(() => ({ lang, setLang, t: DICTS[lang] }), [lang, setLang])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

/**
 * Access to the active language and its dictionary; every visible text comes from `t`.
 *
 * @returns {LanguageContextValue} Active language, switcher and dictionary.
 */
export function useLang(): LanguageContextValue {
  return useContext(LanguageContext)
}

/** Selectable languages with their own name, for the language switch. */
export const LANGS: { lang: Lang; name: string }[] = [
  { lang: 'de', name: de.langName },
  { lang: 'en', name: en.langName },
]
