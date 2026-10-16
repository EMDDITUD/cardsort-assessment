import { useEffect, useRef, useState } from 'react'
import qrcode from 'qrcode-generator'

/** Pixels per QR module in the generated PNG. */
const MODULE_PX = 10

/** Quiet zone around the code, in modules. */
const QUIET_MODULES = 4

/** Error-correction level of the code. */
const ERROR_CORRECTION = 'M'

/** How long the copy feedback stays visible, in ms. */
const FEEDBACK_MS = 2500

/** Outcome of the last copy attempt, shown as a short hint. */
type CopyState = 'idle' | 'done' | 'failed'

/**
 * @property {string} value Text encoded in the QR code (the student link).
 * @property {number} [displaySize] Displayed edge length in px; the generated PNG is larger
 *   regardless.
 */
interface Props {
  value: string
  displaySize?: number
}

/**
 * QR code of the student link with a button that copies it as PNG to the clipboard.
 *
 * Drawn on a `<canvas>` rather than as SVG, because only `toBlob()` yields a PNG for the
 * clipboard directly.
 *
 * @param {Props} props Component props.
 * @param {string} props.value Text encoded in the QR code.
 * @param {number} [props.displaySize=200] Displayed edge length in px.
 * @returns {JSX.Element} QR canvas with copy button and hints.
 */
export function QrCode({ value, displaySize = 200 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [copied, setCopied] = useState<CopyState>('idle')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const qr = qrcode(0, ERROR_CORRECTION) // 0 = version chosen by data length
    qr.addData(value)
    qr.make()

    const count = qr.getModuleCount()
    const size = (count + QUIET_MODULES * 2) * MODULE_PX
    canvas.width = size
    canvas.height = size

    // Not transparent: on a dark slide background the code would not scan.
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, size, size)
    ctx.fillStyle = '#000000'
    for (let row = 0; row < count; row += 1) {
      for (let col = 0; col < count; col += 1) {
        if (!qr.isDark(row, col)) continue
        ctx.fillRect(
          (col + QUIET_MODULES) * MODULE_PX,
          (row + QUIET_MODULES) * MODULE_PX,
          MODULE_PX,
          MODULE_PX,
        )
      }
    }
    setCopied('idle')
  }, [value])

  useEffect(() => () => void (timerRef.current && clearTimeout(timerRef.current)), [])

  /**
   * Shows the copy feedback and resets it after {@link FEEDBACK_MS}.
   *
   * @param {CopyState} state Outcome to show.
   * @returns {void}
   */
  function flash(state: CopyState) {
    setCopied(state)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setCopied('idle'), FEEDBACK_MS)
  }

  /**
   * Copies the canvas as PNG to the clipboard and reports the outcome via {@link flash}.
   *
   * @returns {Promise<void>}
   */
  async function handleCopy() {
    const canvas = canvasRef.current
    // Image clipboard only exists in a secure context (https/localhost), and not everywhere.
    if (!canvas || !navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
      flash('failed')
      return
    }
    try {
      // The promise goes to ClipboardItem synchronously: Safari rejects the write if an await
      // lies between the click and write().
      const png = new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error('PNG-Erzeugung fehlgeschlagen'))),
          'image/png',
        )
      })
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })])
      flash('done')
    } catch {
      flash('failed')
    }
  }

  return (
    <div className="qr">
      <canvas
        ref={canvasRef}
        className="qr__canvas"
        style={{ width: displaySize, height: displaySize }}
        role="img"
        aria-label="QR-Code zum Link für Schüler:innen"
      />
      <div className="qr__side">
        <button type="button" onClick={() => void handleCopy()}>
          QR-Code kopieren
        </button>
        {copied === 'done' && <span className="qr__hint">Als Bild kopiert.</span>}
        {copied === 'failed' && (
          <span className="qr__hint qr__hint--failed">
            Bild-Kopieren klappt in diesem Browser nicht — nutze den Link darüber.
          </span>
        )}
        <span className="muted">
          Zum Einfügen in Folien oder Arbeitsblätter. Abscannen führt direkt in die Sitzung.
        </span>
      </div>
    </div>
  )
}
