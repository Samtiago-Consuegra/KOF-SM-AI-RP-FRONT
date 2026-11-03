import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import CumplimientoChart from './CumplimientoChart.jsx'

export default function ChartExpandedModal({ open, onClose, rango }) {
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
  
  useEffect(() => {
    if (!open) return
    const handleTab = (e) => {
      if (e.key !== 'Tab') return
      const focusable = modalRef.current?.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
      if (!focusable || focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) {
          last.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === last) {
          first.focus()
          e.preventDefault()
        }
      }
    }
    document.addEventListener('keydown', handleTab)
    return () => document.removeEventListener('keydown', handleTab)
  }, [open])
  
  if (!open) return null
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-ink-900/60 backdrop-blur-sm" />
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="chart-modal-title"
        className="relative z-10 flex h-[90vh] w-[95vw] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <div>
            <h2 id="chart-modal-title" className="text-lg font-bold text-ink-900">Cumplimiento semanal</h2>
            <p className="text-sm text-ink-500">{rango?.label || ''} · Las 4 máquinas críticas</p>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="grid size-9 place-items-center rounded-xl hover:bg-neutral-100 text-ink-700"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 p-6">
          <CumplimientoChart rango={rango} onExpand={null} />
        </div>
      </div>
    </div>
  )
}
