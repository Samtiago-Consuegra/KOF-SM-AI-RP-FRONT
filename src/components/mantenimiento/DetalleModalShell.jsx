import { X } from 'lucide-react'

/** Estructura visual compartida por los detalles del calendario (paradas y órdenes SAP). */
export default function DetalleModalShell({ titleId, title, badges, onClose, footer, children }) {
  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center">
      <style>{`
        @keyframes modal-in { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) { .modal-anim { animation: none !important; } }
      `}</style>
      <div className="absolute inset-0 bg-ink-900/60 backdrop-blur-sm" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="modal-anim relative w-full max-w-[760px] bg-white rounded-2xl border border-neutral-200 shadow-xl mx-4 max-h-[90vh] flex flex-col" style={{ animation: 'modal-in 250ms ease-out' }}>
        <div className="flex items-start justify-between gap-3 p-4 border-b border-neutral-200">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-semibold text-ink-900">{title}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">{badges}</div>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="h-8 w-8 shrink-0 grid place-items-center rounded-lg hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400"><X className="size-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">{children}</div>
        {footer}
      </div>
    </div>
  )
}
