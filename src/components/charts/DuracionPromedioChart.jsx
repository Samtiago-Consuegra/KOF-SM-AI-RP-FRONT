import { ResponsiveContainer } from 'recharts'
import ChartCard from './ChartCard.jsx'
import HorizontalBars from './HorizontalBars.jsx'
import { CRITICAL_COLOR, fmtMin } from './edaTheme.jsx'

// Duración promedio por tipo de falla. SÍ sigue el filtro de máquinas.
export default function DuracionPromedioChart({ data, className }) {
  const rows = [...data]
    .sort((a, b) => b.avg_minutes - a.avg_minutes)
    .slice(0, 15)
    .map((r) => ({ ...r, name: `${r.machine} · ${r.failure_type}` }))
  const top = rows[0]
  return (
    <ChartCard
      className={className}
      title="Duración promedio por tipo de falla (minutos)"
      subtitle="Las 15 combinaciones equipo · falla más largas"
      footer={<>
        <span>Falla más larga en promedio: {top?.name ?? '—'}</span>
        <span className="font-semibold text-primary-600">{fmtMin(top?.avg_minutes ?? 0)}</span>
      </>}
    >
      <ResponsiveContainer>
        <HorizontalBars
          rows={rows}
          labelKey="name"
          dataKey="avg_minutes"
          name="Duración promedio"
          format={fmtMin}
          colorOf={() => CRITICAL_COLOR}
        />
      </ResponsiveContainer>
    </ChartCard>
  )
}
