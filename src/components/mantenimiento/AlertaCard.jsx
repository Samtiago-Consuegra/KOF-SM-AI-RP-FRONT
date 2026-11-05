import { RefreshCcw, TrendingUp, Stethoscope, CalendarRange, ClipboardX, ShieldAlert, Lightbulb } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const ICONS = { RefreshCcw, TrendingUp, Stethoscope, CalendarRange, ClipboardX, ShieldAlert, Lightbulb }
const COLORS = { tertiary: 'text-tertiary-600 bg-tertiary-50', 'primary-500': 'text-primary-500 bg-primary-50', 'primary-700': 'text-primary-700 bg-primary-50', 'ink-700': 'text-ink-700 bg-ink-50', 'primary-600': 'text-primary-600 bg-primary-50', 'ink-900': 'text-ink-900 bg-neutral-100', 'tertiary-700': 'text-tertiary-700 bg-tertiary-50' }
const TOOLTIPS = {
  'Ciclo': 'Lleva sin avisos entre 0,5 y 0,8 de su intervalo habitual entre fallas.',
  'Paros en aumento': 'Los minutos de paro de las últimas 4 semanas son 1,5 veces o más el promedio.',
  'Síntomas': 'El mismo síntoma se repite el doble de lo normal en las últimas 8 semanas.',
  'Estacionalidad': 'En las mismas 6 semanas del año pasado hubo 2 o más avisos.',
  'Cumplimiento': 'Una tarea predictiva vence pronto, o hay tareas preventivas acumuladas sin ejecutar.',
  'Brecha del plan': 'Un componente crítico tiene un plan preventivo que no está a la altura de su comportamiento de fallas.',
  'Oportunidad': 'Hay tareas que se pueden agrupar en una parada de la semana.',
}

export default function AlertaCard({ alerta }) {
  const nav = useNavigate()
  if (!alerta) return null
  const Icon = ICONS[alerta.icon] || RefreshCcw
  const c = COLORS[alerta.color] || 'text-ink-700 bg-neutral-100'
  const tip = TOOLTIPS[alerta.tipo] || ''
  return (
    <article aria-roledescription="alerta" className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm w-[320px] sm:w-[420px] h-[168px] flex flex-col" title={tip}>
      <div className="flex items-start gap-3 min-h-0">
        <div className={"h-9 w-9 rounded-full grid place-items-center shrink-0 " + c}><Icon className="size-4" /></div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <p className="text-sm font-semibold text-ink-900 shrink-0">{alerta.tipo}</p>
            <span className="text-xs text-ink-400 shrink-0">·</span>
            <p className="text-xs text-ink-500 truncate" title={`${alerta.maquina} · ${alerta.componente}`}>{alerta.maquina} · {alerta.componente}</p>
          </div>
          <p className="mt-1 text-sm text-ink-700 line-clamp-2">{alerta.mensaje}</p>
          <p className="mt-1 text-xs text-ink-500 truncate" title={alerta.disparado}>{alerta.disparado}</p>
        </div>
      </div>
      <div className="mt-auto pt-2">
        <button onClick={() => nav(alerta.accionRuta || '/mantenimiento')} className="text-sm text-primary-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400 rounded">{alerta.accion}</button>
      </div>
    </article>
  )
}
