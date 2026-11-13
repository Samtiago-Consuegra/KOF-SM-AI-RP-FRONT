import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import Paginacion from '../ui/Paginacion.jsx'
import ComponenteDetalleModal from './ComponenteDetalleModal.jsx'
import { getComponentesMotor } from '../../services/historiaClinicaService.js'

const PAGE_SIZE = 6

function Skeleton() {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="h-6 w-48 animate-pulse rounded bg-neutral-100" />
      <div className="mt-4 flex gap-2">{[0, 1, 2].map((i) => <div key={i} className="h-8 w-24 animate-pulse rounded-full bg-neutral-100" />)}</div>
      <div className="mt-4 space-y-3">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-20 w-full animate-pulse rounded-xl bg-neutral-50" />)}
      </div>
    </div>
  )
}

const fechaCorta = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })

/**
 * Componentes de la máquina según el motor (Fase 14). Los chips solo cambian esta tarjeta:
 * arrancan en la máquina de la página y se sincronizan cuando la página cambia de máquina.
 */
export default function ComponentesMaquina({ maquina }) {
  const [datos, setDatos] = useState(undefined) // undefined = cargando · null = el motor aún no tiene datos
  const [chip, setChip] = useState(maquina)
  const [pagina, setPagina] = useState(1)
  const [seleccionado, setSeleccionado] = useState(null)

  useEffect(() => {
    let vivo = true
    getComponentesMotor().then((d) => { if (vivo) setDatos(d) })
    return () => { vivo = false }
  }, [])

  useEffect(() => { setChip(maquina) }, [maquina])
  useEffect(() => { setPagina(1) }, [chip])

  if (datos === undefined) return <Skeleton />

  const maquinas = datos ? Object.keys(datos.porMaquina) : []
  const componentes = datos?.porMaquina[chip] ?? []
  const total = componentes.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const pageSafe = Math.min(pagina, totalPages)
  const inicio = (pageSafe - 1) * PAGE_SIZE
  const visibles = componentes.slice(inicio, inicio + PAGE_SIZE)

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm animate-[fade-swap-in_250ms_ease-out] motion-reduce:animate-none">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-ink-900">Componentes de la máquina</h2>

        {!datos ? (
          <p className="mt-4 rounded-xl bg-neutral-50 p-4 text-sm text-ink-500">
            Aún no hay resultados del motor. Sube los archivos de SAP en Mantenimiento.
          </p>
        ) : (
          <>
            <div role="radiogroup" aria-label="Máquina" className="mt-4 -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
              {maquinas.map((m) => {
                const activo = m === chip
                return (
                  <button
                    key={m}
                    type="button"
                    role="radio"
                    aria-checked={activo}
                    onClick={() => setChip(m)}
                    className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-[background-color,border-color,color,transform] duration-200 active:scale-[.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400 ${
                      activo ? 'border-ink-900 bg-ink-900 text-white' : 'border-neutral-200 bg-white text-ink-700 hover:bg-neutral-50'
                    }`}
                  >
                    {m}
                    <span className={`min-w-5 rounded-full px-1.5 text-[11px] tabular-nums transition-colors ${activo ? 'bg-white/15 text-white' : 'bg-neutral-100 text-ink-500'}`}>
                      {datos.porMaquina[m].length}
                    </span>
                  </button>
                )
              })}
            </div>

            <div key={chip} className="mt-3 space-y-2">
              {total === 0 ? (
                <p className="rounded-xl bg-neutral-50 p-4 text-sm text-ink-500">El motor no tiene componentes registrados para esta máquina.</p>
              ) : (
                visibles.map((c, i) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSeleccionado(c)}
                    className="group block w-full cursor-pointer rounded-xl border border-neutral-200 p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400 motion-reduce:hover:translate-y-0 animate-[fade-swap-in_250ms_ease-out_both] motion-reduce:animate-none"
                    style={{ animationDelay: `${Math.min(i, 6) * 40}ms` }}
                    aria-label={`Ver antecedentes de ${c.nombre}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="min-w-0 truncate font-semibold text-ink-900" title={c.nombre}>{c.nombre}</span>
                      <ChevronRight className="size-4 shrink-0 text-ink-400 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary-500 motion-reduce:transition-none" aria-hidden="true" />
                    </div>
                    <p className="truncate text-xs text-ink-400" title={c.sistema}>{c.sistema}</p>
                    <div className="mt-0.5 text-xs text-ink-500">
                      {c.eventos} eventos
                      {' · '}
                      {c.datosSuficientes && c.mtbfMedianaH != null ? `MTBF ${Math.round(c.mtbfMedianaH)} h` : 'Pocos datos'}
                      {c.ultimoEvento && <> · Último evento {fechaCorta(c.ultimoEvento)}</>}
                    </div>
                  </button>
                ))
              )}
            </div>
          </>
        )}

        <div className="mt-4">
          <Link
            to="/predicciones"
            className="text-sm font-medium text-primary-600 underline underline-offset-2 transition-colors hover:text-primary-700"
          >
            Ver confiabilidad por componente
          </Link>
        </div>
      </div>
      {total > PAGE_SIZE && (
        <Paginacion
          page={pageSafe}
          totalPages={totalPages}
          from={total === 0 ? 0 : inicio + 1}
          to={Math.min(inicio + PAGE_SIZE, total)}
          total={total}
          onPageChange={setPagina}
          label="Paginación de componentes de la máquina"
        />
      )}

      <ComponenteDetalleModal componente={seleccionado} onClose={() => setSeleccionado(null)} />
    </div>
  )
}
