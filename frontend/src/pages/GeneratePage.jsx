import { useState } from 'react'
import { useApp } from '../context/AppContext'

const STACK_GROUPS = [
  {
    label: 'Fullstack Web',
    stacks: [
      { id: 'React + Node.js + MongoDB', icon: '⚛️', name: 'React + Node.js', sub: 'Vite · Express · Mongo · JWT' },
      { id: 'Next.js Full-Stack', icon: '▲', name: 'Next.js 14', sub: 'App Router · Prisma · NextAuth' },
      { id: 'Vue.js + Node.js', icon: '💚', name: 'Vue 3 + Node.js', sub: 'Pinia · Express · Mongo' },
      { id: 'Angular + Node.js', icon: '🅰️', name: 'Angular + NestJS', sub: 'Standalone · TypeORM · PG' },
    ]
  },
  {
    label: 'Backend / API',
    stacks: [
      { id: 'Node.js REST API', icon: '🟢', name: 'Node.js REST API', sub: 'Express · Mongo · Swagger' },
      { id: 'Python FastAPI', icon: '🐍', name: 'Python FastAPI', sub: 'SQLAlchemy · Async · JWT' },
      { id: 'Python Django', icon: '🎸', name: 'Python Django', sub: 'DRF · PostgreSQL · SimpleJWT' },
      { id: 'Java Spring Boot', icon: '☕', name: 'Java Spring Boot', sub: 'Security · JPA · MySQL · Maven' },
    ]
  },
  {
    label: 'Frontend',
    stacks: [
      { id: 'React Frontend', icon: '🎨', name: 'React Frontend', sub: 'React Query · Zustand · Tailwind' },
      { id: 'HTML/CSS/JS Vanilla', icon: '🌐', name: 'Vanilla JS', sub: 'Zero dependencies · Pure ES6' },
    ]
  },
  {
    label: 'Mobile',
    stacks: [
      { id: 'Android Studio (Kotlin)', icon: '🤖', name: 'Android (Kotlin)', sub: 'Compose · MVVM · Hilt · Room' },
      { id: 'React Native Mobile', icon: '📱', name: 'React Native', sub: 'Expo · TypeScript · Navigation' },
      { id: 'Flutter Web App', icon: '🦋', name: 'Flutter', sub: 'Riverpod · Firebase · go_router' },
    ]
  },
]

const FEATURES = [
  '🔐 JWT Auth', '📊 Dashboard', '📋 CRUD Operations', '🔍 Search & Filter',
  '📄 Pagination', '📁 File Upload', '📧 Email Notifications', '💳 Payment Integration',
  '🐳 Docker Support', '📝 API Docs/Swagger', '🔔 Push Notifications', '📱 Responsive UI',
  '🧪 Unit Tests', '🔄 Real-time (WebSocket)', '🌍 i18n / Multilingual', '📈 Analytics',
]

const LEVELS = [
  { id: '1', icon: '🌱', label: 'Junior', sub: 'Heavy comments' },
  { id: '3', icon: '🚀', label: 'Senior', sub: 'Clean patterns' },
  { id: '4', icon: '🏆', label: 'Principal', sub: 'Production-grade' },
]

const SCALES = [
  { id: 'mvp', icon: '⚡', label: 'MVP', sub: 'Core only' },
  { id: 'standard', icon: '🏗', label: 'Standard', sub: 'Full features' },
  { id: 'enterprise', icon: '🏢', label: 'Enterprise', sub: 'Docker · CI/CD' },
]

function FileTree({ project, activeFile, onSelect }) {
  if (!project?.folders) return null
  return (
    <div className="file-tree">
      {project.folders.map((folder, fi) => (
        <div key={fi} className="tree-folder">
          {folder.dir && (
            <div className="tree-folder-name">{folder.dir || '/'}</div>
          )}
          {(folder.files || []).map((file, idx) => {
            const key = `${folder.dir}${file.name}`
            return (
              <div
                key={idx}
                className={`tree-file ${activeFile === key ? 'active' : ''}`}
                onClick={() => onSelect(key, file.code, file.name, file.color)}
              >
                <div className="tree-file-dot" style={{ background: file.color || '#9a8e7a' }} />
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
      <div className="empty-state">
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
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="text-xs text-muted text-mono">{code.split('\n').length} lines</span>
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
  const [features, setFeatures] = useState(['🔐 JWT Auth', '📊 Dashboard', '📋 CRUD Operations'])
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

  const toggleFeature = f =>
    setFeatures(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f])

  const LOADING_MSGS = [
    '🧠 DeepSeek V4 Pro — extracting domain model…',
    '⚙️ Chunk 1/6 — Writing backend core (server, models, middleware)…',
    '⚙️ Chunk 2/6 — Writing auth + full CRUD routes…',
    '⚙️ Chunk 3/6 — Building frontend foundation (App, CSS, API util)…',
    '⚙️ Chunk 4/6 — Crafting all UI components…',
    '⚙️ Chunk 5/6 — Writing all pages (Login, Dashboard, List, Form)…',
    '⚙️ Chunk 6/6 — Generating README, config & insights…',
    '🔗 Merging & validating all chunks — replacing placeholders…',
    '✅ Counting lines & finalizing your project…',
    '🚀 Almost ready — NIM can be slow, hang tight (up to 15 min)!',
  ]

  const generate = async () => {
    if (!description.trim()) { toast('Please describe your project', 'error'); return }
    if (!connected) { toast('Connect to your backend first', 'error'); return }

    setLoading(true); setResult(null)
    let msgIdx = 0; setLoadingMsg(LOADING_MSGS[0])
    const interval = setInterval(() => {
      msgIdx = (msgIdx + 1) % LOADING_MSGS.length
      setLoadingMsg(LOADING_MSGS[msgIdx])
    }, 28000) // ~28s per chunk × 6 chunks + domain call = ~4-5 min total

    try {
      const res = await fetch(`${backendUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description.trim(), stack,
          features: features.map(f => f.replace(/^[^\s]+ /, '')),
          level, commentMode, scale
        }),
        signal: AbortSignal.timeout(900000)
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Generation failed')

      const project = data.project
      setResult(project)
      addHistory(project)
      toast(`✨ ${project.projectName} generated — ${project.totalLines?.toLocaleString()} lines across ${project.folders?.reduce((a,f)=>a+(f.files?.length||0),0)} files!`, 'success', 6000)
      setActiveTab('files')

      if (project.folders?.[0]?.files?.[0]) {
        const f = project.folders[0].files[0]
        const key = `${project.folders[0].dir}${f.name}`
        setActiveFile(key); setActiveCode(f.code); setActiveName(f.name)
      }
    } catch (e) {
      const msg = e.name === 'TimeoutError' || e.message?.includes('timeout')
        ? 'Generation timed out (>15 min). Try a simpler description or MVP scale.'
        : 'Generation failed: ' + e.message
      toast(msg, 'error', 9000)
    } finally {
      clearInterval(interval); setLoading(false); setLoadingMsg('')
    }
  }

  const handleCopy = () => {
    if (!activeCode) return
    navigator.clipboard.writeText(activeCode).then(() => {
      setCopied(true); toast('Code copied to clipboard!', 'success')
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
      toast('📦 ZIP downloaded!', 'success')
    } catch (e) {
      toast('Download failed: ' + e.message, 'error')
    } finally { setDownloading(false) }
  }

  const copyAllCode = () => {
    if (!result) return
    const all = result.folders.flatMap(f =>
      (f.files||[]).map(file => `// ═══ ${f.dir}${file.name} ═══\n${file.code}`)
    ).join('\n\n')
    navigator.clipboard.writeText(all).then(() => toast('All code copied!', 'success'))
  }

  const totalFiles = result?.folders?.reduce((a,f)=>a+(f.files?.length||0),0)||0

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <div className="page-eyebrow">AI-Powered Generator</div>
        <h1 className="page-title">Build Any Project</h1>
        <p className="page-subtitle">Describe your idea. Choose a stack. Get production-grade, zero-error code in under 60 seconds.</p>
      </div>

      {!connected && (
        <div className="connect-banner">
          <div className="connect-banner-icon">🔌</div>
          <div className="connect-banner-text">
            <div className="connect-banner-title">Connect to Backend</div>
            <div className="connect-banner-sub">Enter your backend URL and click Connect to enable AI generation</div>
          </div>
          <div className="url-input-group" style={{ flex:1, minWidth:200 }}>
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
          <div className="generator-hero-title">⚡ ProjectForge Elite Generator</div>
          <div className="generator-hero-sub">Powered by NVIDIA NIM · DeepSeek V4 Pro · 95%+ accuracy · 6-chunk deep generation</div>
        </div>

        <div className="generator-body">
          {/* Description */}
          <div className="form-group">
            <label className="form-label">Project Description <span className="required">*</span></label>
            <textarea
              className="form-textarea"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. A hospital management system with patient records, doctor appointments, prescription tracking, billing module, and admin dashboard with analytics"
              rows={4}
            />
          </div>

          {/* Stack — grouped */}
          <div className="form-group">
            <label className="form-label">Tech Stack</label>
            {STACK_GROUPS.map(group => (
              <div key={group.label}>
                <div className="stack-section-header">{group.label}</div>
                <div className="stack-grid">
                  {group.stacks.map(s => (
                    <div
                      key={s.id}
                      className={`stack-card ${stack === s.id ? 'selected' : ''}`}
                      onClick={() => setStack(s.id)}
                    >
                      <div className="stack-icon">{s.icon}</div>
                      <div>
                        <div className="stack-info-name">{s.name}</div>
                        <div className="stack-info-tag">{s.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Features */}
          <div className="form-group">
            <label className="form-label">Features to Include</label>
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

          {/* Options */}
          <div className="form-row">
            <div className="form-group" style={{ marginBottom:0 }}>
              <label className="form-label">Experience Level</label>
              <div className="options-grid">
                {LEVELS.map(l => (
                  <div key={l.id} className={`option-card ${level===l.id?'selected':''}`} onClick={() => setLevel(l.id)}>
                    <div className="option-card-icon">{l.icon}</div>
                    <span className="option-card-label">{l.label}</span>
                    <span className="text-xs text-muted">{l.sub}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="form-group" style={{ marginBottom:0 }}>
              <label className="form-label">Project Scale</label>
              <div className="options-grid">
                {SCALES.map(s => (
                  <div key={s.id} className={`option-card ${scale===s.id?'selected':''}`} onClick={() => setScale(s.id)}>
                    <div className="option-card-icon">{s.icon}</div>
                    <span className="option-card-label">{s.label}</span>
                    <span className="text-xs text-muted">{s.sub}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="form-group" style={{ marginTop:24 }}>
            <label className="form-label">Comment Style</label>
            <select className="form-select" value={commentMode} onChange={e => setCommentMode(e.target.value)}>
              <option value="learning">📚 Learning — explain every line (great for beginners)</option>
              <option value="standard">🎯 Standard — key decisions only (recommended)</option>
              <option value="clean">✨ Clean — minimal, professional (senior devs)</option>
            </select>
          </div>

          <div style={{ marginTop:32 }}>
            <button
              className="btn btn-generate"
              onClick={generate}
              disabled={loading || !connected}
            >
              {loading ? (
                <><div className="spinner" />{loadingMsg}</>
              ) : (
                <>⚡ Generate with DeepSeek V4 Pro</>
              )}
            </button>
            {!connected && (
              <p className="text-xs text-muted" style={{ textAlign:'center', marginTop:10 }}>
                Connect your backend above to enable generation
              </p>
            )}
          </div>
        </div>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="result-panel" style={{ marginTop:24 }}>
          <div className="loading-overlay">
            <div className="spinner spinner-dark spinner-lg" />
            <div className="loading-text">{loadingMsg}</div>
            <div className="loading-progress">
              <div className="loading-progress-bar" />
            </div>
            <div className="text-xs text-muted">Large projects may take up to 90 seconds — please wait</div>
          </div>
        </div>
      )}

      {/* RESULT */}
      {result && !loading && (
        <div className="result-panel">
          <div className="result-header">
            <div style={{ flex:1 }}>
              <div className="result-title">🎉 {result.projectName}</div>
              <div className="result-meta">
                <span className="result-badge lines">⚡ {result.totalLines?.toLocaleString()} lines</span>
                <span className="result-badge files">📁 {totalFiles} files</span>
                <span className="result-badge stack">🛠 {result.stack}</span>
              </div>
              {result.description && (
                <p style={{ marginTop:10, fontSize:13.5, color:'var(--ink-secondary)', lineHeight:1.6 }}>{result.description}</p>
              )}
            </div>
          </div>

          <div className="tabs">
            {[['files','📁 Files'],['setup','🚀 Setup'],['insights','💡 Insights']].map(([id,label]) => (
              <button key={id} className={`tab ${activeTab===id?'active':''}`} onClick={() => setActiveTab(id)}>
                {label}
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
              {(result.setupSteps||[]).map((step,i) => (
                <div key={i} className="setup-step">
                  <div className="step-num">{i+1}</div>
                  <div className="step-cmd">{step}</div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="insights-grid">
              {(result.insights||[]).map((ins,i) => (
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
            <button className="btn btn-secondary" onClick={copyAllCode}>📋 Copy All Code</button>
            <button className="btn btn-ghost" onClick={() => { setResult(null); setDescription('') }}>🔄 New Project</button>
          </div>
        </div>
      )}
    </div>
  )
}
