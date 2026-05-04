import { useState } from 'react'
import { useApp } from '../context/AppContext'

const STACKS = [
  { id: 'React + Node.js + MongoDB', icon: '⚛️', name: 'React + Node.js', tag: 'Fullstack' },
  { id: 'Next.js Full-Stack', icon: '▲', name: 'Next.js 14', tag: 'Fullstack' },
  { id: 'Vue.js + Node.js', icon: '💚', name: 'Vue 3 + Node.js', tag: 'Fullstack' },
  { id: 'Angular + Node.js', icon: '🅰️', name: 'Angular + NestJS', tag: 'Fullstack' },
  { id: 'Node.js REST API', icon: '🟢', name: 'Node.js REST API', tag: 'Backend' },
  { id: 'Python FastAPI', icon: '🐍', name: 'Python FastAPI', tag: 'Backend' },
  { id: 'Python Django', icon: '🎸', name: 'Python Django', tag: 'Backend' },
  { id: 'Java Spring Boot', icon: '☕', name: 'Java Spring Boot', tag: 'Backend' },
  { id: 'React Frontend', icon: '🎨', name: 'React Frontend', tag: 'Frontend' },
  { id: 'HTML/CSS/JS Vanilla', icon: '🌐', name: 'Vanilla JS', tag: 'Frontend' },
  { id: 'Flutter Web App', icon: '🦋', name: 'Flutter Web', tag: 'Mobile' },
  { id: 'React Native Mobile', icon: '📱', name: 'React Native', tag: 'Mobile' },
]

const FEATURES = [
  '🔐 JWT Auth', '📊 Dashboard', '📋 CRUD', '🔍 Search & Filter',
  '📄 Pagination', '📁 File Upload', '📧 Email Integration', '💳 Payments',
  '🐳 Docker', '📝 Swagger Docs', '🔔 Notifications', '📱 Responsive',
]

const LEVELS = [
  { id: '1', icon: '🌱', label: 'Junior' },
  { id: '3', icon: '🚀', label: 'Senior' },
  { id: '4', icon: '🏆', label: 'Principal' },
]

const SCALES = [
  { id: 'mvp', icon: '⚡', label: 'MVP' },
  { id: 'standard', icon: '🏗', label: 'Standard' },
  { id: 'enterprise', icon: '🏢', label: 'Enterprise' },
]

function FileTree({ project, activeFile, onSelect }) {
  if (!project?.folders) return null
  let fileCount = 0
  return (
    <div className="file-tree">
      {project.folders.map((folder, fi) => (
        <div key={fi} className="tree-folder">
          {folder.dir && (
            <div className="tree-folder-name">
              <span>{folder.dir || 'root'}</span>
            </div>
          )}
          {(folder.files || []).map((file, idx) => {
            const key = `${folder.dir}${file.name}`
            fileCount++
            return (
              <div
                key={idx}
                className={`tree-file ${activeFile === key ? 'active' : ''}`}
                onClick={() => onSelect(key, file.code, file.name, file.color)}
              >
                <div className="tree-file-dot" style={{ background: file.color || '#8ba3c0' }} />
                <span className="tree-file-name">{file.name}</span>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

function CodeViewer({ name, code, onCopy, copied }) {
  if (!code) return (
    <div className="code-viewer">
      <div className="empty-state" style={{ padding: '40px' }}>
        <div className="empty-icon">📄</div>
        <div className="empty-title">Select a file</div>
        <div className="empty-sub">Click any file in the tree to view its code</div>
      </div>
    </div>
  )
  return (
    <div className="code-viewer">
      <div className="code-viewer-header">
        <span className="code-viewer-filename">{name}</span>
        <div className="code-viewer-actions">
          <button className="btn btn-sm btn-ghost" onClick={onCopy}>
            {copied ? '✅ Copied' : '📋 Copy'}
          </button>
        </div>
      </div>
      <pre className="code-pre">{code}</pre>
    </div>
  )
}

export default function GeneratePage() {
  const { backendUrl, connected, connect, connecting, toast, addHistory } = useApp()

  const [urlInput, setUrlInput] = useState(backendUrl)
  const [description, setDescription] = useState('')
  const [stack, setStack] = useState('React + Node.js + MongoDB')
  const [features, setFeatures] = useState(['🔐 JWT Auth', '📊 Dashboard', '📋 CRUD'])
  const [level, setLevel] = useState('3')
  const [scale, setScale] = useState('standard')
  const [commentMode, setCommentMode] = useState('standard')

  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [result, setResult] = useState(null)
  const [activeFile, setActiveFile] = useState('')
  const [activeCode, setActiveCode] = useState('')
  const [activeName, setActiveName] = useState('')
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState('files')
  const [downloading, setDownloading] = useState(false)

  const toggleFeature = (f) => {
    setFeatures(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f])
  }

  const LOADING_MESSAGES = [
    'Analyzing your requirements…',
    'Designing architecture…',
    'Generating production code…',
    'Building file structure…',
    'Finalizing project…',
  ]

  const generate = async () => {
    if (!description.trim()) { toast('Please describe your project', 'error'); return }
    if (!connected) { toast('Connect to backend first', 'error'); return }

    setLoading(true)
    setResult(null)
    let msgIdx = 0
    setLoadingMsg(LOADING_MESSAGES[0])
    const interval = setInterval(() => {
      msgIdx = (msgIdx + 1) % LOADING_MESSAGES.length
      setLoadingMsg(LOADING_MESSAGES[msgIdx])
    }, 2000)

    try {
      const res = await fetch(`${backendUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description.trim(),
          stack, features: features.map(f => f.replace(/^[^\s]+ /, '')),
          level, commentMode, scale
        }),
        signal: AbortSignal.timeout(120000)
      })

      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Generation failed')

      const project = data.project
      setResult(project)
      addHistory(project)
      toast(`✨ ${project.projectName} generated — ${project.totalLines} lines!`, 'success', 5000)
      setActiveTab('files')

      // Auto-select first file
      if (project.folders?.[0]?.files?.[0]) {
        const f = project.folders[0].files[0]
        const key = `${project.folders[0].dir}${f.name}`
        setActiveFile(key); setActiveCode(f.code); setActiveName(f.name)
      }
    } catch (e) {
      toast('Generation failed: ' + e.message, 'error', 6000)
    } finally {
      clearInterval(interval)
      setLoading(false)
      setLoadingMsg('')
    }
  }

  const handleCopy = () => {
    if (!activeCode) return
    navigator.clipboard.writeText(activeCode).then(() => {
      setCopied(true)
      toast('Code copied!', 'success')
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleSelectFile = (key, code, name) => {
    setActiveFile(key); setActiveCode(code); setActiveName(name)
  }

  const downloadZip = async () => {
    if (!result) return
    setDownloading(true)
    try {
      const res = await fetch(`${backendUrl}/api/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: result })
      })
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `${result.projectName || 'project'}.zip`; a.click()
      URL.revokeObjectURL(url)
      toast('ZIP downloaded!', 'success')
    } catch (e) {
      toast('Download failed: ' + e.message, 'error')
    } finally {
      setDownloading(false)
    }
  }

  const copyAllCode = () => {
    if (!result) return
    const all = result.folders.flatMap(f =>
      (f.files || []).map(file => `// ─── ${f.dir}${file.name} ───\n${file.code}`)
    ).join('\n\n')
    navigator.clipboard.writeText(all).then(() => toast('All code copied!', 'success'))
  }

  const totalFiles = result?.folders?.reduce((a, f) => a + (f.files?.length || 0), 0) || 0

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <div className="page-eyebrow">AI-Powered Generator</div>
        <h1 className="page-title">Build Any Project</h1>
        <p className="page-subtitle">Describe your idea. Choose a stack. Get production-grade code in seconds.</p>
      </div>

      {!connected && (
        <div className="connect-banner">
          <div className="connect-banner-icon">🔌</div>
          <div className="connect-banner-text">
            <div className="connect-banner-title">Connect to Backend</div>
            <div className="connect-banner-sub">Enter your backend URL and click Connect to enable AI generation</div>
          </div>
          <div className="url-input-group" style={{ flex: 1, minWidth: 200 }}>
            <input
              className="form-input"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              placeholder="http://localhost:3001"
              onKeyDown={e => e.key === 'Enter' && connect(urlInput)}
            />
            <button className="btn btn-primary" onClick={() => connect(urlInput)} disabled={connecting}>
              {connecting ? <div className="spinner" /> : 'Connect'}
            </button>
          </div>
        </div>
      )}

      <div className="generator-card">
        <div className="generator-hero">
          <div className="generator-hero-title">⚡ ProjectForge Generator</div>
          <div className="generator-hero-sub">Powered by Groq AI + LLaMA 3.3 70B — the fastest AI inference on earth</div>
        </div>

        <div className="generator-body">
          {/* Description */}
          <div className="form-group">
            <label className="form-label">Project Description <span className="required">*</span></label>
            <textarea
              className="form-textarea"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. A hospital management system with patient records, appointment scheduling, doctor portal, billing, and admin dashboard"
              rows={4}
            />
          </div>

          {/* Stack */}
          <div className="form-group">
            <label className="form-label">Tech Stack</label>
            <div className="stack-grid">
              {STACKS.map(s => (
                <div
                  key={s.id}
                  className={`stack-card ${stack === s.id ? 'selected' : ''}`}
                  onClick={() => setStack(s.id)}
                >
                  <div className="stack-icon">{s.icon}</div>
                  <div>
                    <div className="stack-info-name">{s.name}</div>
                    <div className="stack-info-tag">{s.tag}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="form-group">
            <label className="form-label">Features</label>
            <div className="feature-grid">
              {FEATURES.map(f => (
                <div
                  key={f}
                  className={`feature-chip ${features.includes(f) ? 'selected' : ''}`}
                  onClick={() => toggleFeature(f)}
                >
                  <div className="chip-check">{features.includes(f) ? '✓' : ''}</div>
                  {f}
                </div>
              ))}
            </div>
          </div>

          {/* Options Row */}
          <div className="form-row">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Experience Level</label>
              <div className="options-grid">
                {LEVELS.map(l => (
                  <div
                    key={l.id}
                    className={`option-card ${level === l.id ? 'selected' : ''}`}
                    onClick={() => setLevel(l.id)}
                  >
                    <div className="option-card-icon">{l.icon}</div>
                    <span className="option-card-label">{l.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Project Scale</label>
              <div className="options-grid">
                {SCALES.map(s => (
                  <div
                    key={s.id}
                    className={`option-card ${scale === s.id ? 'selected' : ''}`}
                    onClick={() => setScale(s.id)}
                  >
                    <div className="option-card-icon">{s.icon}</div>
                    <span className="option-card-label">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 24 }}>
            <label className="form-label">Comment Style</label>
            <select className="form-select" value={commentMode} onChange={e => setCommentMode(e.target.value)}>
              <option value="learning">📚 Learning — explain every line</option>
              <option value="standard">🎯 Standard — key decisions only</option>
              <option value="clean">✨ Clean — minimal, professional</option>
            </select>
          </div>

          <div style={{ marginTop: 32 }}>
            <button
              className="btn btn-generate"
              onClick={generate}
              disabled={loading || !connected}
            >
              {loading ? (
                <>
                  <div className="spinner" />
                  {loadingMsg}
                </>
              ) : (
                <>⚡ Generate with Groq AI</>
              )}
            </button>
            {!connected && (
              <p className="text-xs text-muted" style={{ textAlign: 'center', marginTop: 10 }}>
                Connect your backend above to enable generation
              </p>
            )}
          </div>
        </div>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="result-panel" style={{ marginTop: 24 }}>
          <div className="loading-overlay">
            <div className="spinner spinner-lg" />
            <div className="loading-text">{loadingMsg}</div>
            <div className="loading-progress">
              <div className="loading-progress-bar" />
            </div>
            <div className="text-xs text-muted">This may take up to 60 seconds for large projects</div>
          </div>
        </div>
      )}

      {/* RESULT */}
      {result && !loading && (
        <div className="result-panel">
          <div className="result-header">
            <div style={{ flex: 1 }}>
              <div className="result-title">🎉 {result.projectName}</div>
              <div className="result-meta">
                <span className="result-badge lines">⚡ {result.totalLines?.toLocaleString()} lines</span>
                <span className="result-badge files">📁 {totalFiles} files</span>
                <span className="result-badge stack">🛠 {result.stack}</span>
              </div>
              {result.description && (
                <p style={{ marginTop: 8, fontSize: 13, color: 'var(--text-secondary)' }}>{result.description}</p>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="tabs">
            {['files', 'setup', 'insights'].map(tab => (
              <button
                key={tab}
                className={`tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'files' ? '📁 Files' : tab === 'setup' ? '🚀 Setup' : '💡 Insights'}
              </button>
            ))}
          </div>

          {activeTab === 'files' && (
            <div className="result-body">
              <FileTree project={result} activeFile={activeFile} onSelect={handleSelectFile} />
              <CodeViewer name={activeName} code={activeCode} onCopy={handleCopy} copied={copied} />
            </div>
          )}

          {activeTab === 'setup' && (
            <div className="setup-steps">
              <div className="setup-steps-title">🚀 Setup Instructions</div>
              {(result.setupSteps || []).map((step, i) => (
                <div key={i} className="setup-step">
                  <div className="step-num">{i + 1}</div>
                  <div className="step-cmd">{step}</div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="insights-grid">
              {(result.insights || []).map((ins, i) => (
                <div key={i} className="insight-card">
                  <div className="insight-title">{ins.t}</div>
                  <div className="insight-body" dangerouslySetInnerHTML={{ __html: ins.b }} />
                </div>
              ))}
            </div>
          )}

          <div className="result-actions">
            <button className="btn btn-primary" onClick={downloadZip} disabled={downloading}>
              {downloading ? <div className="spinner" /> : '📦'} Download ZIP
            </button>
            <button className="btn btn-secondary" onClick={copyAllCode}>
              📋 Copy All Code
            </button>
            <button className="btn btn-ghost" onClick={() => { setResult(null); setDescription('') }}>
              🔄 New Project
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
