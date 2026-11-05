import { useState } from 'react'
import { X, Pencil, Trash2 } from 'lucide-react'
import ConfirmDialog from './ConfirmDialog.jsx'
import { eliminarParada } from '../../services/mantenimientoService.js'

const TIPO_BADGE = {
  Preventiva: 'bg-tertiary-50 text-tertiary-700',
  Correctiva: 'bg-primary-50 text-primary-600',
  Predictiva: 'bg-ink-100 text-ink-700',
  'Predictiva o sugerida por el sistema': 'bg-ink-100 text-ink-700',
  'Parada de producción (limpieza, cambio de formato)': 'bg-neutral-100 text-ink-700',
}

export default function DetalleParadaModal({ open, onClose, parada, onEdit, onDeleted, onToast }) {
  const [confirmOpen, setConfirmOpen] = useState(false)

  if (!open || !parada) return null

  const tareas = parada.tareasDetalle || (parada.tareas || []).map(t => ({ descripcion: t, tipo: parada.tipo?.includes('Predictiva') ? 'Predictiva' : 'Preventiva', maquina: parada.maquina || '', sistema: '', componente: '' }))
  const total = tareas.length

  // group by maquina/sistema/componente
  const groups = {}
  tareas.forEach(t => {
    const key = `${t.maquina || parada.maquina || ''} · ${t.sistema || ''} · ${t.componente || ''}`
    if (!groups[key]) groups[key] = []
    groups[key].push(t)
  })

  const fechaFull = (() => {
    try {
      const d = new Date(parada.fecha + 'T00:00:00')
      return d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    } catch { return parada.fecha }
  })()

  const duracion = (() => {
    if (!parada.horaInicio || !parada.horaFin) return ''
    const [h1,m1] = parada.horaInicio.split(':').map(Number)
    const [h2,m2] = parada.horaFin.split(':').map(Number)
    const mins = (h2*60+m2) - (h1*60+m1)
    const h = Math.floor(mins/60)
    const m = mins%60
    return m ? `${h} h ${m} min` : `${h} h`
  })()

  const handleDelete = async () => {
    await eliminarParada(parada.id)
    setConfirmOpen(false)
    onClose()
    onDeleted?.()
    onToast?.('Parada eliminada')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <style>{`
        @keyframes modal-in { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
        @media (prefers-reduced-motion: reduce) { .modal-anim { animation: none !important; } }
      `}</style>
      <div className="absolute inset-0 bg-ink-900/60 backdrop-blur-sm" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-labelledby="det-parada-title" className="modal-anim relative w-full max-w-[640px] bg-white rounded-2xl border border-neutral-200 shadow-xl mx-4 max-h-[90vh] flex flex-col" style={{ animation: 'modal-in 250ms ease-out' }}>
        <div className="flex items-start justify-between p-4 border-b border-neutral-200">
          <div>
            <h2 id="det-parada-title" className="text-lg font-semibold text-ink-900">{parada.titulo}</h2>
            <span className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-xs ${TIPO_BADGE[parada.tipo] || 'bg-neutral-100 text-ink-700'}`}>{parada.tipo}</span>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="h-8 w-8 grid place-items-center rounded-lg hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400"><X className="size-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><p className="text-xs text-ink-500">Fecha</p><p className="text-ink-900 capitalize">{fechaFull}</p></div>
            <div><p className="text-xs text-ink-500">Horario</p><p className="text-ink-900">{parada.horaInicio} – {parada.horaFin} {duracion ? `(${duracion})` : ''}</p></div>
          </div>
          <div>
            <p className="text-xs text-ink-500 mb-1">Tareas ({total})</p>
            <div className="space-y-2">
              {Object.entries(groups).map(([key, list]) => (
                <div key={key} className="rounded-lg border border-neutral-200 p-2">
                  <p className="text-xs font-medium text-ink-900">{key}</p>
                  <ul className="mt-1 space-y-1">
                    {list.map((t, i) => (
                      <li key={i} className="flex items-center justify-between text-sm text-ink-700">
                        <span>{t.descripcion}</span>
                        <span className={`inline-flex px-1.5 py-0.5 rounded-full text-xs ${TIPO_BADGE[t.tipo] || 'bg-neutral-100 text-ink-700'}`}>{t.tipo}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between p-4 border-t border-neutral-200">
          <button onClick={() => setConfirmOpen(true)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-primary-200 px-3 text-sm text-primary-600 hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400"><Trash2 className="size-4" /> Eliminar</button>
          <button onClick={() => onEdit?.(parada)} className="inline-flex h-9 items-center gap-2 rounded-lg bg-ink-900 px-3 text-sm text-white hover:bg-primary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400"><Pencil className="size-4" /> Editar</button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        variant="danger"
        title="¿Eliminar esta parada?"
        message={`Se eliminará «${parada.titulo}» del ${fechaFull} con sus ${total} tareas. Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
