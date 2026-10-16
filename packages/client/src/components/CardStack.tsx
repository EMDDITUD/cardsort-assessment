import type { PointerEvent as ReactPointerEvent } from 'react'
import type { Card as CardType } from '../lib/types'
import { Card } from './Card'

/**
 * @property {CardType[]} cards Cards not drawn yet; index 0 = top card.
 * @property {(cardId: string, e: ReactPointerEvent) => void} onDrawTop Starts dragging the top
 *   card off the stack.
 */
interface Props {
  cards: CardType[]
  onDrawTop: (cardId: string, e: ReactPointerEvent) => void
}

/**
 * Fixed card stack on the right of the canvas, visibly fanned out; only the top card can be
 * drawn.
 *
 * @param {Props} props Component props.
 * @param {CardType[]} props.cards Cards not drawn yet, top card first.
 * @param {(cardId: string, e: ReactPointerEvent) => void} props.onDrawTop Starts dragging the
 *   top card.
 * @returns {JSX.Element} The stack element.
 */
export function CardStack({ cards, onDrawTop }: Props) {
  return (
    <div className="stack">
      {cards.map((card, i) => (
        <Card
          key={card.id}
          card={card}
          className="card--stacked"
          style={{
            transform: `translate(${-i * 5}px, ${i * 5}px)`,
            zIndex: cards.length - i,
          }}
          onPointerDown={i === 0 ? (e) => onDrawTop(card.id, e) : undefined}
        />
      ))}
    </div>
  )
}
