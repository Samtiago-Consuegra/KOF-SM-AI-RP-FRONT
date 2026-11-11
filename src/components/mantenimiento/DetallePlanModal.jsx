import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, CalendarPlus, Factory, Wrench, CalendarRange, Info, Clock, HardHat, Lightbulb, Loader2 } from 'lucide-react'
import { enviarPlanACalendario } from '../../services/mantenimientoService.js'
import CondicionParadaBadge from './CondicionParadaBadge.jsx'
import { labelCls, PRIOR_BADGE } from './modalFormStyles.js'

function ReadValue({ children }) {
  return <p className="text-sm text-ink-900">{children || '—'}</p>
}

export default function DetallePlanModal({ open, onClose, item, onDone, onToast }) {
  const [enviando, setEnviando] = useState(false)

  useEffect(() => { if (open) setEnviando(false) }, [open, item])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); onClose() } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || !item) return null

  const parada = item.parada || {}
  const puedeEnviar = !!item.idParada && !item.enCalendario

  const enviar = async () => {
    if (!puedeEnviar || enviando) return
    setEnviando(true)
    try {
      await enviarPlanACalendario(item.id, { paradaId: item.idParada, semana: item.semana })
      onClose()
      onDone?.()
      onToast?.('Tarea enviada a la parada')
    } catch (e) {
      onToast?.({ message: e?.message || 'No se pudo enviar la tarea', variant: 'error' })
      setEnviando(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <style>{`
        @keyframes modal-in { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes dp-section-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .dp-section { animation: dp-section-in 240ms cubic-bezier(0.22,1,0.36,1) both; }
        @media (prefers-reduced-motion: reduce) { .modal-anim, .modal-fade, .dp-section { animation: none !important; } }
      `}</style>
      <div className="modal-fade absolute inset-0 bg-ink-900/60 backdrop-blur-sm" style={{ animation: 'fade-in 200ms ease-out' }} onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="detalle-plan-title"
        className="modal-anim relative w-full max-w-[760px] max-h-[90vh] overflow-hidden bg-white rounded-2xl border border-neutral-200 shadow-xl mx-4 flex flex-col"
        style={{ animation: 'modal-in 220ms cubic-bezier(0.22,1,0.36,1)' }}
      >
        <div className="flex items-start justify-between gap-3 p-4 border-b border-neutral-200 flex-shrink-0">
          <div className="min-w-0">
            <h2 id="detalle-plan-title" className="text-lg font-semibold text-ink-900">Detalle del plan</h2>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${PRIOR_BADGE[item.prioridad] || 'border-neutral-200 bg-neutral-100 text-ink-700'}`}>
                Prioridad {item.prioridad}
              </span>
              {item.estado && (
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${item.enCalendario ? 'border-tertiary-200 bg-tertiary-50 text-tertiary-700' : 'border-neutral-200 bg-neutral-100 text-ink-700'}`}>
                  {item.estado}
                </span>
              )}
              {item.conContratista && (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                  <HardHat className="size-3.5" aria-hidden="true" /> Contratista
                </span>
              )}
              {parada.condicion && <CondicionParadaBadge condicion={parada.condicion} />}
            </div>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="h-8 w-8 shrink-0 grid place-items-center rounded-lg hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400"><X className="size-4" /></button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain scroll-visible p-4">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="space-y-3">
              <section className="dp-section rounded-xl border border-neutral-200 p-3">
                <div className="mb-3 flex items-center gap-2">
                  <span className="grid size-7 place-items-center rounded-lg bg-neutral-100 text-ink-700"><Factory className="size-4" aria-hidden="true" /></span>
                  <p className="text-sm font-semibold text-ink-900">Ubicación</p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <span className={labelCls}>Máquina</span>
                    <ReadValue>{item.maquina}</ReadValue>
                  </div>
                  <div>
                    <span className={labelCls}>Sistema</span>
                    <ReadValue>{item.sistema || item.grupo}</ReadValue>
                  </div>
                  <div className="sm:col-span-2">
                    <span className={labelCls}>Componente</span>
                    <ReadValue>{item.componente}{item.componenteId ? ` · ${item.componenteId}` : ''}</ReadValue>
                  </div>
                </div>
              </section>

              <section className="dp-section rounded-xl border border-neutral-200 p-3" style={{ animationDelay: '40ms' }}>
                <div className="mb-3 flex items-center gap-2">
                  <span className="grid size-7 place-items-center rounded-lg bg-neutral-100 text-ink-700"><Wrench className="size-4" aria-hidden="true" /></span>
                  <p className="text-sm font-semibold text-ink-900">Tarea</p>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className={labelCls}>Descripción</span>
                    <ReadValue>{item.tarea}</ReadValue>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className={labelCls}>Clase de orden</span>
                      <ReadValue>{item.claseOrden}</ReadValue>
                    </div>
                    <div>
                      <span className={labelCls}>Origen</span>
                      <ReadValue>{item.origen}</ReadValue>
                    </div>
                  </div>
                </div>
              </section>

              {item.motivo && (
                <section className="dp-section rounded-xl border border-tertiary-200 bg-tertiary-50/50 p-3" style={{ animationDelay: '80ms' }}>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="grid size-7 place-items-center rounded-lg bg-tertiary-100 text-tertiary-700"><Lightbulb className="size-4" aria-hidden="true" /></span>
                    <p className="text-sm font-semibold text-ink-900">¿Por qué?</p>
                  </div>
                  <p className="text-sm text-ink-700">{item.motivo}</p>
                </section>
              )}
            </div>

            <aside className="space-y-3">
              <section className="dp-section rounded-xl border border-neutral-200 p-3" style={{ animationDelay: '60ms' }}>
                <div className="mb-3 flex items-center gap-2">
                  <span className="grid size-7 place-items-center rounded-lg bg-neutral-100 text-ink-700"><CalendarRange className="size-4" aria-hidden="true" /></span>
                  <p className="text-sm font-semibold text-ink-900">Parada sugerida</p>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className={labelCls}>Parada</span>
                    <ReadValue>{parada.titulo || item.idParada || 'Sin parada asignada'}</ReadValue>
                  </div>
                  <div>
                    <span className={labelCls}>Día</span>
                    <ReadValue>{parada.dia || 'Por definir'}</ReadValue>
                  </div>
                  <div>
                    <span className={labelCls}>Horario</span>
                    <p className="inline-flex items-center gap-1.5 text-sm text-ink-900">
                      <Clock className="size-3.5 text-ink-400" aria-hidden="true" />
                      {parada.horaInicio && parada.horaFin ? `${parada.horaInicio} – ${parada.horaFin}` : 'Por definir'}
                    </p>
                  </div>
                </div>
              </section>

              <div className="flex gap-2 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-3 text-xs text-ink-500">
                <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <p>Al enviar, la decisión se registra en el motor y el plan se recalcula.</p>
              </div>
            </aside>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t border-neutral-200 flex-shrink-0">
          <button onClick={onClose} className="h-9 px-3 rounded-lg bg-neutral-100 text-ink-700 text-sm hover:bg-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400">Cerrar</button>
          <button
            onClick={enviar}
            disabled={!puedeEnviar || enviando}
            aria-busy={enviando}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary-500 px-3 text-sm text-white hover:bg-primary-600 active:scale-[0.97] transition-[background-color,transform] duration-150 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400"
          >
            {enviando ? <Loader2 className="size-4 animate-spin" /> : <CalendarPlus className="size-4" />}
            {item.enCalendario ? 'Ya está en la parada' : 'Enviar a la parada'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
