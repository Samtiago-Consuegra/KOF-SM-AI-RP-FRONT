import { useMemo } from 'react'
import { ResponsiveContainer } from 'recharts'
import ChartCard from './ChartCard.jsx'
import MachineBars from './MachineBars.jsx'
import { CriticalLegend, fmtMin, maxBy } from './edaTheme.jsx'
import { byMachine } from './edaData.js'

// Imagen 3: minutos de paro por equipo
export default function MinutosPorEquipoChart({ stops, className }) {
  const data = useMemo(() => byMachine(stops), [stops])
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
