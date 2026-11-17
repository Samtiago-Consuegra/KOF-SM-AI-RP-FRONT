import { useState } from 'react'
import { createPortal } from 'react-dom'
import { autoUpdate, flip, offset, shift, useFloating } from '@floating-ui/react-dom'

/**
 * Tooltip ligero, accesible con teclado y portalizado a body para que no lo
 * recorte el overflow de la tabla ni lo tape un modal. Aparece con hover o foco.
 * placement: 'top' (por defecto) o 'bottom'; voltea solo si no cabe.
 */
export default function Tooltip({ content, children, className = '', width = 'w-72', placement = 'top' }) {
  const [open, setOpen] = useState(false)
  const { refs, floatingStyles } = useFloating({
    open,
    placement,
    strategy: 'fixed',
    whileElementsMounted: autoUpdate, // sigue al ancla solo mientras está visible
    middleware: [offset(8), flip({ padding: 8 }), shift({ padding: 8 })],
  })

  if (!content) return children

  const show = () => setOpen(true)
  const hide = () => setOpen(false)

  return (
    <span
      ref={refs.setReference}
      className={`inline-flex ${className}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onKeyDown={(e) => e.key === 'Escape' && hide()}
    >
      {children}
      {open &&
        createPortal(
          <span
            ref={refs.setFloating}
            role="tooltip"
            className={`pointer-events-none z-popover-modal ${width} max-w-[calc(100vw-1rem)] rounded-xl border border-neutral-200 bg-white p-3 text-xs leading-relaxed text-ink-600 shadow-xl`}
            style={{ ...floatingStyles, animation: 'cum-fade 150ms ease-out both' }}
          >
            {content}
          </span>,
          document.body,
        )}
    </span>
  )
}
