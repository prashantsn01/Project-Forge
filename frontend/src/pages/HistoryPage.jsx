import { useApp } from '../context/AppContext'

export default function HistoryPage() {
  const { history, clearHistory, toast } = useApp()

  const copyProject = (project) => {
    const all = project.folders?.flatMap(f =>
      (f.files || []).map(file => `// ─── ${f.dir}${file.name} ───\n${file.code}`)
    ).join('\n\n') || ''
    navigator.clipboard.writeText(all).then(() => toast('Code copied!', 'success'))
  }

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    } catch { return '' }
  }

  return (
    <div className="animate-fade-in-up">
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div className="page-eyebrow">Saved Projects</div>
          <h1 className="page-title">Generation History</h1>
          <p className="page-subtitle">Your last {history.length} generated projects. Stored locally in your browser.</p>
        </div>
        {history.length > 0 && (
          <button className="btn btn-danger" onClick={clearHistory}>🗑 Clear All</button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🗂</div>
          <div className="empty-title">No projects yet</div>
          <div className="empty-sub">Generate your first project and it will appear here. Up to 20 projects are saved.</div>
        </div>
      ) : (
        <div className="history-grid stagger">
          {history.map((project, i) => {
            const totalFiles = project.folders?.reduce((a, f) => a + (f.files?.length || 0), 0) || 0
            return (
              <div key={i} className="history-card">
                <div className="history-card-name">🎯 {project.projectName || 'Unnamed Project'}</div>
                <div className="history-card-desc">{project.description || 'No description'}</div>
                <div className="history-meta" style={{ marginBottom: 12 }}>
                  <span className="result-badge stack" style={{ fontSize: 10 }}>🛠 {(project.stack || '').split(' ').slice(0, 2).join(' ')}</span>
                  <span className="result-badge lines" style={{ fontSize: 10 }}>⚡ {(project.totalLines || 0).toLocaleString()} lines</span>
                  <span className="result-badge files" style={{ fontSize: 10 }}>📁 {totalFiles} files</span>
                </div>
                <div className="history-card-footer">
                  <span className="text-xs text-muted font-mono">{formatDate(project._savedAt)}</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-sm btn-secondary" onClick={() => copyProject(project)}>📋 Copy</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
