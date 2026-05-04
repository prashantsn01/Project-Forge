import { useApp } from '../context/AppContext'

export default function Toast() {
  const { toasts } = useApp()
  if (!toasts?.length) return null
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast-item ${t.type || 'info'}`}>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}
