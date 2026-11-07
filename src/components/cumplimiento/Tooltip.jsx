import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * Tooltip ligero, accesible con teclado y portalizado a body para que no lo
 * recorte el overflow de la tabla. Aparece con hover o foco.
 */
export default function Tooltip({ content, children, className = '', width = 'w-72' }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0, below: false })
  const ref = useRef(null)

  const show = () => {
    const el = ref.current
    if (!el || !content) return
    const rect = el.getBoundingClientRect()
    const below = rect.top < 150
    setPos({
      top: below ? rect.bottom + 8 : rect.top - 8,
      left: rect.left + rect.width / 2,
      below,
    })
    setOpen(true)
  }

  const hide = () => setOpen(false)

  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [open])

  if (!content) return children

  return (
    <span
      ref={ref}
      className={`inline-flex ${className}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {open &&
        createPortal(
          <span
            role="tooltip"
            className={`pointer-events-none fixed z-[130] ${width} rounded-xl border border-neutral-200 bg-white p-3 text-xs leading-relaxed text-ink-600 shadow-xl`}
            style={{
              top: pos.top,
              left: pos.left,
              transform: pos.below ? 'translateX(-50%)' : 'translateX(-50%) translateY(-100%)',
              animation: 'cum-fade 150ms ease-out both',
            }}
          >
            {content}
          </span>,
          document.body,
        )}
    </span>
  )
}
