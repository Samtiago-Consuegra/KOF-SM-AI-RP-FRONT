import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Pencil, Send, AlertTriangle, Factory, Wrench, CalendarRange, Info, Clock, CheckCircle2 } from 'lucide-react'
import { enviarTareaAParada } from '../../services/mantenimientoService.js'
import ProgramarParadaModal from './ProgramarParadaModal.jsx'
import CondicionParadaBadge from './CondicionParadaBadge.jsx'
import { condicionDeParada, maquinasDeParada, textoMaquinas } from '../../utils/paradas.js'
import { inputCls, labelCls, PRIOR_BADGE } from './modalFormStyles.js'

function ReadValue({ children }) {
  return <p className="text-sm text-ink-900">{children || '—'}</p>
}

export default function DetalleTareaModal({ open, onClose, tarea, paradas = [], onDone, onToast }) {
  const [edit, setEdit] = useState(false)
  const [paradaId, setParadaId] = useState(tarea?.paradaSugerida?.existe ? tarea.paradaSugerida.id : '')
  const [showDlg, setShowDlg] = useState(false)
  const [showProg, setShowProg] = useState(false)

  useEffect(() => {
    if (!open) return
    setEdit(false)
    setParadaId(tarea?.paradaSugerida?.existe ? tarea.paradaSugerida.id : '')
    setShowDlg(false)
    setShowProg(false)
  }, [open, tarea])

  useEffect(() => {
    if (!open || showDlg || showProg) return
    const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); onClose() } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, showDlg, showProg, onClose])

  if (!open || !tarea) return null

  const disponibles = paradas.filter((p) => maquinasDeParada(p).includes(tarea.maquina))
  const sugerida = tarea.paradaSugerida
  const paradaActual = paradas.find((p) => p.id === (paradaId || sugerida?.id)) || disponibles.find((p) => p.id === sugerida?.id)
  const condicionActual = paradaActual?.condicion
  const horario = sugerida?.horaInicio && sugerida?.horaFin
    ? `${sugerida.horaInicio} – ${sugerida.horaFin}`
    : paradaActual?.horaInicio && paradaActual?.horaFin
      ? `${paradaActual.horaInicio} – ${paradaActual.horaFin}`
      : ''

  const enviar = async () => {
    if (!tarea.paradaSugerida?.existe && !paradaId) {
      setShowDlg(true)
      return
    }
    if (paradaId) {
      await enviarTareaAParada(tarea.id, { paradaId, semana: tarea.semana })
      onClose(); onDone?.(); onToast?.('Tarea enviada a la parada'); return
    }
    if (tarea.paradaSugerida?.existe && tarea.paradaSugerida?.id) {
      await enviarTareaAParada(tarea.id, { paradaId: tarea.paradaSugerida.id, semana: tarea.semana })
      onClose(); onDone?.(); onToast?.('Tarea enviada a la parada'); return
    }
    setShowDlg(true)
  }

  const crear = async () => {
    setShowDlg(false)
    setShowProg(true)
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
        aria-labelledby="detalle-tarea-title"
        className="modal-anim relative w-full max-w-[760px] h-[90vh] max-h-[90vh] overflow-hidden bg-white rounded-2xl border border-neutral-200 shadow-xl mx-4 flex flex-col"
        style={{ animation: 'modal-in 220ms cubic-bezier(0.22,1,0.36,1)' }}
      >
        <div className="flex items-start justify-between gap-3 p-4 border-b border-neutral-200 flex-shrink-0">
          <div className="min-w-0">
            <h2 id="detalle-tarea-title" className="text-lg font-semibold text-ink-900">Detalle de la tarea</h2>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${PRIOR_BADGE[tarea.prioridad] || 'border-neutral-200 bg-neutral-100 text-ink-700'}`}>
                Prioridad {tarea.prioridad}
              </span>
              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${paradaActual ? 'border-tertiary-200 bg-tertiary-50 text-tertiary-700' : 'border-neutral-200 bg-neutral-100 text-ink-600'}`}>
                {paradaActual ? <CheckCircle2 className="size-3.5" aria-hidden="true" /> : null}
                {paradaActual ? 'Parada existente' : 'Parada por crear'}
              </span>
              {condicionActual && <CondicionParadaBadge condicion={condicionActual} />}
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
                    <ReadValue>{tarea.maquina}</ReadValue>
                  </div>
                  <div>
                    <label className={labelCls}>Sistema</label>
                    <ReadValue>{tarea.sistema}</ReadValue>
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Componente a arreglar</label>
                    <ReadValue>{tarea.componente}</ReadValue>
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
                    <ReadValue>{tarea.tarea}</ReadValue>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelCls}>Prioridad</label>
                      <ReadValue>{tarea.prioridad}</ReadValue>
                    </div>
                    <div>
                      <label className={labelCls}>Origen</label>
                      <ReadValue>{tarea.origen}</ReadValue>
                    </div>
                  </div>
                  {tarea.motivo && (
                    <div>
                      <label className={labelCls}>¿Por qué?</label>
                      <p className="text-sm text-ink-700">{tarea.motivo}</p>
                    </div>
                  )}
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
                    <label className={labelCls}>Estado</label>
                    <p className={`inline-flex items-center gap-1.5 text-sm font-medium ${paradaActual ? 'text-tertiary-700' : 'text-ink-700'}`}>
                      {paradaActual ? <CheckCircle2 className="size-3.5" aria-hidden="true" /> : null}
                      {paradaActual ? 'Parada creada' : 'Aún no existe'}
                    </p>
                  </div>
                  {paradaActual && (
                    <div>
                      <label className={labelCls}>Parada</label>
                      <ReadValue>{paradaActual.titulo}</ReadValue>
                    </div>
                  )}
                  <div>
                    <label className={labelCls}>Día</label>
                    <ReadValue>{sugerida?.dia || paradaActual?.fecha || 'Por definir'}</ReadValue>
                  </div>
                  <div>
                    <label className={labelCls}>Horario</label>
                    {horario ? (
                      <p className="inline-flex items-center gap-1.5 text-sm text-ink-900">
                        <Clock className="size-3.5 text-ink-400" aria-hidden="true" />
                        {horario}
                      </p>
                    ) : <ReadValue>Por definir</ReadValue>}
                  </div>
                  {(paradaActual || sugerida?.maquina) && (
                    <div>
                      <label className={labelCls}>Máquina(s)</label>
                      <ReadValue>{paradaActual ? textoMaquinas(paradaActual) : sugerida.maquina}</ReadValue>
                    </div>
                  )}
                  {edit && (
                    <div>
                      <label className={labelCls} htmlFor="tarea-parada">Enviar a parada</label>
                      <select id="tarea-parada" value={paradaId} onChange={(e) => setParadaId(e.target.value)} className={inputCls}>
                        <option value="">Seleccionar parada</option>
                        {disponibles.map((p) => {
                          const cond = condicionDeParada(p)
                          return (
                            <option key={p.id} value={p.id}>
                              {p.titulo} · {p.fecha} {p.horaInicio}-{p.horaFin}{cond ? ` · ${cond.label}` : ''}
                            </option>
                          )
                        })}
                      </select>
                      {!disponibles.length && <p className="mt-1 text-xs text-ink-500">No hay paradas para esta máquina. Puedes crear una.</p>}
                    </div>
                  )}
                </div>
              </section>

              <div className="flex gap-2 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-3 text-xs text-ink-500">
                <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <p>La tarea se agregará a la parada seleccionada. Si no existe, podrás crearla con el formulario de programación.</p>
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
            <Send className="size-4" /> Enviar a la parada
          </button>
        </div>
      </div>

      {showDlg && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="modal-fade absolute inset-0 bg-ink-900/60" style={{ animation: 'fade-in 200ms ease-out' }} onClick={() => setShowDlg(false)} />
          <div className="modal-anim relative w-full max-w-[420px] bg-white rounded-2xl border border-neutral-200 shadow-xl mx-4" style={{ animation: 'modal-in 220ms cubic-bezier(0.22,1,0.36,1)' }}>
            <div className="p-4 flex items-start gap-3">
              <div className="h-9 w-9 rounded-full bg-primary-50 grid place-items-center"><AlertTriangle className="size-4 text-primary-500" /></div>
              <div>
                <p className="text-base font-semibold text-ink-900">La parada no está creada</p>
                <p className="text-sm text-ink-700">¿Deseas crearla para enviar esta tarea?</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 p-4 border-t border-neutral-200">
              <button onClick={() => setShowDlg(false)} className="h-9 px-3 rounded-lg border border-neutral-200 text-sm hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400">Cerrar</button>
              <button onClick={crear} className="h-9 px-3 rounded-lg bg-primary-500 text-white text-sm hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400">Crear parada</button>
            </div>
          </div>
        </div>
      )}

      <ProgramarParadaModal
        key={showProg ? 'prog-' + tarea.id : 'closed'}
        open={showProg}
        onClose={() => setShowProg(false)}
        onCreated={async () => {
          setShowProg(false)
          onClose()
          onDone?.()
          onToast?.('Parada creada y tarea asignada')
        }}
        onToast={onToast}
        asignarTarea={tarea}
        precarga={{
          titulo: tarea.tarea,
          fecha: tarea.paradaSugerida?.fecha || new Date().toISOString().slice(0, 10),
          horaInicio: '08:00',
          horaFin: '12:00',
          maquina: tarea.maquina,
          sistema: tarea.sistema,
          componente: tarea.componenteId,
          tipoTarea: 'Predictiva',
          cardInicial: {
            id: 'card-preload-' + tarea.id,
            maquina: tarea.maquina,
            sistemaId: tarea.sistema,
            sistemaNombre: tarea.sistema,
            componenteId: tarea.componenteId,
            componenteNombre: tarea.componente,
            estado: 'confirmada',
            tareas: [{ descripcion: tarea.tarea, tipo: 'Predictiva', id: 't-preload-' + tarea.id }],
          },
        }}
      />
    </div>,
    document.body
  )
}
