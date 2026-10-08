import { ResponsiveContainer } from 'recharts'
import ChartCard from './ChartCard.jsx'
import HorizontalBars from './HorizontalBars.jsx'
import { CRITICAL_COLOR, CriticalLegend, OTHER_FAILURE_COLOR, fmtInt } from './edaTheme.jsx'

// Top 15 tipos de falla. SÍ sigue el filtro de máquinas.
export default function TopFallasChart({ data, className }) {
  const rows = [...data].sort((a, b) => b.count - a.count).slice(0, 15)
  const top = rows[0]
  const critical = [...new Set(rows.filter((r) => r.critical).map((r) => r.machine))]
  return (
    <ChartCard
      className={className}
      title="Top 15 tipos de falla según enfoque"
      subtitle="Fallas más frecuentes por equipo y tipo"
      legend={<CriticalLegend names={critical} otherColor={OTHER_FAILURE_COLOR} />}
      footer={<>
        <span>Falla más frecuente: {top ? `${top.failure_type} (${top.machine})` : '—'}</span>
        <span className="font-semibold text-primary-600">{fmtInt(top?.count ?? 0)} paros</span>
      </>}
    >
      <ResponsiveContainer>
        <HorizontalBars
          rows={rows}
          labelKey="failure_type"
          dataKey="count"
          name="Paros"
          format={fmtInt}
          maxLabel={230}
          withMachine
          colorOf={(r) => (r.critical ? CRITICAL_COLOR : OTHER_FAILURE_COLOR)}
        />
      </ResponsiveContainer>
    </ChartCard>
  )
}
