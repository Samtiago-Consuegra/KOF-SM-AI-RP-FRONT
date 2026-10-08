import { ResponsiveContainer } from 'recharts'
import ChartCard from './ChartCard.jsx'
import MachineBars from './MachineBars.jsx'
import { CriticalLegend, fmtInt, maxBy } from './edaTheme.jsx'

// Cantidad de paros por equipo. Contexto global: ignora el filtro de máquinas.
export default function ParosPorEquipoChart({ data, periodLabel, className }) {
  const top = maxBy(data, 'count')
  const critical = data.filter((m) => m.critical).map((m) => m.machine)
  return (
    <ChartCard
      className={className}
      title="Cantidad de paros por equipo"
      subtitle={periodLabel ? `Paros registrados en ${periodLabel}` : 'Paros registrados por equipo'}
      legend={<CriticalLegend names={critical} />}
      footer={<>
        <span>Equipo con más paros: {top?.machine ?? '—'}</span>
        <span className="font-semibold text-primary-600">{fmtInt(top?.count ?? 0)} paros</span>
      </>}
    >
      <ResponsiveContainer>
        <MachineBars data={data} dataKey="count" name="N° de paros" format={fmtInt} />
      </ResponsiveContainer>
    </ChartCard>
  )
}
