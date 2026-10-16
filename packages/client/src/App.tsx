import { SortingView } from './views/SortingView'
import { TeacherView } from './views/TeacherView'
import { JoinView } from './views/JoinView'
import { ManageView } from './views/ManageView'
import { AdminView } from './views/AdminView'
import { MasterView } from './views/MasterView'
import { LegalView } from './views/LegalView'
import { DevSeedButton } from './DevSeedButton'
import { LanguageProvider } from './lib/i18n'
import { DEFAULT_SESSION_KEY } from '@sortiertool/shared/constants'

/**
 * Application root and URL switch: picks the view from the query parameters (`?master`,
 * `?admin`, `?anlegen`, `?beitreten`, `?verwalten`, `?impressum`, `?datenschutz`), falling back
 * to the sorting view for `?session` or the default session.
 *
 * @returns {JSX.Element} The selected view inside the {@link LanguageProvider}.
 */
function App() {
  const params = new URLSearchParams(window.location.search)
  const masterToken = params.get('master')
  const adminKey = params.get('admin')
  // The server compares `session_key` case-sensitively (unlike the admin key).
  const sessionKey = params.get('session')?.trim().toUpperCase() || null

  let view
  if (masterToken) view = <MasterView masterToken={masterToken} />
  else if (adminKey) view = <AdminView adminKey={adminKey} />
  else if (params.has('anlegen')) view = <TeacherView />
  else if (params.has('beitreten')) view = <JoinView />
  else if (params.has('verwalten')) view = <ManageView />
  else if (params.has('impressum')) view = <LegalView section="impressum" />
  else if (params.has('datenschutz')) view = <LegalView section="datenschutz" />
  else view = <SortingView sessionKey={sessionKey ?? DEFAULT_SESSION_KEY} />

  return (
    <LanguageProvider>
      {view}
      {import.meta.env.DEV && <DevSeedButton />}
    </LanguageProvider>
  )
}

export default App
