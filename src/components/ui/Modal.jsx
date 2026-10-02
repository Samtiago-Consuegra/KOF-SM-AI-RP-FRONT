import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'

/** Diálogo modal para ver una gráfica ampliada. */
export default function Modal({ open, onClose, title, subtitle, legend, footer, children, bodyClassName = 'h-[70vh]' }) {
  const panelRef = useRef(null)
  const closeRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    const onKey = (e) => {
      if (e.key === 'Escape') return onClose()
      if (e.key !== 'Tab') return
      const items = [...(panelRef.current?.querySelectorAll(FOCUSABLE) ?? [])]
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      previous?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      <div className="absolute inset-0 bg-ink-900/60" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex w-full max-w-[1440px] max-h-[calc(100dvh-2rem)] flex-col overflow-y-auto scroll-thin rounded-2xl border border-neutral-200 bg-white shadow-2xl"
      >
        <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4 border-b border-neutral-100">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-ink-900">{title}</h2>
            {subtitle && <p className="text-xs text-ink-500 mt-0.5">{subtitle}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-ink-600">
            {legend}
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              title="Cerrar (Esc)"
              className="size-9 grid place-items-center rounded-lg border border-neutral-200 text-ink-500 hover:bg-neutral-50 hover:text-ink-900"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className={`px-5 py-4 ${bodyClassName}`}>{children}</div>

        {footer && <div className="px-5 py-3 border-t border-neutral-100 text-xs text-ink-600 flex flex-wrap justify-between gap-2">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
