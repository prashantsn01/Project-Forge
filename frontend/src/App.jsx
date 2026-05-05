import { useState, useEffect } from 'react'
import { AppProvider } from './context/AppContext'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import Toast from './components/Toast'
import GeneratePage from './pages/GeneratePage'
import HistoryPage from './pages/HistoryPage'
import GitPage from './pages/GitPage'
import SettingsPage from './pages/SettingsPage'

function useCursor() {
  useEffect(() => {
    const dot  = document.createElement('div')
    const ring = document.createElement('div')
    dot.className  = 'cursor-dot'
    ring.className = 'cursor-ring'
    document.body.appendChild(dot)
    document.body.appendChild(ring)

    let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0, raf

    const onMove = (e) => {
      mouseX = e.clientX; mouseY = e.clientY
      dot.style.left = mouseX + 'px'; dot.style.top = mouseY + 'px'
    }
    const lerp = (a, b, t) => a + (b - a) * t
    const tick = () => {
      ringX = lerp(ringX, mouseX, 0.1); ringY = lerp(ringY, mouseY, 0.1)
      ring.style.left = ringX + 'px'; ring.style.top = ringY + 'px'
      raf = requestAnimationFrame(tick)
    }
    tick()

    const onEnter = () => { dot.classList.add('hovering'); ring.classList.add('hovering') }
    const onLeave = () => { dot.classList.remove('hovering'); ring.classList.remove('hovering') }
    const onDown  = () => dot.classList.add('clicking')
    const onUp    = () => dot.classList.remove('clicking')

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('mouseup', onUp)

    const attachHover = () => {
      document.querySelectorAll('button, a, .stack-card, .feature-chip, .option-card, .tree-file, .tab, .history-card, .insight-card').forEach(el => {
        el.addEventListener('mouseenter', onEnter)
        el.addEventListener('mouseleave', onLeave)
      })
    }
    attachHover()
    const obs = new MutationObserver(attachHover)
    obs.observe(document.body, { childList: true, subtree: true })

    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('mouseup', onUp)
      obs.disconnect()
      if (dot.parentNode) dot.remove()
      if (ring.parentNode) ring.remove()
    }
  }, [])
}

function AppShell() {
  const [page, setPage] = useState('generate')
  const [menuOpen, setMenuOpen] = useState(false)
  useCursor()

  const PAGES = {
    generate: <GeneratePage />,
    history:  <HistoryPage />,
    git:      <GitPage />,
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
