import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Pencil, CalendarPlus } from 'lucide-react'
import { enviarPlanACalendario } from '../../services/mantenimientoService.js'
import { MAQUINAS } from '../../data/mock/mantenimiento.js'

export default function DetallePlanModal({ open, onClose, item, onDone, onToast }) {
  const [edit, setEdit] = useState(false)
  const [maquina, setMaquina] = useState(item?.maquina || MAQUINAS[0])
  const [sistema, setSistema] = useState(item?.sistema || '')
  const [componente, setComponente] = useState(item?.componente || '')
  const [horaInicio, setHoraInicio] = useState(item?.parada?.horaInicio || '')
  const [horaFin, setHoraFin] = useState(item?.parada?.horaFin || '')
  const [tarea, setTarea] = useState(item?.tarea || '')
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
    await enviarPlanACalendario(item.id, { fecha: new Date().toISOString().slice(0,10), horaInicio, horaFin })
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
      <div role="dialog" aria-modal="true" aria-labelledby="detalle-plan-title" className="modal-anim relative w-full max-w-[520px] bg-white rounded-2xl border border-neutral-200 shadow-xl mx-4" style={{ animation: 'modal-in 220ms cubic-bezier(0.22,1,0.36,1)' }}>
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <h2 id="detalle-plan-title" className="text-lg font-semibold text-ink-900">Detalle del plan</h2>
          <button onClick={onClose} aria-label="Cerrar" className="h-8 w-8 grid place-items-center rounded-lg hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400"><X className="size-4" /></button>
        </div>
        <div className="p-4 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-ink-500">Máquina</label>
              {edit ? <select value={maquina} onChange={(e)=>setMaquina(e.target.value)} className="w-full h-9 rounded-lg border border-neutral-200 px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400">{MAQUINAS.map((m)=><option key={m}>{m}</option>)}</select> : <p className="text-sm text-ink-900">{maquina}</p>}
            </div>
            <div>
              <label className="text-xs text-ink-500">Sistema</label>
              {edit ? <input value={sistema} onChange={(e)=>setSistema(e.target.value)} className="w-full h-9 rounded-lg border border-neutral-200 px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400" /> : <p className="text-sm text-ink-900">{sistema}</p>}
            </div>
          </div>
          <div>
            <label className="text-xs text-ink-500">Componente a arreglar</label>
            {edit ? <input value={componente} onChange={(e)=>setComponente(e.target.value)} className="w-full h-9 rounded-lg border border-neutral-200 px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400" /> : <p className="text-sm text-ink-900">{componente}</p>}
          </div>
          <div>
            <label className="text-xs text-ink-500">Tarea</label>
            {edit ? <input value={tarea} onChange={(e)=>setTarea(e.target.value)} className="w-full h-9 rounded-lg border border-neutral-200 px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400" /> : <p className="text-sm text-ink-900">{tarea}</p>}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-ink-500">Hora inicio</label>
              {edit ? <input type="time" value={horaInicio} onChange={(e)=>setHoraInicio(e.target.value)} className="w-full h-9 rounded-lg border border-neutral-200 px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400" /> : <p className="text-sm text-ink-900">{horaInicio || 'Por definir'}</p>}
            </div>
            <div>
              <label className="text-xs text-ink-500">Hora fin</label>
              {edit ? <input type="time" value={horaFin} onChange={(e)=>setHoraFin(e.target.value)} className="w-full h-9 rounded-lg border border-neutral-200 px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400" /> : <p className="text-sm text-ink-900">{horaFin || 'Por definir'}</p>}
            </div>
          </div>
          <div>
            <label className="text-xs text-ink-500">Día de la parada</label>
            <p className="text-sm text-ink-900">{item.parada?.dia}</p>
          </div>
          {err && <p className="text-xs text-primary-600">{err}</p>}
        </div>
        <div className="flex items-center justify-between p-4 border-t border-neutral-200">
          <button onClick={()=>setEdit(!edit)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-neutral-200 px-3 text-sm hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400"><Pencil className="size-4" /> {edit ? 'Cancelar edición' : 'Personalizar'}</button>
          <button onClick={enviar} className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary-500 px-3 text-sm text-white hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400"><CalendarPlus className="size-4" /> Enviar a calendario</button>
        </div>
      </div>
    </div>,
    document.body
  )
}
