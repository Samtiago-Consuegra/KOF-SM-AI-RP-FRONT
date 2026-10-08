import { ResponsiveContainer } from 'recharts'
import ChartCard from './ChartCard.jsx'
import MachineBars from './MachineBars.jsx'
import { CriticalLegend, fmtMin, maxBy } from './edaTheme.jsx'

// Minutos de paro por equipo. Contexto global: ignora el filtro de máquinas.
export default function MinutosPorEquipoChart({ data, className }) {
  const top = maxBy(data, 'total_minutes')
  const critical = data.filter((m) => m.critical).map((m) => m.machine)
  return (
    <ChartCard
      className={className}
      title="Minutos de paro por equipo"
      subtitle="Tiempo total detenido de cada equipo"
      legend={<CriticalLegend names={critical} />}
      footer={<>
        <span>Mayor tiempo detenido: {top?.machine ?? '—'}</span>
        <span className="font-semibold text-primary-600">{fmtMin(top?.total_minutes ?? 0)}</span>
      </>}
    >
      <ResponsiveContainer>
        <MachineBars data={data} dataKey="total_minutes" name="Minutos de paro" format={fmtMin} />
      </ResponsiveContainer>
    </ChartCard>
  )
}
