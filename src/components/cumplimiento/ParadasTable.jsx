import { useEffect, useState } from 'react'
import { CalendarX2, CheckCircle2, Circle, ListChecks } from 'lucide-react'
import Card from '../ui/Card.jsx'
import Dropdown from '../ui/Dropdown.jsx'
import EstadoBadge from './EstadoBadge.jsx'
import AccionesParada from './AccionesParada.jsx'
import AlertaCumplidaParcial from './AlertaCumplidaParcial.jsx'
import LeyendaReprogramada from './LeyendaReprogramada.jsx'
import Paginacion from './Paginacion.jsx'
import Tooltip from './Tooltip.jsx'
import { getParadas, MAQUINAS_CRITICAS } from '../../services/cumplimientoService.js'
import { formatFechaHabil, formatRangoHoras } from '../../utils/weeks.js'

const PAGE_SIZE = 5

const ESTADO_OPTIONS = [
  { value: 'todos', label: 'Todos los estados' },
  { value: 'Pendiente', label: 'Pendiente' },
  { value: 'En ejecución', label: 'En ejecución' },
  { value: 'Vencida', label: 'Vencida' },
  { value: 'Cumplida', label: 'Cumplida' },
]

const MAQUINA_OPTIONS = [
  { value: 'todas', label: 'Todas las máquinas' },
  ...MAQUINAS_CRITICAS.map((m) => ({ value: m, label: m })),
]

function TooltipTareas({ tareas }) {
  return (
    <span className="block space-y-1.5">
      <span className="block font-semibold text-ink-900">Tareas de la parada</span>
      {tareas.length === 0 && <span className="block text-ink-500">Sin tareas registradas.</span>}
      {tareas.map((t) => (
        <span key={t.id} className="flex items-start gap-1.5">
          {t.completada ? (
            <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-tertiary-600" aria-hidden="true" />
          ) : (
            <Circle className="mt-0.5 size-3 shrink-0 text-ink-400" aria-hidden="true" />
          )}
          <span className="min-w-0">
            <span className={`block font-medium ${t.completada ? 'text-ink-800' : 'text-ink-600'}`}>{t.nombre}</span>
            <span className="block text-ink-500">{t.componente}</span>
          </span>
        </span>
      ))}
    </span>
  )
}

export default function ParadasTable({ refreshKey = 0, onRegistrar, onReprogramar, onVerDetalle }) {
  const [estado, setEstado] = useState('todos')
  const [maquina, setMaquina] = useState('todas')
  const [page, setPage] = useState(1)
  const [direction, setDirection] = useState('right')
  const [selectedId, setSelectedId] = useState(null)
  const [paradas, setParadas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false
    setLoading(true)
    getParadas({ estado, maquina })
      .then((res) => {
        if (ignore) return
        setParadas(res)
        setLoading(false)
      })
      .catch(() => {
        if (ignore) return
        setParadas([])
        setLoading(false)
      })
    return () => { ignore = true }
  }, [estado, maquina, refreshKey])

  const totalPages = Math.max(1, Math.ceil(paradas.length / PAGE_SIZE))
  const pageSafe = Math.min(page, totalPages)
  const inicio = (pageSafe - 1) * PAGE_SIZE
  const visibles = paradas.slice(inicio, inicio + PAGE_SIZE)
  const from = paradas.length === 0 ? 0 : inicio + 1
  const to = Math.min(inicio + PAGE_SIZE, paradas.length)

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const resetVista = () => {
    setPage(1)
    setDirection('right')
    setSelectedId(null)
  }

  const handleEstado = (value) => {
    setEstado(value)
    resetVista()
  }

  const handleMaquina = (value) => {
    setMaquina(value)
    resetVista()
  }

  const limpiarFiltros = () => {
    setEstado('todos')
    setMaquina('todas')
    resetVista()
  }

  const goPage = (next) => {
    setDirection(next > pageSafe ? 'right' : 'left')
    setPage(next)
    setSelectedId(null)
  }

  const filtrosActivos = estado !== 'todos' || maquina !== 'todas'
  const rowAnimation = (index) =>
    `${direction === 'right' ? 'cum-row-in-right' : 'cum-row-in-left'} 240ms ease-out ${index * 30}ms both`

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-neutral-200 px-5 py-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink-900">Seguimiento de paradas</h2>
          <p className="text-sm text-ink-500">5 filas por página · ordenadas por fecha de inicio.</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <Dropdown
            label="Estado"
            value={estado}
            onChange={handleEstado}
            options={ESTADO_OPTIONS}
            className="w-full sm:w-48"
          />
          <Dropdown
            label="Máquina"
            value={maquina}
            onChange={handleMaquina}
            options={MAQUINA_OPTIONS}
            className="w-full sm:w-52"
          />
          {filtrosActivos && (
            <button
              type="button"
              onClick={limpiarFiltros}
              className="h-10 rounded-xl px-2 text-xs font-semibold text-primary-700 hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto scroll-thin">
        <table className="w-full min-w-[1040px] table-fixed text-sm">
          <colgroup>
            <col className="w-[20%]" />
            <col className="w-[28%]" />
            <col className="w-[17%]" />
            <col className="w-[17%]" />
            <col className="w-[18%]" />
          </colgroup>
          <thead className="bg-neutral-50 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-500">
            <tr>
              <th scope="col" className="px-5 py-3">Máquina</th>
              <th scope="col" className="px-5 py-3">Título parada</th>
              <th scope="col" className="px-5 py-3">Programación</th>
              <th scope="col" className="px-5 py-3">Estado</th>
              <th scope="col" aria-label="Acciones" className="px-5 py-3">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody
            key={`${estado}-${maquina}-${pageSafe}-${refreshKey}`}
            className="divide-y divide-neutral-100"
          >
            {loading && Array.from({ length: PAGE_SIZE }).map((_, index) => (
              <tr key={`skeleton-${index}`} className="h-24">
                <td colSpan={5} className="px-5 py-3">
                  <div
                    className="h-16 animate-pulse rounded-xl bg-neutral-100"
                    aria-hidden="true"
                  />
                </td>
              </tr>
            ))}

            {!loading && visibles.map((p, index) => {
              const tareas = p.tareas || []
              const isSelected = selectedId === p.id
              const tieneReprogramacion = !!p.reprogramadaA || (p.historialReprogramaciones || []).length > 0

              return (
                <tr
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className={`h-24 cursor-pointer align-middle transition-colors ${
                    isSelected ? 'bg-primary-50/40' : 'hover:bg-neutral-50'
                  }`}
                  style={{ animation: rowAnimation(index) }}
                >
                  <td className="px-5 py-3">
                    <p className="truncate text-sm font-semibold text-ink-900" title={`${p.maquina} · ${p.sistema}`}>
                      {p.maquina}
                      <span className="px-1 font-normal text-ink-400">·</span>
                      <span className="font-medium text-ink-600">{p.sistema}</span>
                    </p>
                    <p className="mt-0.5 truncate text-xs text-ink-500" title={p.componente}>{p.componente}</p>
                  </td>

                  <td className="px-5 py-3">
                    <p className="line-clamp-2 text-sm font-semibold leading-snug text-ink-900" title={p.titulo}>
                      {p.titulo}
                    </p>
                    <div className="mt-1 flex min-w-0 items-center gap-2">
                      <span className="shrink-0 text-[11px] text-ink-400">{p.ordenSap}</span>
                      <Tooltip content={<TooltipTareas tareas={tareas} />} width="w-80">
                        <button
                          type="button"
                          onClick={(event) => event.stopPropagation()}
                          aria-label={`Ver las ${tareas.length} tareas de la parada`}
                          className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-ink-600 hover:bg-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400"
                        >
                          <ListChecks className="size-3" aria-hidden="true" />
                          +{tareas.length} tareas
                        </button>
                      </Tooltip>
                    </div>
                  </td>

                  <td className="px-5 py-3">
                    <p className="truncate text-sm font-medium text-ink-900">{formatFechaHabil(p.inicio)}</p>
                    <p className="mt-0.5 whitespace-nowrap text-xs text-ink-500">{formatRangoHoras(p.inicio, p.finProg)}</p>
                    <p className="mt-0.5 text-[11px] text-ink-400">{p.tipo}</p>
                  </td>

                  <td className="px-5 py-3">
                    <EstadoBadge estado={p.estado} />
                    {p.cumplidaParcial && (
                      <div className="mt-1">
                        <AlertaCumplidaParcial parada={p} compact />
                      </div>
                    )}
                    {tieneReprogramacion && (
                      <div className="mt-1">
                        <LeyendaReprogramada parada={p} onVerHistorial={onVerDetalle} />
                      </div>
                    )}
                  </td>

                  <td className="px-5 py-3">
                    <div className="flex justify-end">
                      <AccionesParada
                        parada={p}
                        onRegistrar={onRegistrar}
                        onReprogramar={onReprogramar}
                        onVerDetalle={onVerDetalle}
                      />
                    </div>
                  </td>
                </tr>
              )
            })}

            {!loading && visibles.length === 0 && (
              <tr>
                <td colSpan={5} className="h-[480px] px-5 py-12 text-center">
                  <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
                    <span className="grid size-11 place-items-center rounded-full bg-neutral-100 text-ink-400">
                      <CalendarX2 className="size-5" aria-hidden="true" />
                    </span>
                    <p className="text-sm font-semibold text-ink-800">No hay paradas con estos filtros</p>
                    <p className="text-xs text-ink-500">
                      Prueba con otro estado u otra máquina para ver el seguimiento.
                    </p>
                    {filtrosActivos && (
                      <button
                        type="button"
                        onClick={limpiarFiltros}
                        className="mt-1 text-xs font-semibold text-primary-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400 rounded"
                      >
                        Limpiar filtros
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}

            {!loading && visibles.length > 0 && visibles.length < PAGE_SIZE &&
              Array.from({ length: PAGE_SIZE - visibles.length }).map((_, index) => (
                <tr key={`spacer-${index}`} aria-hidden="true" className="h-24">
                  <td colSpan={5} />
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <Paginacion
        page={pageSafe}
        totalPages={totalPages}
        from={from}
        to={to}
        total={paradas.length}
        onPageChange={goPage}
      />
    </Card>
  )
}
