import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import type { Card as CardType } from '../lib/types'
import { useLang } from '../lib/i18n'

/**
 * @property {CardType} card Card to render.
 * @property {boolean} [open] Whether the card is opened (text visible).
 * @property {boolean} [pinned] Whether the card is pinned open.
 * @property {string} [className] Extra class, e.g. `card--placed` or `card--stacked`.
 * @property {CSSProperties} [style] Positioning from the parent.
 * @property {string} [color] Group color as border; none = ungrouped (grey).
 * @property {(e: ReactPointerEvent) => void} [onPointerDown] Starts dragging (or opening).
 * @property {(id: string) => void} [onTogglePin] Pins or unpins the card.
 */
interface Props {
  card: CardType
  open?: boolean
  pinned?: boolean
  className?: string
  style?: CSSProperties
  color?: string
  onPointerDown?: (e: ReactPointerEvent) => void
  onTogglePin?: (id: string) => void
}

/**
 * Estimates a fixed width for the opened text column, sized for about three lines.
 *
 * @param {string} text Card text.
 * @returns {number} Width in px, clamped to `[150, 520]`.
 */
function openTextWidth(text: string): number {
  const charsPerLine = Math.ceil(text.length / 3)
  return Math.min(Math.max(charsPerLine * 7, 150), 520)
}

/**
 * Single card: square image; when opened, the text slides out next to it and a pin button
 * appears.
 *
 * @param {Props} props Component props.
 * @param {CardType} props.card Card to render.
 * @param {boolean} [props.open=false] Whether the card is opened.
 * @param {boolean} [props.pinned=false] Whether the card is pinned open.
 * @param {string} [props.className] Extra class.
 * @param {CSSProperties} [props.style] Positioning from the parent.
 * @param {string} [props.color] Group color as border.
 * @param {(e: ReactPointerEvent) => void} [props.onPointerDown] Starts dragging.
 * @param {(id: string) => void} [props.onTogglePin] Pins or unpins the card.
 * @returns {JSX.Element} The card element.
 */
export function Card({
  card,
  open = false,
  pinned = false,
  className,
  style,
  color,
  onPointerDown,
  onTogglePin,
}: Props) {
  const { t } = useLang()
  const classes = ['card']
  if (open) classes.push('card--open')
  if (className) classes.push(className)

  // --card-text-w is set while closed too, otherwise the column jumps to the CSS default on close
  // and the text re-wraps during the animation. 96 = image (90) + border (2×3).
  const textW = openTextWidth(card.text)
  const rootStyle = {
    ...style,
    ...(open ? { width: 96 + textW } : null),
    '--card-text-w': `${textW}px`,
  } as CSSProperties

  return (
    <div className={classes.join(' ')} style={rootStyle} onPointerDown={onPointerDown}>
      <div className="card__body" style={color ? { borderColor: color } : undefined}>
        <img className="card__img" src={card.image} alt="" draggable={false} />
        {/* Text always in the DOM: clipped by CSS when closed, slides out when open. */}
        <p className="card__text">{card.text}</p>
      </div>
      {open && (
        <button
          type="button"
          className={`card__pin${pinned ? ' is-pinned' : ''}`}
          aria-label={pinned ? t.card.unpin : t.card.pin}
          aria-pressed={pinned}
          // The pin must neither start a drag nor close the card.
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onTogglePin?.(card.id)}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
            <path
              d="M9 3h6l-1 5 3 3v2h-5v6l-1 2-1-2v-6H4v-2l3-3-1-5z"
              fill="currentColor"
            />
          </svg>
        </button>
      )}
    </div>
  )
}
