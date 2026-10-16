import { useState } from 'react'
import type { FormEvent } from 'react'
import '../ui.css'
import { getSession, ApiError } from '../lib/api'

/**
 * Entry form for the session key (students, menu item "Join session"); checks the key with the
 * server before redirecting to `?session=KEY`.
 *
 * @returns {JSX.Element} Join form with error message.
 */
export function JoinView() {
  const [joinKey, setJoinKey] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  /**
   * Normalizes the entered key, verifies it and redirects; shows an error for unknown keys or
   * failed requests.
   *
   * @param {FormEvent} e Form submit event.
   * @returns {Promise<void>}
   */
  async function handleJoin(e: FormEvent) {
    e.preventDefault()
    const key = joinKey.trim().toUpperCase()
    if (!key) return
    setError(null)
    setLoading(true)
    try {
      await getSession(key)
      window.location.search = `?session=${encodeURIComponent(key)}`
      // No setLoading(false): the page is reloading.
    } catch (err) {
      // Network errors surface from `fetch` as TypeError, not as ApiError.
      const unknownSession = err instanceof ApiError && err.status === 404
      setError(
        unknownSession
          ? 'Diesen Sitzungs-Schlüssel gibt es nicht. Bitte noch einmal prüfen.'
          : 'Prüfung fehlgeschlagen. Verbindung prüfen.',
      )
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <p className="links">
        <a href="/">← zur Sortieransicht</a>
      </p>
      <h1>Sitzung beitreten</h1>
      <p className="muted">
        Gib den Sitzungs-Schlüssel ein, den du von deiner Lehrkraft bekommen hast.
      </p>
      <form className="form form--row" onSubmit={handleJoin}>
        <input
          value={joinKey}
          onChange={(e) => {
            setJoinKey(e.target.value.toUpperCase())
            setError(null)
          }}
          placeholder="z. B. A6BW6Y"
          aria-label="Sitzungs-Schlüssel"
          autoFocus
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Prüfe…' : 'Beitreten'}
        </button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  )
}
