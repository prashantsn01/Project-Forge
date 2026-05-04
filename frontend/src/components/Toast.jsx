import { useApp } from '../context/AppContext'

const ICONS = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' }

export default function Toast() {
  const { toasts } = useApp()
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span className="toast-icon">{ICONS[t.type] || ICONS.info}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}
