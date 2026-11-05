import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

/**
 * Modal de gráfica ampliada de "Paros por mes" (historia clínica).
 * Mismo patrón que el modal de Cumplimiento: SOLO se cierra con la X
 * (no con clic en el overlay ni con Escape). Bloquea el scroll del body,
 * atrapa el foco y devuelve el foco al llamar onClose.
 */
export default function HistoriaChartExpandedModal({ open, onClose, titulo, contexto, children }) {
  const modalRef = useRef(null)
  const closeBtnRef = useRef(null)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      setTimeout(() => closeBtnRef.current?.focus(), 50)
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Focus trap con Tab (sin cerrar con Escape)
  useEffect(() => {
    if (!open) return
    const handleTab = (e) => {
      if (e.key !== 'Tab') return
      const focusable = modalRef.current?.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
      if (!focusable || focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) { last.focus(); e.preventDefault() }
      } else if (document.activeElement === last) {
        first.focus(); e.preventDefault()
      }
    }
    document.addEventListener('keydown', handleTab)
    return () => document.removeEventListener('keydown', handleTab)
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Overlay con fade; el clic en él NO cierra el modal */}
      <div className="absolute inset-0 bg-ink-900/60 backdrop-blur-sm animate-[modal-fade-in_250ms_ease-out]" aria-hidden="true" />
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="historia-chart-modal-title"
        className="relative z-10 flex h-[90vh] w-[95vw] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-[modal-scale-in_250ms_ease-out]"
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <div className="min-w-0">
            <h2 id="historia-chart-modal-title" className="text-lg font-bold text-ink-900">{titulo}</h2>
            {contexto && <p className="truncate text-sm text-ink-500">{contexto}</p>}
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="grid size-9 shrink-0 place-items-center rounded-xl text-ink-700 transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 min-h-0 p-6">{children}</div>
      </div>
    </div>
  )
}
