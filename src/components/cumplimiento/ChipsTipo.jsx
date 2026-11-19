import useCountUp from '../../hooks/useCountUp.js'
import { TIPO_ORDEN_COLOR } from '../mantenimiento/OrdenSapCard.jsx'

// Chips de cantidad por tipo (Preventiva, Correctiva, Predictiva) del encabezado de la gráfica.
// El número cuenta desde el valor anterior al cambiar el periodo o la máquina (useCountUp
// respeta prefers-reduced-motion).
function Chip({ tipo, n }) {
  const valor = useCountUp(n, 600)
  return (
    <li className="kof-fade inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-[#F8F9FA] px-2.5 py-1 text-xs font-medium text-ink-700">
      <span aria-hidden="true" className={`size-2 rounded-full ${TIPO_ORDEN_COLOR[tipo] || TIPO_ORDEN_COLOR.otro}`} />
      {tipo} <span className="tabular-nums text-ink-500">{valor}</span>
    </li>
  )
}

export default function ChipsTipo({ tipos, label }) {
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label={label}>
      {Object.entries(tipos || {}).map(([tipo, n]) => <Chip key={tipo} tipo={tipo} n={n} />)}
    </ul>
  )
}
