import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Factory } from 'lucide-react'
import DetalleModalShell from './DetalleModalShell.jsx'
import { EstadoOrdenBadge, TIPO_ORDEN_COLOR } from './OrdenSapCard.jsx'

const fechaLarga = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso + 'T00:00:00')
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

/** Detalle de solo lectura de una orden SAP, con el mismo diseño que el de las paradas. */
export default function DetalleOrdenSapModal({ orden, onClose }) {
  useEffect(() => {
    if (!orden) return undefined
    const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); onClose() } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [orden, onClose])

  if (!orden) return null
  return createPortal(
    <DetalleModalShell
      titleId="orden-sap-title"
      title={orden.texto || `Orden ${orden.orden}`}
      onClose={onClose}
      badges={
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs bg-neutral-100 text-ink-700">
          <span aria-hidden="true" className={`size-2 rounded-full ${TIPO_ORDEN_COLOR[orden.tipo] || TIPO_ORDEN_COLOR.otro}`} />
          {orden.tipo === 'otro' ? 'Otro tipo' : orden.tipo}
        </span>
      }
      footer={<p className="p-4 border-t border-neutral-200 text-xs text-ink-500">Orden de SAP: solo lectura.</p>}
    >
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div><p className="text-xs text-ink-500">Fecha</p><p className="text-ink-900 capitalize">{fechaLarga(orden.fecha)}</p></div>
        <div>
          <p className="text-xs text-ink-500">Estado</p>
          <div className="mt-0.5"><EstadoOrdenBadge estado={orden.estado} /></div>
        </div>
        <div className="col-span-2">
          <p className="text-xs text-ink-500">Máquina</p>
          <p className="flex items-center gap-1.5 text-ink-900"><Factory className="size-3.5 text-ink-400" aria-hidden="true" />{orden.maquina || 'Sin máquina'}</p>
        </div>
      </div>
    </DetalleModalShell>,
    document.body
  )
}
