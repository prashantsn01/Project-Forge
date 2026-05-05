import { useState } from 'react'
import { useApp } from '../context/AppContext'

export default function SettingsPage() {
  const { backendUrl, connected, connect, disconnect, connecting, history, clearHistory, toast } = useApp()
  const [urlInput, setUrlInput] = useState(backendUrl)

  const handleConnect = () => connect(urlInput)

  const exportHistory = () => {
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'projectforge-history.json'; a.click()
    URL.revokeObjectURL(url)
    toast('History exported!', 'success')
  }

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <div className="page-eyebrow">Configuration</div>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your backend connection and application preferences.</p>
      </div>

      <div style={{ display: 'grid', gap: 20, maxWidth: 680 }}>
        {/* Backend */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">🔌 Backend Connection</div>
            <div className={`result-badge ${connected ? 'stack' : 'files'}`} style={{ fontSize: 11 }}>
              {connected ? '● Online' : '○ Offline'}
            </div>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Backend URL</label>
              <div className="url-input-group">
                <input
                  className="form-input"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  placeholder="http://localhost:3001"
                  onKeyDown={e => e.key === 'Enter' && handleConnect()}
                />
                <button
                  className={`btn ${connected ? 'btn-danger' : 'btn-primary'}`}
                  onClick={connected ? disconnect : handleConnect}
                  disabled={connecting}
                >
                  {connecting ? <div className="spinner" /> : connected ? 'Disconnect' : 'Connect'}
                </button>
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Setup Instructions</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  'cd backend && npm install',
                  'cp .env.example .env  # Add NVIDIA_API_KEY',
                  'npm run dev           # Starts on port 3001',
                ].map((s, i) => (
                  <div key={i} className="setup-step">
                    <div className="step-num">{i + 1}</div>
                    <div className="step-cmd">{s}</div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted" style={{ marginTop: 10 }}>
                Get a free NVIDIA NIM API key at{' '}
                <a href="https://build.nvidia.com" target="_blank" rel="noopener noreferrer"
                  style={{ color: 'var(--accent-electric)' }}>build.nvidia.com →</a>
              </p>
            </div>
          </div>
        </div>

        {/* Data */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">🗄 Local Data</div>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 600 }}>Generation History</div>
                <div className="text-sm text-secondary" style={{ marginTop: 2 }}>
                  {history.length} project{history.length !== 1 ? 's' : ''} saved locally (max 20)
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={exportHistory} disabled={history.length === 0}>
                📤 Export JSON
              </button>
              <button className="btn btn-danger btn-sm" onClick={clearHistory} disabled={history.length === 0}>
                🗑 Clear History
              </button>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">ℹ️ About ProjectForge</div>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                ['Version', 'Engineer Edition v4.0.0'],
                ['AI Engine', 'NVIDIA NIM — DeepSeek V4 Pro'],
                ['Developer', 'Prashant S Nagani'],
                ['License', 'MIT'],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="stat-label">{k}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-primary)', marginTop: 4 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
