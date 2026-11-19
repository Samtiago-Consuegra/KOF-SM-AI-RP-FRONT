import { useState } from 'react'
import { Pencil, Trash2, Factory } from 'lucide-react'
import ConfirmDialog from './ConfirmDialog.jsx'
import DetalleModalShell from './DetalleModalShell.jsx'
import CondicionParadaBadge from './CondicionParadaBadge.jsx'
import EjecucionBadge from './EjecucionBadge.jsx'
import { eliminarParada } from '../../services/mantenimientoService.js'
import { textoMaquinas } from '../../utils/paradas.js'

const TIPO_BADGE = {
  Preventiva: 'bg-tertiary-50 text-tertiary-700',
  Correctiva: 'bg-primary-50 text-primary-600',
  Predictiva: 'bg-ink-100 text-ink-700',
  'Predictiva o sugerida por el sistema': 'bg-ink-100 text-ink-700',
  'Parada de producción (limpieza, cambio de formato)': 'bg-neutral-100 text-ink-700',
}

export default function DetalleParadaModal({ open, onClose, parada, onEdit, onDeleted, onToast, soloLectura = false }) {
  const [confirmOpen, setConfirmOpen] = useState(false)

  if (!open || !parada) return null

  const tareas = parada.tareasDetalle || (parada.tareas || []).map(t => ({ descripcion: t, tipo: parada.tipo?.includes('Predictiva') ? 'Predictiva' : 'Preventiva', maquina: parada.maquina || '', sistema: '', componente: '' }))
  const total = tareas.length

  const porMaquina = {}
  tareas.forEach((t) => {
    const maquina = t.maquina || parada.maquina || 'Sin máquina'
    const sistema = t.sistema || t.sistemaId || 'Sin sistema'
    const componente = t.componente || t.componenteId || 'Sin componente'
    if (!porMaquina[maquina]) porMaquina[maquina] = { total: 0, grupos: {} }
    const key = `${sistema} · ${componente}`
    if (!porMaquina[maquina].grupos[key]) porMaquina[maquina].grupos[key] = { sistema, componente, items: [] }
    porMaquina[maquina].grupos[key].items.push(t)
    porMaquina[maquina].total += 1
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
    <>
      <DetalleModalShell
        titleId="det-parada-title"
        title={parada.titulo}
        onClose={onClose}
        badges={<>
          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs ${TIPO_BADGE[parada.tipo] || 'bg-neutral-100 text-ink-700'}`}>{parada.tipo}</span>
          <CondicionParadaBadge condicion={parada.condicion} />
        </>}
        footer={soloLectura ? (
          <p className="p-4 border-t border-neutral-200 text-xs text-ink-500">Parada de una semana pasada: solo lectura.</p>
        ) : (
        <div className="flex items-center justify-between p-4 border-t border-neutral-200">
          <button onClick={() => setConfirmOpen(true)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-primary-200 px-3 text-sm text-primary-600 hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400"><Trash2 className="size-4" /> Eliminar</button>
          <button onClick={() => onEdit?.(parada)} className="inline-flex h-9 items-center gap-2 rounded-lg bg-ink-900 px-3 text-sm text-white hover:bg-primary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400"><Pencil className="size-4" /> Editar</button>
        </div>
        )}
      >
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><p className="text-xs text-ink-500">Fecha</p><p className="text-ink-900 capitalize">{fechaFull}</p></div>
            <div><p className="text-xs text-ink-500">Horario</p><p className="text-ink-900">{parada.horaInicio} – {parada.horaFin} {duracion ? `(${duracion})` : ''}</p></div>
            <div className="col-span-2">
              <p className="text-xs text-ink-500">Ejecución</p>
              <div className="mt-0.5"><EjecucionBadge ejecucion={parada.ejecucion} /></div>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-ink-500">Máquinas</p>
              <p className="flex items-center gap-1.5 text-ink-900"><Factory className="size-3.5 text-ink-400" aria-hidden="true" />{textoMaquinas(parada) || 'Sin máquina'}</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-ink-500 mb-1">Tareas ({total})</p>
            <div className="space-y-2">
              {Object.entries(porMaquina).map(([maquina, data]) => (
                <div key={maquina} className="overflow-hidden rounded-xl border border-neutral-200">
                  <div className="flex items-center gap-2 border-b border-neutral-200 bg-neutral-50 px-3 py-2">
                    <Factory className="size-4 text-ink-500" aria-hidden="true" />
                    <p className="text-sm font-semibold text-ink-900">{maquina}</p>
                    <span className="ml-auto text-xs text-ink-500">{data.total} {data.total === 1 ? 'tarea' : 'tareas'}</span>
                  </div>
                  <div className="space-y-2 p-2">
                    {Object.entries(data.grupos).map(([key, grupo]) => (
                      <div key={key} className="rounded-lg border border-neutral-200 p-2">
                        <p className="text-xs font-medium text-ink-900">{grupo.sistema} · {grupo.componente}</p>
                        <ul className="mt-1 space-y-1">
                          {grupo.items.map((t, i) => (
                            <li key={i} className="flex items-center justify-between gap-2 text-sm text-ink-700">
                              <span>{t.descripcion}</span>
                              <span className={`inline-flex shrink-0 px-1.5 py-0.5 rounded-full text-xs ${TIPO_BADGE[t.tipo] || 'bg-neutral-100 text-ink-700'}`}>{t.tipo}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
      </DetalleModalShell>

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
    </>
  )
}
