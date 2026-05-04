const NAV = [
  { id: 'generate', icon: '⚡', label: 'Generate', sub: 'Build a project', section: 'MAIN' },
  { id: 'history', icon: '🗂', label: 'History', sub: 'Past projects', section: 'MAIN' },
  { id: 'git', icon: '🐙', label: 'Git Push', sub: 'Push to GitHub', section: 'TOOLS' },
  { id: 'settings', icon: '⚙️', label: 'Settings', sub: 'Configuration', section: 'TOOLS' },
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
                <div>
                  <div>{item.label}</div>
                  <div className="text-xs text-muted" style={{marginTop:1}}>{item.sub}</div>
                </div>
              </button>
            ))}
          </div>
        ))}
        <div className="sidebar-divider" />
        <div className="sidebar-footer">
          <div className="sidebar-footer-info">
            <div><strong>ProjectForge Elite</strong></div>
            <div>v5.0.0 · 85%+ accuracy</div>
            <div>Android Studio ✅ · 13 stacks</div>
            <div style={{marginTop:6}}>by <span className="author">Prashant S Nagani</span></div>
          </div>
        </div>
      </aside>
    </>
  )
}
