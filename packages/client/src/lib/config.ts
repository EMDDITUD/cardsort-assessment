/**
 * Size of the bounded canvas in world pixels; reference for a submission's relative
 * coordinates — changing it makes submissions incomparable.
 */
export const WORLD = { width: 9600, height: 5400 }

/**
 * Public repository of this tool; linked in the menu and on the legal page to meet the AGPL's
 * source-offer duty for network use. Operators of a modified version must point it at their
 * source.
 */
export const SOURCE_URL = 'https://github.com/EMDDITUD/cardsort-assessment'

/** Card edge length in world pixels; must match the `.card` size in App.css. */
export const CARD_SIZE = 96

/**
 * Minimum frame edge length in world pixels: smaller drawn frames are discarded, resizing clamps
 * to it.
 */
export const MIN_FRAME_SIZE = 40

/** Group colors, cycled through as new groups are drawn. */
export const GROUP_COLORS = ['#e57373', '#64b5f6', '#81c784', '#ffb74d', '#ba68c8', '#4db6ac']

/**
 * Grey of ungrouped cards; also the fallback color for elements without category or name type
 * in the charts.
 */
export const UNGROUPED_COLOR = '#9e9e9e'
