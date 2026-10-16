import type { Card, CardSource, Lang } from './types'

/**
 * Resolves the multilingual card set to one language — the only place in the client where card
 * texts are translated.
 *
 * @param {CardSource[]} source Card set from `cards.json`.
 * @param {Lang} lang Target language.
 * @returns {Card[]} Cards with the text in `lang`.
 */
export function localizeCards(source: CardSource[], lang: Lang): Card[] {
  return source.map((c) => ({ id: c.id, image: c.image, text: c.text[lang] }))
}
