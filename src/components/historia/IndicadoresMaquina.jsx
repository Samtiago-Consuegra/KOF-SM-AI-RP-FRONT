import { TrendingDown, TrendingUp } from 'lucide-react'
import useCountUp from '../../hooks/useCountUp.js'
import ParosPorMesChart from './ParosPorMesChart.jsx'
import { POCOS_DATOS } from '../../api/motorAdapter.js'

function ValorAnimado({ value, decimals = 0, suffix = '' }) {
  const animado = useCountUp(Math.round((value ?? 0) * (decimals ? 10 : 1)))
  const shown = decimals ? (animado / 10).toFixed(1) : animado
  return <>{shown}{suffix}</>
}

const ENTRADA = 'animate-[fade-swap-in_220ms_cubic-bezier(0.22,1,0.36,1)_both]'

// Chip neutro cuando el motor marca Datos_suficientes=false
function ChipPocosDatos() {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-neutral-200 bg-[#F8F9FA] px-2.5 py-1 text-sm font-semibold text-[#111827]/70 ${ENTRADA}`}
      title="El motor no tiene suficientes eventos para este indicador"
    >
      {POCOS_DATOS}
    </span>
  )
}

function IndicadorCard({ label, value, decimals, suffix, caption, secundario, promedio, higherBetter, index = 0 }) {
  const pocos = value === POCOS_DATOS
  const hayComparacion = !pocos && typeof promedio === 'number' && typeof value === 'number'
  const favorable = !hayComparacion || value === promedio ? null : (higherBetter ? value > promedio : value < promedio)
  const Icon = favorable === false ? TrendingDown : TrendingUp
  const iconCls = favorable === false ? 'text-primary-500' : 'text-tertiary-600'

  return (
    <div
      className={`rounded-xl bg-neutral-50 p-4 flex flex-col justify-between min-h-[120px] ${ENTRADA}`}
      style={{ animationDelay: `${Math.min(index, 5) * 40}ms` }}
    >
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-ink-500">{label}</p>
        <p className="mt-1 text-2xl font-bold text-ink-900 tabular-nums">
          {pocos
            ? <ChipPocosDatos />
            : (value === null || value === undefined ? '–' : <ValorAnimado value={value} decimals={decimals} suffix={suffix} />)}
        </p>
        {secundario && !pocos && (
          <p className={`mt-0.5 text-xs text-ink-500 tabular-nums ${ENTRADA}`} style={{ animationDelay: '80ms' }}>{secundario}</p>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-xs text-ink-500">
          {hayComparacion ? <span>Promedio línea: {promedio}</span> : caption}
        </span>
        {hayComparacion && <Icon className={`size-4 shrink-0 ${iconCls}`} aria-hidden="true" />}
      </div>
    </div>
  )
}

const TENDENCIA_CHIP = {
  'Empeora': 'bg-[#F40000]/10 text-[#F40000]',
  'Mejora': 'bg-[#0D9488]/10 text-[#0D9488]',
}

// Lectura del motor: tendencia, forma de falla (β de Weibull) y confianza
function LecturaMotor({ indicadores }) {
  const items = [
    indicadores.tendencia && {
      k: 'tendencia',
      label: 'Tendencia',
      texto: indicadores.tendencia,
      cls: TENDENCIA_CHIP[indicadores.tendencia] ?? 'bg-[#F8F9FA] text-[#111827]/75 border border-neutral-200',
    },
    indicadores.formaFalla && {
      k: 'forma',
      label: 'Forma de falla',
      texto: typeof indicadores.weibullBeta === 'number'
        ? `${indicadores.formaFalla} · β ${indicadores.weibullBeta.toFixed(2)}`
        : indicadores.formaFalla,
      cls: 'bg-[#F8F9FA] text-[#111827]/80 border border-neutral-200',
    },
    indicadores.confianza && {
      k: 'confianza',
      label: 'Confianza',
      texto: indicadores.confianza,
      cls: 'bg-[#F8F9FA] text-[#111827]/80 border border-neutral-200',
    },
  ].filter(Boolean)
  if (!items.length) return null
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {items.map((it, i) => (
        <span
          key={it.k}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs ${it.cls} ${ENTRADA}`}
          style={{ animationDelay: `${240 + i * 40}ms` }}
        >
          <span className="font-medium opacity-70">{it.label}:</span>
          <span className="font-semibold">{it.texto}</span>
        </span>
      ))}
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

const fmt1 = (v) => (typeof v === 'number' ? (Math.round(v * 10) / 10).toLocaleString('es-CO') : v)

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

  // Valores tal como los entrega el motor; las tarjetas sin dato del motor (null) no se muestran
  const esComponente = indicadores.nivel === 'componente'
  const cards = [
    { label: 'Eventos de paro', key: 'fallas', value: indicadores.fallas, higherBetter: false, caption: 'Histórico del motor' },
    { label: 'Minutos de paro', key: 'minutosParo', value: indicadores.minutosParo, suffix: ' min', higherBetter: false, caption: 'Histórico del motor' },
    {
      label: 'MTTR (mediana)',
      key: 'mttr',
      value: indicadores.mttr,
      decimals: 1,
      suffix: ' min',
      higherBetter: false,
      secundario: typeof indicadores.mttrMedia === 'number' ? `Media ${fmt1(indicadores.mttrMedia)} min` : null,
      caption: 'Minutos por evento',
    },
    esComponente && { label: 'MTBF (mediana)', key: 'mtbf', value: indicadores.mtbf, decimals: 1, suffix: ' días', higherBetter: true, caption: 'Días operativos entre eventos' },
    indicadores.disponibilidad !== null && indicadores.disponibilidad !== undefined && { label: 'Disponibilidad', key: 'disponibilidad', value: indicadores.disponibilidad, decimals: 1, suffix: '%', higherBetter: true },
    indicadores.cumplimientoPlan !== null && indicadores.cumplimientoPlan !== undefined && { label: 'Cumplimiento plan', key: 'cumplimientoPlan', value: indicadores.cumplimientoPlan, suffix: '%', higherBetter: true },
  ].filter(Boolean)

  return (
    <div className="h-full rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-ink-900">{tituloIndicadores}</h2>

        <LecturaMotor indicadores={indicadores} />

        {/* Stat cards: hasta 4 por fila en desktop, 2 en tablet, 1 en móvil */}
        <div className={`mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 ${cards.length >= 4 ? 'xl:grid-cols-4' : 'xl:grid-cols-3'}`}>
          {cards.map((c, i) => (
            <IndicadorCard
              key={c.key}
              index={i}
              label={c.label}
              value={c.value}
              decimals={c.decimals}
              suffix={c.suffix}
              caption={c.caption}
              secundario={c.secundario}
              promedio={indicadores.promedioLinea}
              higherBetter={c.higherBetter}
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
