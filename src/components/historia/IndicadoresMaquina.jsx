import { TrendingDown, TrendingUp } from 'lucide-react'
import useCountUp from '../../hooks/useCountUp.js'
import ParosPorMesChart from './ParosPorMesChart.jsx'

function ValorAnimado({ value, decimals = 0, suffix = '' }) {
  const animado = useCountUp(Math.round((value ?? 0) * (decimals ? 10 : 1)))
  const shown = decimals ? (animado / 10).toFixed(1) : animado
  return <>{shown}{suffix}</>
}

function IndicadorCard({ label, value, decimals, suffix, captionKey, captionFn, promedio, higherBetter }) {
  const favorable = value === promedio ? null : (higherBetter ? value > promedio : value < promedio)
  const Icon = favorable === false ? TrendingDown : TrendingUp
  const iconCls = favorable === false ? 'text-primary-500' : 'text-tertiary-600'
  const esMtbf = captionKey === 'mtbf'
  const mtbfTexto = esMtbf && !value ? 'Sin fallas en el periodo' : null

  return (
    <div className="rounded-xl bg-neutral-50 p-4 flex flex-col justify-between min-h-[120px]">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-ink-500">{label}</p>
        <p className="mt-1 text-2xl font-bold text-ink-900 tabular-nums">
          {esMtbf && !value ? '–' : <ValorAnimado value={value} decimals={decimals} suffix={suffix} />}
        </p>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-xs text-ink-500">
          {mtbfTexto ?? captionFn(promedio)}
        </span>
        <Icon className={`size-4 shrink-0 ${iconCls}`} aria-hidden="true" />
      </div>
    </div>
  )
}

function IndicadoresSkeleton() {
  return (
    <div className="h-full rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="p-6">
        <div className="h-6 w-56 animate-pulse rounded bg-neutral-100" />
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-[120px] animate-pulse rounded-xl bg-neutral-50" />)}
        </div>
        <div className="mt-6 h-[280px] animate-pulse rounded-xl bg-neutral-50" />
      </div>
    </div>
  )
}

const CAPTIONS = {
  promedio: (l) => <span>Promedio línea: {l}</span>,
}

export default function IndicadoresMaquina({ indicadores, parosPorMes, loading, alcance }) {
  if (loading || !indicadores || !parosPorMes) return <IndicadoresSkeleton />

  const { maquina, sistemaNombre, componenteNombre } = alcance ?? {}
  const tituloIndicadores = componenteNombre
    ? (sistemaNombre
        ? `Indicadores · ${sistemaNombre} · ${componenteNombre}`
        : `Indicadores · ${componenteNombre}`)
    : sistemaNombre
      ? `Indicadores · ${sistemaNombre}`
      : 'Indicadores de la máquina'

  const cards = [
    { label: 'Fallas', key: 'fallas', value: indicadores.fallas, higherBetter: false },
    { label: 'Minutos de paro', key: 'minutosParo', value: indicadores.minutosParo, suffix: ' min', higherBetter: false },
    { label: 'MTBF', key: 'mtbf', value: indicadores.mtbf, suffix: ' h', higherBetter: true },
    { label: 'MTTR', key: 'mttr', value: indicadores.mttr, suffix: ' min', higherBetter: false },
    { label: 'Disponibilidad', key: 'disponibilidad', value: indicadores.disponibilidad, decimals: 1, suffix: '%', higherBetter: true },
    { label: 'Cumplimiento plan', key: 'cumplimientoPlan', value: indicadores.cumplimientoPlan, suffix: '%', higherBetter: true },
  ]

  return (
    <div className="h-full rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-ink-900">{tituloIndicadores}</h2>

        {/* 6 stat cards: 3×2 en desktop, 2 en tablet, 1 en móvil */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((c) => (
            <IndicadorCard
              key={c.key}
              label={c.label}
              value={c.value}
              decimals={c.decimals}
              suffix={c.suffix}
              promedio={indicadores.promedioLinea}
              higherBetter={c.higherBetter}
              captionFn={(promedio) => CAPTIONS.promedio(promedio)}
            />
          ))}
        </div>

        {/* Gráfica de paros por mes, ampliable */}
        <div className="mt-6">
          <ParosPorMesChart
            data={parosPorMes}
            contexto={`${maquina}${sistemaNombre ? ` · ${sistemaNombre}` : ''}${componenteNombre ? ` · ${componenteNombre}` : ''} · Últimos 12 meses`}
          />
        </div>
      </div>
    </div>
  )
}
