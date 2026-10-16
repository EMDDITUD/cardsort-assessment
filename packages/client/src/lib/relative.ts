import type { CanvasSize, SortState } from '@sortiertool/shared/types'

/**
 * Conversion between world pixels and resolution-independent relative coordinates; coordinate
 * convention see {@link SortState}.
 */

/**
 * Share of `value` in `total`, guarded against an empty canvas.
 *
 * @param {number} value Pixel value.
 * @param {number} total Reference length.
 * @returns {number} `value / total`, or `0` if `total` is not positive.
 */
function frac(value: number, total: number): number {
  return total > 0 ? value / total : 0
}

/**
 * Converts a pixel sorting state into the relative state sent on submit.
 *
 * @param {Pick<SortState, 'placements' | 'groups' | 'lang'>} state State in world pixels.
 * @param {CanvasSize} canvas Canvas size the pixels refer to.
 * @returns {SortState} State with positions and sizes as fractions of `canvas`.
 */
export function toRelativeState(
  state: Pick<SortState, 'placements' | 'groups' | 'lang'>,
  canvas: CanvasSize,
): SortState {
  return {
    canvas,
    lang: state.lang,
    placements: state.placements.map((p) => ({
      ...p,
      x: frac(p.x, canvas.width),
      y: frac(p.y, canvas.height),
    })),
    groups: state.groups.map((g) => ({
      ...g,
      x: frac(g.x, canvas.width),
      y: frac(g.y, canvas.height),
      width: frac(g.width, canvas.width),
      height: frac(g.height, canvas.height),
    })),
  }
}

/**
 * Converts a relative state back into pixels of a given canvas (inverse of
 * {@link toRelativeState}).
 *
 * @param {SortState} state Relative state.
 * @param {CanvasSize} canvas Target canvas size.
 * @returns {SortState} State in pixels of `canvas`.
 */
export function toAbsoluteState(state: SortState, canvas: CanvasSize): SortState {
  return {
    canvas,
    lang: state.lang,
    placements: state.placements.map((p) => ({
      ...p,
      x: p.x * canvas.width,
      y: p.y * canvas.height,
    })),
    groups: state.groups.map((g) => ({
      ...g,
      x: g.x * canvas.width,
      y: g.y * canvas.height,
      width: g.width * canvas.width,
      height: g.height * canvas.height,
    })),
  }
}
