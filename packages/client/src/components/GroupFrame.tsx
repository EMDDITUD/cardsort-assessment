import { useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import type { Group, GroupInteractionMode, ResizeDir } from '../lib/types'
import { useLang } from '../lib/i18n'

/**
 * @property {Group} group Group to render, in world pixels.
 * @property {string} placeholder Name shown while the group is unnamed; display only, never
 *   written to `group.name` and thus never submitted.
 * @property {boolean} invalid Whether the submit validation flagged the group as unnamed.
 * @property {(id: string, e: ReactPointerEvent, mode: GroupInteractionMode) => void}
 *   onBeginInteraction Starts moving (`'move'`) or resizing (a `ResizeDir`) the frame.
 * @property {(id: string, name: string) => void} onRename Renames the group.
 * @property {(id: string) => void} onDelete Deletes the group.
 */
interface Props {
  group: Group
  placeholder: string
  invalid: boolean
  onBeginInteraction: (
    id: string,
    e: ReactPointerEvent,
    mode: GroupInteractionMode,
  ) => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
}

/** Resize handles on all corners and edges. */
const HANDLES: ResizeDir[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']

/**
 * Group frame on the canvas: editable name, delete button, drag to move, handles to resize.
 *
 * The group color drives border, tint, label and cross via `--frame-color`. The name
 * input grows with its content, measured by a hidden span in the same font.
 *
 * @param {Props} props Component props.
 * @param {Group} props.group Group to render.
 * @param {string} props.placeholder Name shown while unnamed (display only).
 * @param {boolean} props.invalid Whether the group is flagged as unnamed.
 * @param {(id: string, e: ReactPointerEvent, mode: GroupInteractionMode) => void}
 *   props.onBeginInteraction Starts moving or resizing the frame.
 * @param {(id: string, name: string) => void} props.onRename Renames the group.
 * @param {(id: string) => void} props.onDelete Deletes the group.
 * @returns {JSX.Element} The frame element.
 */
export function GroupFrame({
  group,
  placeholder,
  invalid,
  onBeginInteraction,
  onRename,
  onDelete,
}: Props) {
  const { t } = useLang()
  const sizerRef = useRef<HTMLSpanElement>(null)
  const [nameWidth, setNameWidth] = useState(60)

  useLayoutEffect(() => {
    const measured = sizerRef.current?.offsetWidth ?? 0
    const maxInput = Math.max(48, group.width - 80) // room for offset, cross, borders
    setNameWidth(Math.min(Math.max(measured + 6, 48), maxInput))
  }, [group.name, group.width, placeholder])

  const style = {
    left: group.x,
    top: group.y,
    width: group.width,
    height: group.height,
    '--frame-color': group.color,
  } as CSSProperties

  return (
    <div
      className="frame"
      style={style}
      // ONE handler, mode taken from the target's `data-dir`: handlers on the handles themselves
      // would bubble up here and immediately override the resize with 'move'.
      onPointerDown={(e) => {
        const dir = (e.target as HTMLElement).dataset.dir as ResizeDir | undefined
        onBeginInteraction(group.id, e, dir ?? 'move')
      }}
    >
      <div className={`frame__header${invalid ? ' frame__header--invalid' : ''}`}>
        <input
          className="frame__name"
          style={{ width: nameWidth }}
          value={group.name}
          placeholder={placeholder}
          aria-label={t.group.nameLabel}
          onChange={(e) => onRename(group.id, e.target.value)}
          onFocus={(e) => e.currentTarget.select()}
          // Explicit blur, otherwise the tablet keyboard pops up again on the next tap.
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === 'Escape') e.currentTarget.blur()
          }}
          // Editing the name must not move the frame.
          onPointerDown={(e) => e.stopPropagation()}
        />
        <button
          className="frame__delete"
          aria-label={t.group.delete}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onDelete(group.id)}
        >
          ×
        </button>
      </div>

      {/* Measures the placeholder when unnamed, so it is not cut off. */}
      <span ref={sizerRef} className="frame__name-sizer" aria-hidden="true">
        {group.name || placeholder || ' '}
      </span>

      {HANDLES.map((dir) => (
        <div key={dir} className={`frame__h frame__h--${dir}`} data-dir={dir} />
      ))}
    </div>
  )
}
