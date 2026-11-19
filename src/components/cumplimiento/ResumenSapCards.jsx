import Card from '../ui/Card.jsx'
import Skeleton from '../ui/Skeleton.jsx'
import useCountUp from '../../hooks/useCountUp.js'

const GRID = 'grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 xl:grid-cols-5'

function Tarjeta({ titulo, valor, color = 'text-ink-900', nota }) {
  return (
    <Card className="p-5 flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-widest text-ink-500">{titulo}</p>
      <p className={`text-3xl font-bold tracking-tight tabular-nums ${color}`}>{valor}</p>
      <p className="text-xs text-ink-500">{nota}</p>
    </Card>
  )
}

/** Tarjetas de la vista SAP (mismo estilo que ResumenCards). Recibe el resumen ya calculado. */
export default function ResumenSapCards({ resumen, loading }) {
  const total = useCountUp(resumen?.total || 0)
  const ejecutadas = useCountUp(resumen?.ejecutadas || 0)
  const noEjecutadas = useCountUp(resumen?.noEjecutadas || 0)
  const abiertas = useCountUp(resumen?.abiertas || 0)
  const pct = useCountUp(resumen?.cumplimiento || 0)

  if (loading || !resumen) {
    return <div className={GRID}>{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-[104px]" />)}</div>
  }

  return (
    <div className={GRID}>
      <Tarjeta titulo="Órdenes" valor={total} nota="Programadas en el periodo" />
      <Tarjeta titulo="Ejecutadas" valor={ejecutadas} color="text-tertiary-700" nota="Cerradas como ejecutadas en SAP" />
      <Tarjeta titulo="No ejecutadas" valor={noEjecutadas} color="text-primary-600" nota="Cerradas sin ejecutar" />
      <Tarjeta titulo="Abiertas" valor={abiertas} nota="Las órdenes abiertas aún no se han cerrado en SAP" />
      <Tarjeta
        titulo="Cumplimiento SAP"
        valor={resumen.cumplimiento == null ? '–' : `${pct}%`}
        color="text-primary-500"
        nota="Ejecutadas sobre órdenes"
      />
    </div>
  )
}
