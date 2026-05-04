import { useApp } from '../context/AppContext'

export default function Navbar({ onMenuToggle }) {
  const { connected, connecting, backendUrl, connect, disconnect } = useApp()

  return (
    <nav className="navbar">
      <button className="menu-toggle" onClick={onMenuToggle} aria-label="Menu">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      <a href="#" className="navbar-brand">
        <div className="brand-icon">⚡</div>
        <span className="brand-name">ProjectForge</span>
        <span className="brand-badge hide-mobile">Elite v5</span>
      </a>

      <div className="navbar-spacer" />

      <div className="navbar-status">
        <div className={`status-dot ${connected ? '' : 'offline'}`} />
        <span className="hide-mobile">{connected ? 'AI Ready' : 'Not Connected'}</span>
      </div>

      {connected ? (
        <button className="navbar-btn" onClick={disconnect}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
          <span className="hide-mobile">Disconnect</span>
        </button>
      ) : (
        <button className="navbar-btn" onClick={() => connect(backendUrl)} disabled={connecting}>
          {connecting ? <div className="spinner spinner-dark" style={{width:14,height:14,borderWidth:1.5}} /> : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          )}
          <span className="hide-mobile">{connecting ? 'Connecting…' : 'Connect'}</span>
        </button>
      )}
    </nav>
  )
}
