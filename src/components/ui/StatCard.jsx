import Card from './Card.jsx'

const TONES = {
  default: 'bg-neutral-100 text-ink-700',
  red: 'bg-primary-50 text-primary-600',
  amber: 'bg-amber-50 text-amber-600',
  teal: 'bg-tertiary-50 text-tertiary-600',
}
const VALUE_TONES = { default: 'text-ink-900', red: 'text-primary-600', amber: 'text-amber-600', teal: 'text-tertiary-600' }

export default function StatCard({ label, value, unit, caption, icon: Icon, tone = 'default', footer }) {
  return (
    <Card className="p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-ink-600">{label}</p>
        {Icon && (
          <span className={`size-9 rounded-xl grid place-items-center shrink-0 ${TONES[tone]}`}>
            <Icon className="size-[18px]" />
          </span>
        )}
      </div>
      <p className="flex items-baseline gap-2">
        <span className={`text-3xl font-bold tracking-tight tabular-nums ${VALUE_TONES[tone]}`}>{value}</span>
        {unit && <span className="text-sm text-ink-500">{unit}</span>}
      </p>
      {caption && <p className="text-xs text-ink-500">{caption}</p>}
      {footer}
    </Card>
  )
}
