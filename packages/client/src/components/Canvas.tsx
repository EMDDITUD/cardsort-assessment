import type { PointerEvent as ReactPointerEvent, RefObject } from 'react'
import type {
  Card as CardType,
  CardPlacement,
  Group,
  GroupInteractionMode,
  Rect,
} from '../lib/types'
import { Card } from './Card'
import { CardStack } from './CardStack'
import { GroupFrame } from './GroupFrame'
import { WORLD } from '../lib/config'
import { useLang } from '../lib/i18n'

/**
 * @property {RefObject<HTMLDivElement | null>} canvasRef Ref to the viewport element (pointer
 *   coordinates are measured against it).
 * @property {CardType[]} cards Localized card set.
 * @property {CardPlacement[]} placements Placement of every card, in world pixels.
 * @property {Group[]} groups Group frames, in world pixels.
 * @property {{ scale: number; panX: number; panY: number }} view Current zoom and pan.
 * @property {Rect | null} draftFrame Frame currently being drawn, or `null`.
 * @property {string | null} draggingId Card being dragged, rendered on top.
 * @property {string | null} openCardId The one card opened by tap/click.
 * @property {string[]} pinnedIds Cards pinned open in addition to `openCardId`.
 * @property {string[]} frontOrder Card ids from back to front (last touched last).
 * @property {string[]} unnamedGroupIds Groups flagged by the failed submit validation.
 * @property {(e: ReactPointerEvent) => void} onCanvasPointerDown Pointer down anywhere on the
 *   viewport (right-button pan, pinch tracking).
 * @property {(cardId: string, e: ReactPointerEvent, fromStack: boolean) => void} onBeginDrag
 *   Starts dragging a placed card or the top card of the stack.
 * @property {(e: ReactPointerEvent) => void} onBackgroundPointerDown Pointer down on the empty
 *   world.
 * @property {(id: string, e: ReactPointerEvent, mode: GroupInteractionMode) => void}
 *   onBeginGroupInteraction Starts moving or resizing a frame.
 * @property {(id: string, name: string) => void} onRenameGroup Renames a group.
 * @property {(id: string) => void} onDeleteGroup Deletes a group.
 * @property {(id: string) => void} onTogglePin Pins or unpins an open card.
 */
interface Props {
  canvasRef: RefObject<HTMLDivElement | null>
  cards: CardType[]
  placements: CardPlacement[]
  groups: Group[]
  view: { scale: number; panX: number; panY: number }
  draftFrame: Rect | null
  draggingId: string | null
  openCardId: string | null
  pinnedIds: string[]
  frontOrder: string[]
  unnamedGroupIds: string[]
  onCanvasPointerDown: (e: ReactPointerEvent) => void
  onBeginDrag: (cardId: string, e: ReactPointerEvent, fromStack: boolean) => void
  onBackgroundPointerDown: (e: ReactPointerEvent) => void
  onBeginGroupInteraction: (
    id: string,
    e: ReactPointerEvent,
    mode: GroupInteractionMode,
  ) => void
  onRenameGroup: (id: string, name: string) => void
  onDeleteGroup: (id: string) => void
  onTogglePin: (id: string) => void
}

/**
 * Bounded work surface of the sorting view: renders frames, placed cards and the stack.
 *
 * Frames and cards live in a world layer that is translated and scaled by `view`; the stack sits
 * outside it and therefore stays fixed on screen. Interaction logic lives in `SortingView`, this
 * component only forwards pointer events.
 *
 * @param {Props} props Component props.
 * @param {RefObject<HTMLDivElement | null>} props.canvasRef Ref to the viewport element.
 * @param {CardType[]} props.cards Localized card set.
 * @param {CardPlacement[]} props.placements Placement of every card.
 * @param {Group[]} props.groups Group frames.
 * @param {{ scale: number; panX: number; panY: number }} props.view Current zoom and pan.
 * @param {Rect | null} props.draftFrame Frame currently being drawn.
 * @param {string | null} props.draggingId Card being dragged.
 * @param {string | null} props.openCardId Card opened by tap/click.
 * @param {string[]} props.pinnedIds Cards pinned open.
 * @param {string[]} props.frontOrder Card ids from back to front.
 * @param {string[]} props.unnamedGroupIds Groups flagged by the submit validation.
 * @param {(e: ReactPointerEvent) => void} props.onCanvasPointerDown Pointer down on the viewport.
 * @param {(cardId: string, e: ReactPointerEvent, fromStack: boolean) => void} props.onBeginDrag
 *   Starts dragging a card.
 * @param {(e: ReactPointerEvent) => void} props.onBackgroundPointerDown Pointer down on the
 *   empty world.
 * @param {(id: string, e: ReactPointerEvent, mode: GroupInteractionMode) => void}
 *   props.onBeginGroupInteraction Starts moving or resizing a frame.
 * @param {(id: string, name: string) => void} props.onRenameGroup Renames a group.
 * @param {(id: string) => void} props.onDeleteGroup Deletes a group.
 * @param {(id: string) => void} props.onTogglePin Pins or unpins an open card.
 * @returns {JSX.Element} The canvas viewport.
 */
export function Canvas({
  canvasRef,
  cards,
  placements,
  groups,
  view,
  draftFrame,
  draggingId,
  openCardId,
  pinnedIds,
  frontOrder,
  unnamedGroupIds,
  onCanvasPointerDown,
  onBeginDrag,
  onBackgroundPointerDown,
  onBeginGroupInteraction,
  onRenameGroup,
  onDeleteGroup,
  onTogglePin,
}: Props) {
  const { t } = useLang()
  const cardById = new Map(cards.map((c) => [c.id, c]))
  const placementById = new Map(placements.map((p) => [p.cardId, p]))
  const colorByGroup = new Map(groups.map((g) => [g.id, g.color]))

  const placed = placements.filter((p) => p.onCanvas)
  const stackCards = cards.filter((c) => !placementById.get(c.id)?.onCanvas)

  return (
    <div
      ref={canvasRef}
      className="canvas"
      onPointerDown={onCanvasPointerDown}
      // Right-click drag pans.
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        className="canvas__world"
        style={{
          width: WORLD.width,
          height: WORLD.height,
          transform: `translate(${view.panX}px, ${view.panY}px) scale(${view.scale})`,
        }}
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) onBackgroundPointerDown(e)
        }}
      >
        {/* Placeholder number = index in `groups`: unique, moves up after a deletion. */}
        {groups.map((group, index) => (
          <GroupFrame
            key={group.id}
            group={group}
            placeholder={t.group.placeholder(index + 1)}
            invalid={unnamedGroupIds.includes(group.id)}
            onBeginInteraction={onBeginGroupInteraction}
            onRename={onRenameGroup}
            onDelete={onDeleteGroup}
          />
        ))}

        {draftFrame && (
          <div
            className="frame-draft"
            style={{
              left: draftFrame.x,
              top: draftFrame.y,
              width: draftFrame.width,
              height: draftFrame.height,
            }}
          />
        )}

        {placed.map((p) => {
          const card = cardById.get(p.cardId)
          if (!card) return null
          const pinned = pinnedIds.includes(p.cardId)
          const open = openCardId === p.cardId || pinned
          // Last touched card in front, dragged card on top; the stack stays above via CSS.
          const orderIndex = frontOrder.indexOf(p.cardId)
          const zIndex = draggingId === p.cardId ? 1000 : orderIndex < 0 ? 1 : orderIndex + 1
          return (
            <Card
              key={p.cardId}
              card={card}
              open={open}
              pinned={pinned}
              className="card--placed"
              style={{ left: p.x, top: p.y, zIndex }}
              color={p.groupId ? colorByGroup.get(p.groupId) : undefined}
              onPointerDown={(e) => onBeginDrag(p.cardId, e, false)}
              onTogglePin={onTogglePin}
            />
          )
        })}
      </div>

      <CardStack
        cards={stackCards}
        onDrawTop={(cardId, e) => onBeginDrag(cardId, e, true)}
      />
    </div>
  )
}
