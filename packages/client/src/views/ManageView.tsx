import { useState } from 'react'
import type { FormEvent } from 'react'
import '../ui.css'

/**
 * Entry form for the admin key (menu item "Manage session"); redirects to `?admin=KEY`.
 *
 * @returns {JSX.Element} Admin key form.
 */
export function ManageView() {
  const [key, setKey] = useState('')

  /**
   * Normalizes the entered key and redirects to the admin view.
   *
   * @param {FormEvent} e Form submit event.
   * @returns {void}
   */
  function handleOpen(e: FormEvent) {
    e.preventDefault()
    const k = key.trim().toUpperCase()
    if (k) window.location.search = `?admin=${encodeURIComponent(k)}`
  }

  return (
    <div className="page">
      <p className="links">
        <a href="/">← zur Sortieransicht</a>
      </p>
      <h1>Sitzung verwalten (Lehrkraft)</h1>
      <p className="muted">
        Gib den Verwaltungsschlüssel deiner Sitzung ein — den hast du beim Anlegen
        erhalten oder selbst gewählt.
      </p>
      <form className="form form--row" onSubmit={handleOpen}>
        <input
          value={key}
          onChange={(e) => setKey(e.target.value.toUpperCase())}
          placeholder="Verwaltungsschlüssel"
          aria-label="Verwaltungsschlüssel"
          autoFocus
        />
        <button type="submit">Verwaltung öffnen</button>
      </form>
      <p className="muted">
        Noch keine Sitzung? <a href="?anlegen">Sitzung anlegen</a>
      </p>
    </div>
  )
}
