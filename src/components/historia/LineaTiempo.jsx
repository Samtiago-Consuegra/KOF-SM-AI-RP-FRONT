import { useEffect, useState } from 'react'
import { getEventosPaginados } from '../../services/historiaClinicaService'
import Paginacion from '../ui/Paginacion.jsx'

const TIPOS = ['Todo', 'Fallas', 'Avisos', 'Órdenes', 'Preventivos']
const PAGE_SIZE = 6

function BadgeEvento({ tipo, orden }) {
  let clase
  let texto
  if (tipo === 'PREVENTIVO') { clase = 'bg-tertiary-50 text-tertiary-700'; texto = `PREVENTIVO · ${orden ?? ''}` }
  else if (tipo === 'FALLA') { clase = 'bg-primary-50 text-primary-600'; texto = 'FALLA' }
  else if (tipo === 'CORRECTIVO') { clase = 'bg-primary-100 text-primary-800'; texto = `CORRECTIVO · ${orden ?? ''}` }
  else { clase = 'bg-ink-100 text-ink-700'; texto = 'AVISO' }

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${clase}`}>
      {texto}
    </span>
  )
}

function TimelineSkeleton() {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="p-6">
        <div className="h-6 w-40 animate-pulse rounded bg-neutral-100" />
        <div className="mt-4 space-y-4">
          {[0, 1, 2].map((i) => <div key={i} className="h-14 w-full animate-pulse rounded-xl bg-neutral-50" />)}
        </div>
      </div>
    </div>
  )
}

export default function LineaTiempo({ maquina, desde, hasta, periodoKey, loading }) {
  const [tipo, setTipo] = useState('Todo')
  const [eventos, setEventos] = useState([])
  const [pagina, setPagina] = useState(1)
  const [total, setTotal] = useState(0)
  const [cargando, setCargando] = useState(true)

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const pageSafe = Math.min(pagina, totalPages)
  const from = total === 0 ? 0 : (pageSafe - 1) * PAGE_SIZE + 1
  const to = Math.min(pageSafe * PAGE_SIZE, total)

  // Reinicia el tipo y la página cuando cambia máquina o periodo (la fuente cambia)
  useEffect(() => {
    if (loading) return
    setTipo('Todo')
    setPagina(1)
  }, [maquina, periodoKey, loading])

  useEffect(() => {
    if (loading) return
    let alive = true
    setCargando(true)
    getEventosPaginados({ maquina, tipo, desde, hasta, pagina, porPagina: PAGE_SIZE })
      .then((res) => {
        if (!alive) return
        setEventos(res.items)
        setTotal(res.total)
        setCargando(false)
      })
      .catch(() => {
        if (!alive) return
        setEventos([])
        setTotal(0)
        setCargando(false)
      })
    return () => { alive = false }
  }, [maquina, tipo, desde, hasta, pagina, loading])

  // Si al cambiar de filtro la página actual deja de existir, vuelve a la última válida.
  useEffect(() => {
    if (pagina > totalPages) setPagina(totalPages)
  }, [pagina, totalPages])

  const cambiarTipo = (t) => {
    setTipo(t)
    setPagina(1)
  }

  if (loading) return <TimelineSkeleton />

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-neutral-200 p-6 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-ink-900">Línea de tiempo</h2>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Filtrar por tipo de evento">
          {TIPOS.map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={tipo === t}
              onClick={() => cambiarTipo(t)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400 ${
                tipo === t ? 'bg-ink-900 text-white' : 'bg-white text-ink-700 hover:bg-neutral-100 border border-neutral-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {cargando ? (
        <div className="divide-y divide-neutral-200">
          {[0, 1, 2].map((i) => <div key={i} className="h-16 w-full animate-pulse rounded-lg bg-white" />)}
        </div>
      ) : (
        <div key={`${maquina}-${periodoKey}-${tipo}`} className="divide-y divide-neutral-200">
          {eventos.length === 0 ? (
            <div className="p-6 text-center text-sm text-ink-500">Esta máquina no tiene eventos de este tipo</div>
          ) : (
            eventos.map((evento, i) => (
              <div
                key={evento.id}
                className="flex gap-4 p-4 sm:p-6 animate-[fade-swap-in_250ms_ease-out_both]"
                style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
              >
                <div className="w-24 shrink-0 text-sm tabular-nums text-ink-500">
                  {new Date(`${evento.fecha}T12:00:00`).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <BadgeEvento tipo={evento.tipo} orden={evento.orden} />
                    <span className="font-semibold text-ink-900">{evento.titulo}</span>
                  </div>
                  <p className="mt-1 text-sm text-ink-500">{evento.detalle}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {total > PAGE_SIZE && (
        <Paginacion
          page={pageSafe}
          totalPages={totalPages}
          from={from}
          to={to}
          total={total}
          onPageChange={setPagina}
          label="Paginación de la línea de tiempo"
        />
      )}
    </div>
  )
}
