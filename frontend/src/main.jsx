import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

function CursorController() {
  useEffect(() => {
    const dot  = document.createElement('div')
    const ring = document.createElement('div')
    dot.className  = 'cursor-dot'
    ring.className = 'cursor-ring'
    document.body.appendChild(dot)
    document.body.appendChild(ring)

    let mouseX = 0, mouseY = 0
    let ringX  = 0, ringY  = 0
    let raf

    const onMove = (e) => {
      mouseX = e.clientX
      mouseY = e.clientY
      dot.style.left = mouseX + 'px'
      dot.style.top  = mouseY + 'px'
    }

    const lerp = (a, b, t) => a + (b - a) * t
    const animate = () => {
      ringX = lerp(ringX, mouseX, 0.1)
      ringY = lerp(ringY, mouseY, 0.1)
      ring.style.left = ringX + 'px'
      ring.style.top  = ringY + 'px'
      raf = requestAnimationFrame(animate)
    }
    animate()

    const onEnter = () => { dot.classList.add('hovering'); ring.classList.add('hovering') }
    const onLeave = () => { dot.classList.remove('hovering'); ring.classList.remove('hovering') }
    const onDown  = () => dot.classList.add('clicking')
    const onUp    = () => dot.classList.remove('clicking')

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('mouseup',   onUp)

    const addHover = () => {
      document.querySelectorAll('button,a,[class*="card"],[class*="chip"],[class*="stack-card"],[class*="option-card"],[class*="tree-file"],[class*="tab"]').forEach(el => {
        el.addEventListener('mouseenter', onEnter)
        el.addEventListener('mouseleave', onLeave)
      })
    }
    addHover()
    const observer = new MutationObserver(addHover)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('mouseup',   onUp)
      observer.disconnect()
      dot.remove(); ring.remove()
    }
  }, [])
  return null
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CursorController />
    <App />
  </StrictMode>,
)
