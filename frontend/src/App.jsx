import { useState } from 'react'
import { AppProvider } from './context/AppContext'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import Toast from './components/Toast'
import GeneratePage from './pages/GeneratePage'
import HistoryPage from './pages/HistoryPage'
import GitPage from './pages/GitPage'
import SettingsPage from './pages/SettingsPage'

function AppShell() {
  const [page, setPage] = useState('generate')
  const [menuOpen, setMenuOpen] = useState(false)

  const PAGES = {
    generate: <GeneratePage />,
    history: <HistoryPage />,
    git: <GitPage />,
    settings: <SettingsPage />,
  }

  return (
    <div className="app-layout">
      <Navbar onMenuToggle={() => setMenuOpen(o => !o)} />
      <Sidebar
        page={page}
        onNavigate={setPage}
        mobileOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
      />
      <main className="main-content">
        {PAGES[page] || <GeneratePage />}
      </main>
      <Toast />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  )
}
