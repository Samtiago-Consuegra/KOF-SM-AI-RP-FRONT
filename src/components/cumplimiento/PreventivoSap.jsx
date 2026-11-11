import { useEffect, useState } from 'react'
import { CalendarDays } from 'lucide-react'
import Card from '../ui/Card.jsx'
import Skeleton from '../ui/Skeleton.jsx'
import MotorVacio from '../ui/MotorVacio.jsx'
import useCountUp from '../../hooks/useCountUp.js'
import CumplimientoChart from './CumplimientoChart.jsx'
import Paginacion from './Paginacion.jsx'
import { getCumplimientoSap } from '../../api/motor.js'
import { adaptarCumplimientoSap } from '../../api/motorAdapter.js'

const POR_PAGINA = 10
const SEMANAS_VISIBLES = 13

const TIPOS = [
  { clave: 'preventiva', label: 'Preventiva', color: '#0D9488' },
  { clave: 'predictiva', label: 'Predictiva', color: '#111827' },
  { clave: 'correctiva', label: 'Correctiva', color: '#F40000' },
]

const ESTILOS = `
@keyframes kof-sap-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
.kof-sap-in { animation: kof-sap-in 360ms cubic-bezier(0.22, 1, 0.36, 1) both; }
.kof-sap-bar { transform-origin: left; animation: kof-sap-grow 520ms cubic-bezier(0.22, 1, 0.36, 1) both; }
@keyframes kof-sap-grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@media (prefers-reduced-motion: reduce) {
  .kof-sap-in { animation: kof-sap-fade 160ms ease both; }
  .kof-sap-bar { animation: none; }
}
@keyframes kof-sap-fade { from { opacity: 0; } to { opacity: 1; } }
`

const fmtPct = (v) => (v === null || v === undefined ? '—' : `${Math.round(v)} %`)

function formatFecha(iso) {
  if (!iso) return '—'
  const d = new Date(String(iso).slice(0, 10) + 'T00:00:00')
  return Number.isNaN(d.getTime()) ? String(iso) : d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

function BarraMezcla({ titulo, mezcla }) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-500">{titulo}</p>
      <div
        className="kof-sap-bar flex h-2.5 overflow-hidden rounded-full bg-neutral-100"
        role="img"
        aria-label={`${titulo}: ${TIPOS.map((t) => `${t.label} ${fmtPct(mezcla[t.clave])}`).join(', ')}`}
      >
        {TIPOS.map((t) => (
          <span key={t.clave} style={{ width: `${mezcla[t.clave] || 0}%`, background: t.color }} />
        ))}
      </div>
      <div className="mt-1 flex flex-wrap gap-x-3 text-[11px] text-ink-500 tabular-nums">
        {TIPOS.map((t) => (
          <span key={t.clave}>
            <span style={{ color: t.color }} aria-hidden="true">●</span> {t.label} {fmtPct(mezcla[t.clave])}
          </span>
        ))}
      </div>
    </div>
  )
}

function TarjetaMaquina({ m, index }) {
  const pct = useCountUp(Math.round(m.cumplimientoPct ?? 0))
  return (
    <Card className="kof-sap-in flex flex-col gap-4 p-5" style={{ animationDelay: `${index * 50}ms` }}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-bold text-ink-900">{m.maquina}</h3>
        <span className="rounded-full bg-tertiary-50 px-2 py-0.5 text-[11px] font-semibold text-tertiary-700 tabular-nums">
          13 sem: {fmtPct(m.cumplimiento13Pct)}
        </span>
      </div>
      <div>
        <p className="text-3xl font-bold tracking-tight text-primary-500 tabular-nums">
          {m.cumplimientoPct === null ? '—' : `${pct}%`}
        </p>
        <p className="text-xs text-ink-500 tabular-nums">
          {m.ejecutadas} ejecutadas · {m.noEjecutadas} no ejecutadas
        </p>
      </div>
      <BarraMezcla titulo="Órdenes" mezcla={m.mezclaOrdenes} />
      <BarraMezcla titulo="Costo" mezcla={m.mezclaCosto} />
    </Card>
  )
}

function TablaPendientes({ pendientes }) {
  const [page, setPage] = useState(1)
  const total = pendientes.length
  const totalPages = Math.max(1, Math.ceil(total / POR_PAGINA))
  const inicio = (page - 1) * POR_PAGINA
  const visibles = pendientes.slice(inicio, inicio + POR_PAGINA)

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-neutral-200 px-5 py-4">
        <h2 className="text-lg font-bold text-ink-900">Órdenes pendientes</h2>
        <p className="text-sm text-ink-500">No ejecutadas y abiertas vencidas en SAP.</p>
      </div>
      {total === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-ink-500">No hay órdenes pendientes.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-[#F8F9FA] text-xs uppercase tracking-wider text-ink-500">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">Orden</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Máquina</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Plan</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Texto</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Fecha programada</th>
                  <th scope="col" className="px-5 py-3 text-right font-semibold">Días vencida</th>
                </tr>
              </thead>
              <tbody key={page} className="divide-y divide-neutral-100">
                {visibles.map((p, i) => (
                  <tr key={p.id} className="kof-sap-in transition-colors hover:bg-neutral-50" style={{ animationDelay: `${i * 25}ms` }}>
                    <td className="px-5 py-3 font-mono text-xs text-ink-900">{p.orden}</td>
                    <td className="px-3 py-3 text-ink-700">{p.maquina}</td>
                    <td className="px-3 py-3 text-ink-700">{p.plan || '—'}</td>
                    <td className="max-w-[320px] truncate px-3 py-3 text-ink-700" title={p.texto}>{p.texto}</td>
                    <td className="px-3 py-3 text-ink-700 tabular-nums">{formatFecha(p.fechaProgramada)}</td>
                    <td className="px-5 py-3 text-right font-semibold text-primary-600 tabular-nums">{p.diasVencida ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Paginacion
            page={page}
            totalPages={totalPages}
            from={inicio + 1}
            to={Math.min(inicio + POR_PAGINA, total)}
            total={total}
            onPageChange={setPage}
          />
        </>
      )}
    </Card>
  )
}

export default function PreventivoSap() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false
    getCumplimientoSap()
      .then((res) => { if (!ignore) setData(adaptarCumplimientoSap(res)) })
      .catch((e) => { if (!ignore) setError(e?.message || 'No se pudo cargar el cumplimiento SAP') })
    return () => { ignore = true }
  }, [])

  if (error) return <MotorVacio message={error} />

  if (!data) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[248px]" />)}
        </div>
        <Skeleton className="h-[380px]" />
      </div>
    )
  }

  if (!data.available || data.calculando) {
    return <MotorVacio message={data.message || 'El motor aún no tiene datos del preventivo SAP.'} />
  }

  const semanas = [...new Set(data.semanal.map((d) => d.semana))].sort().slice(-SEMANAS_VISIBLES)
  const semanal = data.semanal.filter((d) => semanas.includes(d.semana))

  return (
    <div className="space-y-6">
      <style>{ESTILOS}</style>

      {data.datosHasta && (
        <p className="kof-sap-in inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-700">
          <CalendarDays className="size-3.5 text-tertiary-600" aria-hidden="true" />
          Datos hasta {formatFecha(data.datosHasta)}
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        {data.maquinas.map((m, i) => <TarjetaMaquina key={m.maquina} m={m} index={i} />)}
      </div>

      <div className="grid gap-6 2xl:grid-cols-2">
        <CumplimientoChart
          data={semanal}
          titulo="Cumplimiento semanal SAP"
          subtitulo={`Órdenes preventivas ejecutadas por semana (últimas ${SEMANAS_VISIBLES}).`}
          unidad="órdenes"
        />
        <CumplimientoChart
          data={data.trimestral}
          titulo="Cumplimiento trimestral SAP"
          subtitulo="Órdenes preventivas ejecutadas por trimestre."
          unidad="órdenes"
        />
      </div>

      <TablaPendientes pendientes={data.pendientes} />
    </div>
  )
}
