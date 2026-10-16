/**
 * CSV helpers shared by all exports: formula-safe cells, a metadata comment line and a BOM.
 */

/** Line break and UTF-8 byte order mark (for Excel) of all CSV files. */
const NEWLINE = '\r\n'
const BOM = String.fromCharCode(0xfeff)

/** Value of one CSV cell; `null` becomes an empty cell. */
export type CsvValue = string | number | null

/**
 * Serializes one cell, quoting where needed.
 *
 * Text starting with `=`, `+`, `-`, `@`, tab or CR gets a leading apostrophe so spreadsheets do
 * not run it as a formula; numbers are exempt, otherwise negative values would be altered.
 *
 * @param {CsvValue} value Cell value.
 * @returns {string} Safe CSV cell; non-finite numbers become empty.
 */
export function csvCell(value: CsvValue): string {
  if (value === null) return ''
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : ''
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

/**
 * Provenance written into the comment line of every export.
 *
 * @property {number} submissions Number of submissions contained.
 * @property {string[]} sessions Session keys contained.
 * @property {string} cardSetVersion Current card-set version.
 */
export interface CsvMeta {
  submissions: number
  sessions: string[]
  cardSetVersion: string
}

/**
 * Comment line `# abgaben=…; sitzungen=…; …` heading every export.
 *
 * Skippable in R via `comment.char = "#"`; sessions are space-separated so the line stays a
 * single cell.
 *
 * @param {CsvMeta} meta Export provenance.
 * @returns {string} The comment line as one CSV cell.
 */
function metaLine(meta: CsvMeta): string {
  return csvCell(
    `# abgaben=${meta.submissions}; sitzungen=${meta.sessions.join(' ')}; kartensatz=${meta.cardSetVersion}; exportiert=${new Date().toISOString()}`,
  )
}

/**
 * Builds a complete CSV file: BOM, comment line, header and rows.
 *
 * @param {CsvMeta} meta Export provenance.
 * @param {string[]} header Column names.
 * @param {CsvValue[][]} rows Data rows.
 * @returns {string} CSV text ending in a line break.
 */
export function csvFile(meta: CsvMeta, header: string[], rows: CsvValue[][]): string {
  const lines = [metaLine(meta), header.map(csvCell).join(',')]
  for (const row of rows) lines.push(row.map(csvCell).join(','))
  return BOM + lines.join(NEWLINE) + NEWLINE // trailing newline, otherwise R warns
}

/**
 * Prepends BOM and comment line to an already serialized CSV (e.g. the aggregate matrix) and
 * appends the trailing line break.
 *
 * @param {CsvMeta} meta Export provenance.
 * @param {string} csv CSV body.
 * @returns {string} CSV text with metadata, ending in a line break.
 */
export function withMeta(meta: CsvMeta, csv: string): string {
  return BOM + metaLine(meta) + NEWLINE + csv + NEWLINE
}
