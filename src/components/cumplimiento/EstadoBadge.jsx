export default function EstadoBadge({ estado }) {
  if (estado === 'Pendiente') {
    return <span className="inline-flex items-center rounded-full bg-ink-100 px-2.5 py-1 text-xs font-semibold text-ink-700">{estado}</span>
  }
  if (estado === 'Vencida') {
    return <span className="inline-flex items-center rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-600">{estado}</span>
  }
  if (estado === 'En ejecución') {
    return <span className="inline-flex items-center rounded-full bg-tertiary-50 px-2.5 py-1 text-xs font-semibold text-tertiary-700">{estado}</span>
  }
  return <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-ink-700">{estado}</span>
}
