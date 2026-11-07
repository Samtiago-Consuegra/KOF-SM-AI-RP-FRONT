import { AlertTriangle, CheckCircle2, Clock, Play } from 'lucide-react'

const CONFIG = {
  Pendiente: {
    Icon: Clock,
    className: 'bg-ink-100 text-ink-700',
  },
  'En ejecución': {
    Icon: Play,
    className: 'bg-tertiary-50 text-tertiary-700',
  },
  Vencida: {
    Icon: AlertTriangle,
    className: 'bg-primary-50 text-primary-600',
  },
  Cumplida: {
    Icon: CheckCircle2,
    className: 'bg-tertiary-100 text-tertiary-800',
  },
}

export default function EstadoBadge({ estado, className = '' }) {
  const config = CONFIG[estado] || {
    Icon: Clock,
    className: 'bg-neutral-100 text-ink-700',
  }
  const { Icon } = config

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${config.className} ${className}`}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      {estado}
    </span>
  )
}
