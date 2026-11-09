import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Pencil, CalendarPlus, Factory, Wrench, CalendarRange, Info, Clock } from 'lucide-react'
import { enviarPlanACalendario } from '../../services/mantenimientoService.js'
import { MAQUINAS } from '../../data/mock/mantenimiento.js'
import CondicionParadaBadge from './CondicionParadaBadge.jsx'
import CondicionSelector from './CondicionSelector.jsx'
import { inputCls, labelCls, PRIOR_BADGE } from './modalFormStyles.js'

function ReadValue({ children }) {
  return <p className="text-sm text-ink-900">{children}</p>
}

export default function DetallePlanModal({ open, onClose, item, onDone, onToast }) {
  const [edit, setEdit] = useState(false)
  const [maquina, setMaquina] = useState(item?.maquina || MAQUINAS[0])
  const [sistema, setSistema] = useState(item?.sistema || '')
  const [componente, setComponente] = useState(item?.componente || '')
  const [horaInicio, setHoraInicio] = useState(item?.parada?.horaInicio || '')
  const [horaFin, setHoraFin] = useState(item?.parada?.horaFin || '')
  const [tarea, setTarea] = useState(item?.tarea || '')
  const [condicion, setCondicion] = useState('frio')
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!open) return
    setEdit(false)
    setMaquina(item?.maquina || MAQUINAS[0])
    setSistema(item?.sistema || '')
    setComponente(item?.componente || '')
    setHoraInicio(item?.parada?.horaInicio || '')
    setHoraFin(item?.parada?.horaFin || '')
    setTarea(item?.tarea || '')
    setCondicion('frio')
    setErr('')
  }, [open, item])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); onClose() } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || !item) return null

  const enviar = async () => {
    setErr('')
    if (!horaInicio || !horaFin) { setErr('Requiere hora de inicio y fin válidas'); return }
    if (horaFin <= horaInicio) { setErr('La hora de fin debe ser posterior a la hora de inicio'); return }
    await enviarPlanACalendario(item.id, {
      fecha: new Date().toISOString().slice(0, 10),
      horaInicio,
      horaFin,
      condicion,
    })
    onClose()
    onDone?.()
    onToast?.('Enviado a calendario')
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <style>{`
        @keyframes modal-in { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) { .modal-anim, .modal-fade { animation: none !important; } }
      `}</style>
      <div className="modal-fade absolute inset-0 bg-ink-900/60 backdrop-blur-sm" style={{ animation: 'fade-in 200ms ease-out' }} onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="detalle-plan-title"
        className="modal-anim relative w-full max-w-[760px] h-[90vh] max-h-[90vh] overflow-hidden bg-white rounded-2xl border border-neutral-200 shadow-xl mx-4 flex flex-col"
        style={{ animation: 'modal-in 220ms cubic-bezier(0.22,1,0.36,1)' }}
      >
        <div className="flex items-start justify-between gap-3 p-4 border-b border-neutral-200 flex-shrink-0">
          <div className="min-w-0">
            <h2 id="detalle-plan-title" className="text-lg font-semibold text-ink-900">Detalle del plan</h2>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${PRIOR_BADGE[item.prioridad] || 'border-neutral-200 bg-neutral-100 text-ink-700'}`}>
                Prioridad {item.prioridad}
              </span>
              {item.enCalendario && (
                <span className="inline-flex items-center rounded-full border border-tertiary-200 bg-tertiary-50 px-2 py-0.5 text-xs font-medium text-tertiary-700">
                  En calendario
                </span>
              )}
              <CondicionParadaBadge condicion={condicion} />
            </div>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="h-8 w-8 shrink-0 grid place-items-center rounded-lg hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400"><X className="size-4" /></button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain scroll-visible p-4">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="space-y-3">
              <section className="rounded-xl border border-neutral-200 p-3">
                <div className="mb-3 flex items-center gap-2">
                  <span className="grid size-7 place-items-center rounded-lg bg-neutral-100 text-ink-700"><Factory className="size-4" aria-hidden="true" /></span>
                  <p className="text-sm font-semibold text-ink-900">Ubicación</p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <label className={labelCls}>Máquina</label>
                    {edit ? (
                      <select value={maquina} onChange={(e) => setMaquina(e.target.value)} className={inputCls}>
                        {MAQUINAS.map((m) => <option key={m}>{m}</option>)}
                      </select>
                    ) : <ReadValue>{maquina}</ReadValue>}
                  </div>
                  <div>
                    <label className={labelCls}>Sistema</label>
                    {edit ? (
                      <input value={sistema} onChange={(e) => setSistema(e.target.value)} className={inputCls} />
                    ) : <ReadValue>{sistema}</ReadValue>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Componente a arreglar</label>
                    {edit ? (
                      <input value={componente} onChange={(e) => setComponente(e.target.value)} className={inputCls} />
                    ) : <ReadValue>{componente}</ReadValue>}
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-neutral-200 p-3">
                <div className="mb-3 flex items-center gap-2">
                  <span className="grid size-7 place-items-center rounded-lg bg-neutral-100 text-ink-700"><Wrench className="size-4" aria-hidden="true" /></span>
                  <p className="text-sm font-semibold text-ink-900">Tarea</p>
                </div>
                <div className="space-y-2">
                  <div>
                    <label className={labelCls}>Descripción</label>
                    {edit ? (
                      <input value={tarea} onChange={(e) => setTarea(e.target.value)} className={inputCls} />
                    ) : <ReadValue>{tarea}</ReadValue>}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelCls}>Clase de orden</label>
                      <ReadValue>{item.claseOrden}</ReadValue>
                    </div>
                    <div>
                      <label className={labelCls}>Prioridad</label>
                      <ReadValue>{item.prioridad}</ReadValue>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <aside className="space-y-3">
              <section className="rounded-xl border border-neutral-200 p-3">
                <div className="mb-3 flex items-center gap-2">
                  <span className="grid size-7 place-items-center rounded-lg bg-neutral-100 text-ink-700"><CalendarRange className="size-4" aria-hidden="true" /></span>
                  <p className="text-sm font-semibold text-ink-900">Parada sugerida</p>
                </div>
                <div className="space-y-2">
                  <div>
                    <label className={labelCls}>Día</label>
                    <ReadValue>{item.parada?.dia || 'Por definir'}</ReadValue>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelCls}>Hora de inicio</label>
                      {edit ? (
                        <input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} className={inputCls} />
                      ) : (
                        <p className="inline-flex items-center gap-1.5 text-sm text-ink-900">
                          <Clock className="size-3.5 text-ink-400" aria-hidden="true" />
                          {horaInicio || 'Por definir'}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className={labelCls}>Hora de fin</label>
                      {edit ? (
                        <input type="time" value={horaFin} onChange={(e) => setHoraFin(e.target.value)} className={inputCls} />
                      ) : (
                        <p className="inline-flex items-center gap-1.5 text-sm text-ink-900">
                          <Clock className="size-3.5 text-ink-400" aria-hidden="true" />
                          {horaFin || 'Por definir'}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className={labelCls}>Condición de la parada</span>
                    {edit ? (
                      <CondicionSelector value={condicion} onChange={setCondicion} />
                    ) : (
                      <CondicionParadaBadge condicion={condicion} />
                    )}
                  </div>
                  {err && <p className="text-xs text-primary-600" role="alert">{err}</p>}
                </div>
              </section>

              <div className="flex gap-2 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-3 text-xs text-ink-500">
                <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <p>Al enviar se creará una parada con esta condición y horario. Podrás verla en el calendario semanal.</p>
              </div>
            </aside>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 p-4 border-t border-neutral-200 flex-shrink-0">
          <button
            onClick={() => setEdit(!edit)}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-neutral-200 px-3 text-sm hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400"
          >
            <Pencil className="size-4" /> {edit ? 'Cancelar edición' : 'Personalizar'}
          </button>
          <button
            onClick={enviar}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary-500 px-3 text-sm text-white hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400"
          >
            <CalendarPlus className="size-4" /> Enviar a calendario
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
