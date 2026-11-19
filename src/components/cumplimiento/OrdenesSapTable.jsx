import { useState } from 'react'
import { ClipboardX } from 'lucide-react'
import Card from '../ui/Card.jsx'
import Dropdown from '../ui/Dropdown.jsx'
import Paginacion from '../ui/Paginacion.jsx'
import { EstadoOrdenBadge, TIPO_ORDEN_COLOR } from '../mantenimiento/OrdenSapCard.jsx'

const PAGE_SIZE = 8

const ESTADO_OPTIONS = [
  { value: 'todos', label: 'Todos los estados' },
  { value: 'Ejecutada', label: 'Ejecutada' },
  { value: 'No ejecutada', label: 'No ejecutada' },
  { value: 'Abierta', label: 'Abierta' },
]

const fechaCorta = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso + 'T00:00:00')
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })
}

/** Tabla "Órdenes del periodo" (estilo ParadasTable). Recibe las órdenes ya cargadas. */
export default function OrdenesSapTable({ ordenes = [], loading, onVerOrden }) {
  const [estado, setEstado] = useState('todos')
  const [page, setPage] = useState(1)
  const [direction, setDirection] = useState('right')

  const filtradas = [...(estado === 'todos' ? ordenes : ordenes.filter((o) => o.estado === estado))]
    .sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)))
  const totalPages = Math.max(1, Math.ceil(filtradas.length / PAGE_SIZE))
  const pageSafe = Math.min(page, totalPages)
  const inicio = (pageSafe - 1) * PAGE_SIZE
  const visibles = filtradas.slice(inicio, inicio + PAGE_SIZE)

  const handleEstado = (value) => {
    setEstado(value)
    setPage(1)
    setDirection('right')
  }

  const goPage = (next) => {
    setDirection(next > pageSafe ? 'right' : 'left')
    setPage(next)
  }

  const rowAnimation = (index) =>
    `${direction === 'right' ? 'cum-row-in-right' : 'cum-row-in-left'} 240ms ease-out ${index * 30}ms both`

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-neutral-200 px-5 py-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink-900">Órdenes del periodo</h2>
          <p className="text-sm text-ink-500">8 filas por página · ordenadas por fecha programada.</p>
        </div>
        <Dropdown label="Estado" value={estado} onChange={handleEstado} options={ESTADO_OPTIONS} className="w-full sm:w-48" />
      </div>

      <div className="overflow-x-auto scroll-thin">
        <table className="w-full min-w-[880px] table-fixed text-sm">
          <colgroup>
            <col className="w-[14%]" />
            <col className="w-[15%]" />
            <col className="w-[15%]" />
            <col className="w-[40%]" />
            <col className="w-[16%]" />
          </colgroup>
          <thead className="bg-neutral-50 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-500">
            <tr>
              <th scope="col" className="px-5 py-3">Fecha</th>
              <th scope="col" className="px-5 py-3">Máquina</th>
              <th scope="col" className="px-5 py-3">Tipo</th>
              <th scope="col" className="px-5 py-3">Texto</th>
              <th scope="col" className="px-5 py-3">Estado</th>
            </tr>
          </thead>
          <tbody key={`${estado}-${pageSafe}-${ordenes.length}`} className="divide-y divide-neutral-100">
            {loading && Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <tr key={`sk-${i}`} className="h-16">
                <td colSpan={5} className="px-5 py-2"><div className="h-10 animate-pulse rounded-xl bg-neutral-100" aria-hidden="true" /></td>
              </tr>
            ))}

            {!loading && visibles.map((o, index) => (
              <tr
                key={o.id}
                tabIndex={0}
                onClick={() => onVerOrden?.(o)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onVerOrden?.(o) } }}
                aria-label={`Ver orden ${o.orden || ''} ${o.texto || ''}`.trim()}
                className="h-16 cursor-pointer align-middle transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:bg-tertiary-50/60"
                style={{ animation: rowAnimation(index) }}
              >
                <td className="px-5 py-2 text-sm font-medium capitalize text-ink-900">{fechaCorta(o.fecha)}</td>
                <td className="px-5 py-2 truncate text-sm font-semibold text-ink-900">{o.maquina || 'Sin máquina'}</td>
                <td className="px-5 py-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-700">
                    <span aria-hidden="true" className={`size-2 rounded-full ${TIPO_ORDEN_COLOR[o.tipo] || TIPO_ORDEN_COLOR.otro}`} />
                    {o.tipo === 'otro' ? 'Otro' : o.tipo}
                  </span>
                </td>
                <td className="px-5 py-2"><p className="line-clamp-2 text-sm leading-snug text-ink-700" title={o.texto}>{o.texto || `Orden ${o.orden}`}</p></td>
                <td className="px-5 py-2"><EstadoOrdenBadge estado={o.estado} /></td>
              </tr>
            ))}

            {!loading && visibles.length === 0 && (
              <tr>
                <td colSpan={5} className="h-[320px] px-5 py-12 text-center">
                  <div className="kof-fade mx-auto flex max-w-sm flex-col items-center gap-2">
                    <span className="grid size-11 place-items-center rounded-full bg-neutral-100 text-ink-400">
                      <ClipboardX className="size-5" aria-hidden="true" />
                    </span>
                    <p className="text-sm font-semibold text-ink-800">
                      {estado === 'todos' ? 'No hay órdenes de SAP en este periodo' : 'No hay órdenes con este estado'}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Paginacion
        page={pageSafe}
        totalPages={totalPages}
        from={filtradas.length === 0 ? 0 : inicio + 1}
        to={Math.min(inicio + PAGE_SIZE, filtradas.length)}
        total={filtradas.length}
        onPageChange={goPage}
      />
    </Card>
  )
}
