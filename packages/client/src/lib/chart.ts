import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react'
import type { CardSource, Lang, Schema, SchemaCategory } from './types'

/**
 * Shared helpers of the dashboard charts: container width, mouse/touch selection, card and
 * category labels, grey scale for shares.
 */

/** Bar color for values without category color. */
export const NEUTRAL_BAR = '#5c6b63'

/**
 * Tracks the content width of an element, so charts can draw in real pixels.
 *
 * @template T
 * @returns {[RefObject<T | null>, number]} Ref to attach to the container, and its width in
 *   pixels (`0` until measured).
 */
export function useWidth<T extends HTMLElement>(): [RefObject<T | null>, number] {
  const ref = useRef<T | null>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, width]
}

/**
 * Selection of one chart element for mouse and touch: hover previews (mouse only), click/tap
 * pins, tapping the same element again releases.
 *
 * @returns {{ shown: string | null; pinned: string | null; bind: (key: string) => object;
 *   clear: () => void }} `shown` = hovered or else pinned key; `bind(key)` returns the pointer
 *   handlers to spread onto an element; `clear` releases the pin.
 */
export function useChartSelection() {
  const [hovered, setHovered] = useState<string | null>(null)
  const [pinned, setPinned] = useState<string | null>(null)
  /**
   * Pointer handlers that make one element selectable.
   *
   * @param {string} key Key identifying the element.
   * @returns {object} `onPointerEnter`, `onPointerLeave` and `onClick` handlers.
   */
  const bind = (key: string) => ({
    onPointerEnter: (e: ReactPointerEvent) => {
      if (e.pointerType === 'mouse') setHovered(key)
    },
    onPointerLeave: (e: ReactPointerEvent) => {
      if (e.pointerType === 'mouse') setHovered(null)
    },
    onClick: () => setPinned((p) => (p === key ? null : key)),
  })
  return { shown: hovered ?? pinned, pinned, bind, clear: () => setPinned(null) }
}

/**
 * Category of a card within a reference schema.
 *
 * @param {CardSource} card Card with its schema features.
 * @param {Schema} schema Reference schema.
 * @returns {SchemaCategory | undefined} The category, or `undefined` if the card has no valid
 *   value for this schema.
 */
export function categoryOf(card: CardSource, schema: Schema): SchemaCategory | undefined {
  const key = card.features?.[schema.key]
  return schema.categories.find((c) => c.key === key)
}

/**
 * Display label of a card in charts.
 *
 * @param {CardSource} card Card to label.
 * @param {Lang} lang UI language.
 * @returns {string} Id plus short name (e.g. `A Spam`), or the id alone without short name.
 */
export function cardLabel(card: CardSource, lang: Lang): string {
  return card.short ? `${card.id} ${card.short[lang]}` : card.id
}

/**
 * Card order grouped by the categories of a schema; stable, so the card-set order is kept within
 * a category. Cards without a category come last.
 *
 * @param {CardSource[]} cards Card set.
 * @param {Schema} schema Reference schema to order by.
 * @returns {number[]} Indices into `cards` in display order.
 */
export function orderBySchema(cards: CardSource[], schema: Schema): number[] {
  /**
   * Sort rank of a card: its category index, or past the last category.
   *
   * @param {number} i Index into `cards`.
   * @returns {number} Rank.
   */
  const rank = (i: number) => {
    const k = schema.categories.findIndex((c) => c.key === cards[i].features?.[schema.key])
    return k === -1 ? schema.categories.length : k
  }
  return cards.map((_, i) => i).sort((a, b) => rank(a) - rank(b) || a - b)
}

/**
 * Grey fill for a share (heatmap cells): light for `0`, dark for `1`.
 *
 * @param {number} share Share in `[0, 1]`.
 * @returns {string} CSS `rgb()` color.
 */
export function shareFill(share: number): string {
  const v = Math.round(246 - share * (246 - 38))
  return `rgb(${v}, ${v}, ${v})`
}

/**
 * Text color readable on {@link shareFill} of the same share.
 *
 * @param {number} share Share in `[0, 1]`.
 * @returns {string} White on dark fills, dark ink otherwise.
 */
export function shareInk(share: number): string {
  return share > 0.5 ? '#ffffff' : '#1b2a22'
}
