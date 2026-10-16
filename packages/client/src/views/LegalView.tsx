import { useEffect } from 'react'
import { SOURCE_URL } from '../lib/config'
import '../ui.css'

/**
 * Imprint and privacy policy on one page (`?impressum`); `?datenschutz` scrolls to the privacy
 * section.
 *
 * @param {object} props Component props.
 * @param {'impressum' | 'datenschutz'} props.section Section to show first.
 * @returns {JSX.Element} Legal page.
 */
export function LegalView({ section }: { section: 'impressum' | 'datenschutz' }) {
  useEffect(() => {
    if (section === 'datenschutz') {
      document.getElementById('datenschutz')?.scrollIntoView()
    }
  }, [section])

  const siteUrl = window.location.origin

  return (
    <div className="page legal">
      <p className="links">
        <a href="/">← zur Sortieransicht</a>
      </p>

      <h1 id="impressum">Impressum</h1>
      <p>
        Es gilt das{' '}
        <a href="https://tu-dresden.de/impressum" target="_blank" rel="noreferrer">
          Impressum der TU Dresden
        </a>{' '}
        mit folgenden Abweichungen:
      </p>

      <h2>Verantwortlichkeiten</h2>
      <p>Bei inhaltlichen Fragen wenden Sie sich bitte an:</p>
      <address>
        Erik Marx
        <br />
        Technische Universität Dresden
        <br />
        01062 Dresden
        <br />
        E-Mail: <a href="mailto:erik.marx@tu-dresden.de">erik.marx@tu-dresden.de</a>
        <br />
        Telefon: +49 351 463-38508
      </address>

      <h2>Lizenz und Quellcode</h2>
      <p>
        Das ML-Sortiertool ist freie Software unter der{' '}
        <a href="https://www.gnu.org/licenses/agpl-3.0.html" target="_blank" rel="noreferrer">
          GNU Affero General Public License
        </a>{' '}
        (Version 3 oder später). Der Quellcode ist öffentlich verfügbar:{' '}
        <a href={SOURCE_URL} target="_blank" rel="noreferrer">
          {SOURCE_URL}
        </a>
        . Kartentexte und -bilder stehen unter{' '}
        <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">
          CC BY 4.0
        </a>
        .
      </p>

      <h1 id="datenschutz" className="legal__next">
        Datenschutzerklärung
      </h1>
      <p>
        Die TU Dresden verarbeitet im Rahmen der Nutzung des öffentlich zugänglichen
        Webangebots ({siteUrl}) personenbezogene bzw. pseudonyme Daten wie folgt:
      </p>
      <p>
        Bei der Nutzung des Sortierlegetools werden auf dem Endgerät der Nutzer:in lokal
        folgende Daten gespeichert:
      </p>
      <ul>
        <li>
          ein zufällig erzeugtes Kennzeichen, das eine erneute Zuordnung von Abgaben zum
          selben Gerät innerhalb einer Sitzung ermöglicht. Es handelt sich nicht um ein
          Cookie und wird nicht zur Nachverfolgung über die Nutzung des Tools hinaus
          verwendet.
        </li>
      </ul>
      <p>Serverseitig werden je Sitzung folgende Daten gespeichert:</p>
      <ul>
        <li>das Ergebnis der Kartensortierung (Platzierung und Gruppierung der Karten)</li>
        <li>das oben genannte, pseudonyme Kennzeichen</li>
        <li>von der Lehrkraft bei Einrichtung der Sitzung angegebene Kontextdaten</li>
        <li>technische Zeitstempel</li>
      </ul>
      <p>Die Zuordnung von Abgaben erfolgt ausschließlich pseudonym.</p>

      <h2>Rechtsgrundlage</h2>
      <p>Rechtsgrundlage hierfür ist Art. 6 Abs. 1 lit. f DSGVO.</p>

      <h2>Rechte betroffener Personen</h2>
      <ul>
        <li>
          Sie haben das Recht, von der TU Dresden Auskunft über die zu Ihrer Person
          gespeicherten Daten zu erhalten und/oder unrichtig gespeicherte Daten berichtigen
          zu lassen.
        </li>
        <li>
          Sie haben das Recht auf Löschung oder auf Einschränkung der Verarbeitung oder ein
          Widerspruchsrecht gegen die Verarbeitung.
        </li>
        <li>
          Sie können sich jederzeit an den Datenschutzbeauftragten der TU Dresden wenden:
          <address>
            Technische Universität Dresden
            <br />
            Datenschutzbeauftragter
            <br />
            01062 Dresden
            <br />
            Tel.: +49 (0) 351 463 32839
            <br />
            Fax: +49 (0) 351 463 39718
            <br />
            E-Mail:{' '}
            <a href="mailto:informationssicherheit@tu-dresden.de">
              informationssicherheit@tu-dresden.de
            </a>
            <br />
            <a
              href="https://tu-dresden.de/informationssicherheit"
              target="_blank"
              rel="noreferrer"
            >
              https://tu-dresden.de/informationssicherheit
            </a>
          </address>
        </li>
        <li>
          Sie haben weiterhin das Recht auf Beschwerde bei einer Aufsichtsbehörde, wenn Sie
          der Ansicht sind, dass die Verarbeitung der Sie betreffenden personenbezogenen
          Daten gegen die Rechtsvorschriften verstößt. Die zuständige Aufsichtsbehörde für
          den Datenschutz ist:
          <address>
            Sächsische Datenschutz- und Transparenzbeauftragte
            <br />
            Frau Dr. Juliane Hundert
            <br />
            Postfach 11 01 32
            <br />
            01330 Dresden
            <br />
            E-Mail: <a href="mailto:post@sdtb.sachsen.de">post@sdtb.sachsen.de</a>
            <br />
            Telefon: +49 (0) 351 85471 101
            <br />
            <a href="https://www.datenschutz.sachsen.de" target="_blank" rel="noreferrer">
              www.datenschutz.sachsen.de
            </a>
          </address>
        </li>
      </ul>
    </div>
  )
}
