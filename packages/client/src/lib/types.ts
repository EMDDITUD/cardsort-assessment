/**
 * Re-exports the shared data-model types the client uses, so most client code imports them from
 * here.
 */
export type {
  Card,
  CardSource,
  Lang,
  Localized,
  Rect,
  Group,
  CardPlacement,
  SortState,
  Schema,
  SchemaCategory,
  NameType,
} from '@sortiertool/shared/types'

/** Edge or corner a group frame is resized at (compass directions). */
export type ResizeDir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

/** What a pointer gesture on a group frame does: move it, or resize it at a {@link ResizeDir}. */
export type GroupInteractionMode = 'move' | ResizeDir
