const NAV = [
  { id: 'generate', icon: '⚡', label: 'Generate', section: 'MAIN' },
  { id: 'history', icon: '🗂', label: 'History', section: 'MAIN' },
  { id: 'git', icon: '🐙', label: 'Git Push', section: 'TOOLS' },
  { id: 'settings', icon: '⚙️', label: 'Settings', section: 'TOOLS' },
]

export default function Sidebar({ page, onNavigate, mobileOpen, onClose }) {
  const sections = [...new Set(NAV.map(n => n.section))]

  return (
    <>
      <div className={`sidebar-overlay ${mobileOpen ? 'active' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        {sections.map(section => (
          <div key={section}>
            <div className="sidebar-section-label">{section}</div>
            {NAV.filter(n => n.section === section).map(item => (
              <button
                key={item.id}
                className={`sidebar-item ${page === item.id ? 'active' : ''}`}
                onClick={() => { onNavigate(item.id); onClose(); }}
              >
                <div className="sidebar-icon">{item.icon}</div>
                {item.label}
              </button>
            ))}
          </div>
        ))}

        <div className="sidebar-divider" />

        <div className="sidebar-footer">
          <div className="sidebar-footer-info">
            <div><strong>ProjectForge</strong></div>
            <div>Engineer Edition v4.0.0</div>
            <div style={{ marginTop: 4, color: 'var(--accent-electric)', opacity: 0.7 }}>by Prashant S Nagani</div>
          </div>
        </div>
      </aside>
    </>
  )
}
