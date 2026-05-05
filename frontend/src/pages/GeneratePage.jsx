import { useState, useRef } from 'react'
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
    label: 'Frontend Only',
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
]

const LEVELS = [
  { id: '1', icon: '🌱', label: 'Junior', sub: 'Heavy comments' },
  { id: '3', icon: '🚀', label: 'Senior', sub: 'Clean patterns' },
  { id: '4', icon: '🏆', label: 'Principal', sub: 'Production-grade' },
]

const SCALES = [
  { id: 'mvp',      icon: '⚡', label: 'MVP',      sub: 'Core only' },
  { id: 'standard', icon: '🏗', label: 'Standard', sub: 'Full features' },
  { id: 'enterprise',icon: '🏢',label: 'Enterprise',sub: 'Docker · CI/CD' },
]

function FileTree({ folders, activeFile, onSelect }) {
  if (!folders?.length) return null
  return (
    <div className="file-tree">
      {folders.map((folder, fi) => (
        <div key={fi} className="tree-folder">
          {folder.dir && <div className="tree-folder-name">{folder.dir || '/'}</div>}
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
        <div className="empty-state-icon">📄</div>
        <div className="empty-state-title">Select a file</div>
        <p>Click any file in the tree to view its code</p>
      </div>
    </div>
  )
  return (
    <div className="code-viewer">
      <div className="code-viewer-header">
        <span className="code-viewer-filename">{name}</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
            {code.split('\n').length} lines
          </span>
          <button className="btn btn-ghost btn-sm" onClick={onCopy}>
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

  const [urlInput,     setUrlInput]     = useState(backendUrl)
  const [description,  setDescription]  = useState('')
  const [stack,        setStack]        = useState('React + Node.js + MongoDB')
  const [features,     setFeatures]     = useState(['🔐 JWT Auth', '📊 Dashboard', '📋 CRUD Operations'])
  const [level,        setLevel]        = useState('3')
  const [scale,        setScale]        = useState('standard')

  const [loading,      setLoading]      = useState(false)
  const [loadingMsg,   setLoadingMsg]   = useState('')
  const [progress,     setProgress]     = useState({ current: 0, total: 0 })

  // Live-streaming folders — built incrementally as files arrive
  const [streamFolders, setStreamFolders] = useState([])
  const folderMapRef = useRef({})

  const [result,       setResult]       = useState(null)
  const [activeFile,   setActiveFile]   = useState('')
  const [activeCode,   setActiveCode]   = useState('')
  const [activeName,   setActiveName]   = useState('')
  const [copied,       setCopied]       = useState(false)
  const [activeTab,    setActiveTab]    = useState('files')
  const [downloading,  setDownloading]  = useState(false)

  const esRef = useRef(null)

  const toggleFeature = f =>
    setFeatures(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f])

  const generate = async () => {
    if (!description.trim()) { toast('Please describe your project', 'error'); return }
    if (!connected) { toast('Connect to your backend first', 'error'); return }

    // Reset state
    setLoading(true)
    setResult(null)
    setStreamFolders([])
    folderMapRef.current = {}
    setActiveFile(''); setActiveCode(''); setActiveName('')
    setProgress({ current: 0, total: 0 })
    setLoadingMsg('🧠 Starting generation…')

    // Close any existing SSE connection
    if (esRef.current) { esRef.current.close(); esRef.current = null }

    const params = new URLSearchParams({
      description: description.trim(), stack,
      features: features.map(f => f.replace(/^[^\s]+ /, '')).join(','),
      level, scale
    })

    const es = new EventSource(`${backendUrl}/api/generate/stream?${params}`)
    esRef.current = es

    es.addEventListener('progress', (e) => {
      const { step, total, message } = JSON.parse(e.data)
      setLoadingMsg(message)
      if (total > 0) setProgress({ current: step, total })
    })

    es.addEventListener('file', (e) => {
      const { dir, name, color, code, progress: p } = JSON.parse(e.data)
      if (p) setProgress({ current: p.current, total: p.total })

      // Build folders incrementally for live preview
      const dirKey = dir || '__root__'
      setStreamFolders(prev => {
        const next = [...prev]
        let folder = next.find(f => (f.dir || '__root__') === dirKey)
        if (!folder) {
          folder = { dir, files: [] }
          next.push(folder)
        }
        // Avoid duplicate files
        if (!folder.files.find(f => f.name === name)) {
          folder.files.push({ name, color, code })
        }
        return next
      })
    })

    es.addEventListener('complete', (e) => {
      es.close(); esRef.current = null
      const { project } = JSON.parse(e.data)
      setResult(project)
      addHistory(project)
      const fileCount = project.folders?.reduce((a, f) => a + (f.files?.length || 0), 0) || 0
      toast(`✨ ${project.projectName} generated — ${project.totalLines?.toLocaleString()} lines, ${fileCount} files!`, 'success', 6000)
      setLoading(false)
      setLoadingMsg('')
      setActiveTab('files')
      // Auto-select first file
      if (project.folders?.[0]?.files?.[0]) {
        const f = project.folders[0].files[0]
        const key = `${project.folders[0].dir}${f.name}`
        setActiveFile(key); setActiveCode(f.code); setActiveName(f.name)
      }
    })

    es.addEventListener('error', (e) => {
      es.close(); esRef.current = null
      let msg = 'Generation failed'
      try { const d = JSON.parse(e.data); msg = d.error || msg } catch {}
      toast(msg, 'error', 8000)
      setLoading(false); setLoadingMsg('')
    })

    // Fallback: if SSE connection itself errors (network issue)
    es.onerror = (err) => {
      if (es.readyState === EventSource.CLOSED) return
      es.close(); esRef.current = null
      toast('Connection to backend lost. Check that your backend is running.', 'error', 8000)
      setLoading(false); setLoadingMsg('')
    }
  }

  const handleCopy = () => {
    if (!activeCode) return
    navigator.clipboard.writeText(activeCode).then(() => {
      setCopied(true); toast('Copied!', 'success')
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
        method: 'POST', headers: { 'Content-Type': 'application/json' },
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
      (f.files || []).map(file => `// ═══ ${f.dir}${file.name} ═══\n${file.code}`)
    ).join('\n\n')
    navigator.clipboard.writeText(all).then(() => toast('All code copied!', 'success'))
  }

  // While streaming, show live folders; once complete, show result folders
  const displayFolders = result ? result.folders : streamFolders
  const totalFiles = result?.folders?.reduce((a, f) => a + (f.files?.length || 0), 0) || 0
  const progressPct = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0

  return (
    <div className="animate-fade-in-up" style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>AI-Powered Generator</div>
        <h1 className="page-title">Build Any Project</h1>
        <p className="page-subtitle">Describe your idea. Choose a stack. Get production-grade code — file by file, live.</p>
      </div>

      {/* Connect banner */}
      {!connected && (
        <div style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '1.5rem' }}>🔌</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, marginBottom: 2 }}>Connect to Backend</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Enter your backend URL (e.g. https://project-forge-backend-4t7e.onrender.com)</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flex: 1, minWidth: 260 }}>
            <input className="form-input" style={{ flex: 1 }} value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              placeholder="https://your-backend.onrender.com"
              onKeyDown={e => e.key === 'Enter' && connect(urlInput)} />
            <button className="btn btn-primary" onClick={() => connect(urlInput)} disabled={connecting}>
              {connecting ? <div className="spinner" /> : 'Connect'}
            </button>
          </div>
        </div>
      )}

      {/* Generator form */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', margin: '-1.5rem -1.5rem 1.5rem', padding: '1.25rem 1.5rem', borderRadius: 'var(--radius) var(--radius) 0 0' }}>
          <div style={{ fontWeight: 700, color: '#fff', fontSize: '1rem' }}>⚡ ProjectForge Elite Generator</div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 }}>NVIDIA NIM · DeepSeek R1 · Per-file streaming · No JSON parse failures</div>
        </div>

        {/* Description */}
        <div className="form-group">
          <label className="form-label">Project Description <span style={{ color: '#ef4444' }}>*</span></label>
          <textarea className="form-textarea" value={description} onChange={e => setDescription(e.target.value)} rows={3}
            placeholder="e.g. An event management system with venue booking, attendee registration, ticketing, and analytics dashboard" />
        </div>

        {/* Stack */}
        <div className="form-group">
          <label className="form-label">Tech Stack</label>
          {STACK_GROUPS.map(group => (
            <div key={group.label} style={{ marginBottom: '0.75rem' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{group.label}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
                {group.stacks.map(s => (
                  <div key={s.id}
                    onClick={() => setStack(s.id)}
                    style={{
                      border: `2px solid ${stack === s.id ? 'var(--primary)' : 'var(--border)'}`,
                      borderRadius: 10, padding: '0.625rem 0.875rem', cursor: 'pointer',
                      background: stack === s.id ? 'rgba(99,102,241,0.08)' : 'var(--surface)',
                      display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.15s'
                    }}>
                    <span style={{ fontSize: '1.25rem' }}>{s.icon}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="form-group">
          <label className="form-label">Features</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {FEATURES.map(f => (
              <div key={f} onClick={() => toggleFeature(f)}
                style={{
                  padding: '0.35rem 0.875rem', borderRadius: 50, cursor: 'pointer', fontSize: 13, fontWeight: 500,
                  border: `1.5px solid ${features.includes(f) ? 'var(--primary)' : 'var(--border)'}`,
                  background: features.includes(f) ? 'rgba(99,102,241,0.1)' : 'transparent',
                  color: features.includes(f) ? 'var(--primary)' : 'var(--text-muted)',
                  transition: 'all 0.15s'
                }}>{f}</div>
            ))}
          </div>
        </div>

        {/* Level + Scale */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div>
            <label className="form-label">Experience Level</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {LEVELS.map(l => (
                <div key={l.id} onClick={() => setLevel(l.id)}
                  style={{ flex: 1, textAlign: 'center', padding: '0.625rem', borderRadius: 10, cursor: 'pointer',
                    border: `2px solid ${level === l.id ? 'var(--primary)' : 'var(--border)'}`,
                    background: level === l.id ? 'rgba(99,102,241,0.08)' : 'transparent', transition: 'all 0.15s' }}>
                  <div style={{ fontSize: '1.25rem' }}>{l.icon}</div>
                  <div style={{ fontWeight: 600, fontSize: 12 }}>{l.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="form-label">Project Scale</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {SCALES.map(s => (
                <div key={s.id} onClick={() => setScale(s.id)}
                  style={{ flex: 1, textAlign: 'center', padding: '0.625rem', borderRadius: 10, cursor: 'pointer',
                    border: `2px solid ${scale === s.id ? 'var(--primary)' : 'var(--border)'}`,
                    background: scale === s.id ? 'rgba(99,102,241,0.08)' : 'transparent', transition: 'all 0.15s' }}>
                  <div style={{ fontSize: '1.25rem' }}>{s.icon}</div>
                  <div style={{ fontWeight: 600, fontSize: 12 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button className="btn btn-primary" style={{ width: '100%', padding: '0.875rem', fontSize: '1rem', justifyContent: 'center' }}
          onClick={generate} disabled={loading || !connected}>
          {loading
            ? <><div className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} />{loadingMsg || 'Generating…'}</>
            : '⚡ Generate with DeepSeek R1'
          }
        </button>
        {!connected && <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>Connect your backend above to enable generation</p>}
      </div>

      {/* Live progress + file viewer — shown while loading OR when done */}
      {(loading || result) && (
        <div className="card">
          {/* Progress bar — only while loading */}
          {loading && progress.total > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                <span>{loadingMsg}</span>
                <span>{progress.current}/{progress.total} files ({progressPct}%)</span>
              </div>
              <div style={{ background: 'var(--bg)', borderRadius: 50, height: 6, overflow: 'hidden' }}>
                <div style={{ background: 'linear-gradient(90deg, var(--primary), var(--primary-dark))', width: `${progressPct}%`, height: '100%', transition: 'width 0.3s ease', borderRadius: 50 }} />
              </div>
            </div>
          )}

          {/* Result header — only when done */}
          {result && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>🎉 {result.projectName}</h2>
                <span style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--primary)', padding: '0.2rem 0.75rem', borderRadius: 50, fontSize: 12, fontWeight: 600 }}>⚡ {result.totalLines?.toLocaleString()} lines</span>
                <span style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--accent)', padding: '0.2rem 0.75rem', borderRadius: 50, fontSize: 12, fontWeight: 600 }}>📁 {totalFiles} files</span>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: '0.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                {[['files','📁 Files'],['setup','🚀 Setup'],['insights','💡 Insights']].map(([id,label]) => (
                  <button key={id} onClick={() => setActiveTab(id)}
                    style={{ padding: '0.375rem 0.875rem', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13,
                      background: activeTab === id ? 'var(--primary)' : 'transparent',
                      color: activeTab === id ? '#fff' : 'var(--text-muted)' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* File tree + code viewer — always visible while streaming or on files tab */}
          {(!result || activeTab === 'files') && (
            <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1rem', minHeight: 400 }}>
              <div style={{ borderRight: '1px solid var(--border)', paddingRight: '1rem' }}>
                {loading && streamFolders.length === 0 && (
                  <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '1rem 0' }}>
                    <div className="spinner" style={{ marginBottom: 8 }} />
                    Waiting for first file…
                  </div>
                )}
                <FileTree folders={displayFolders} activeFile={activeFile} onSelect={handleSelectFile} />
              </div>
              <CodeViewer name={activeName} code={activeCode} onCopy={handleCopy} copied={copied} />
            </div>
          )}

          {result && activeTab === 'setup' && (
            <div>
              {(result.setupSteps || []).map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '0.875rem' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{i+1}</div>
                  <code style={{ background: 'var(--bg)', padding: '0.4rem 0.75rem', borderRadius: 6, fontSize: 13, flex: 1, lineHeight: 1.6 }}>{step}</code>
                </div>
              ))}
            </div>
          )}

          {result && activeTab === 'insights' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {(result.insights || []).map((ins, i) => (
                <div key={i} style={{ background: 'var(--bg)', borderRadius: 10, padding: '1rem', border: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>{ins.t}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: ins.b }} />
                </div>
              ))}
            </div>
          )}

          {result && (
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={downloadZip} disabled={downloading}>
                {downloading ? <div className="spinner" /> : '📦'} Download ZIP
              </button>
              <button className="btn btn-secondary" onClick={copyAllCode}>📋 Copy All Code</button>
              <button className="btn btn-ghost" onClick={() => { setResult(null); setStreamFolders([]); setDescription('') }}>🔄 New Project</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
