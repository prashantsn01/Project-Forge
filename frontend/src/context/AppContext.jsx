import { createContext, useContext, useState, useCallback, useRef } from 'react'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [backendUrl, setBackendUrl] = useState(() => localStorage.getItem('pf_url') || 'http://localhost:3001')
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pf_history') || '[]') } catch { return [] }
  })
  const [toasts, setToasts] = useState([])
  const toastIdRef = useRef(0)

  const toast = useCallback((message, type = 'info', duration = 3500) => {
    const id = ++toastIdRef.current
    setToasts(t => [...t, { id, message, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), duration)
  }, [])

  const connect = useCallback(async (url) => {
    const target = (url || backendUrl).replace(/\/$/, '')
    setConnecting(true)
    try {
      const res = await fetch(`${target}/api/health`, { signal: AbortSignal.timeout(5000) })
      if (!res.ok) throw new Error('Server returned ' + res.status)
      const data = await res.json()
      setBackendUrl(target)
      localStorage.setItem('pf_url', target)
      setConnected(true)
      toast(`Connected to ${data.engine || 'backend'} ✓`, 'success')
      return true
    } catch (e) {
      setConnected(false)
      toast('Cannot reach backend: ' + e.message, 'error')
      return false
    } finally {
      setConnecting(false)
    }
  }, [backendUrl, toast])

  const disconnect = useCallback(() => {
    setConnected(false)
    toast('Disconnected', 'info')
  }, [toast])

  const addHistory = useCallback((project) => {
    setHistory(prev => {
      const next = [{ ...project, _savedAt: new Date().toISOString() }, ...prev].slice(0, 20)
      localStorage.setItem('pf_history', JSON.stringify(next))
      return next
    })
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
    localStorage.removeItem('pf_history')
    toast('History cleared', 'info')
  }, [toast])

  return (
    <AppContext.Provider value={{
      backendUrl, setBackendUrl,
      connected, connecting,
      connect, disconnect,
      history, addHistory, clearHistory,
      toast, toasts
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
