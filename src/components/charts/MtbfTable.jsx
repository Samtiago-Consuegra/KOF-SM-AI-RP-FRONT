import { useMemo } from 'react'
import ChartCard from './ChartCard.jsx'
import { fmtInt } from './edaTheme.jsx'
import { mtbfRows } from './edaData.js'

const fmtH = (v) => Number(v).toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

// Imagen 9: MTBF preliminar por equipo (críticas arriba)
export default function MtbfTable({ stops, days, className }) {
  const rows = useMemo(() => mtbfRows(stops, days), [stops, days])
  const worst = rows.reduce((a, b) => (a === null || b.mtbf_hours < a.mtbf_hours ? b : a), null)
  return (
    <ChartCard
      className={className}
      title="MTBF preliminar por equipo"
      subtitle="Tiempo medio entre fallas, con las máquinas críticas arriba"
      footer={<>
        <span>Menor MTBF: {worst?.machine ?? '—'}</span>
        <span className="font-semibold text-primary-600">{worst ? `${fmtH(worst.mtbf_hours)} h` : '—'}</span>
      </>}
    >
      <div className="h-full overflow-auto scroll-thin">
        <table className="w-full min-w-[420px] text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-200 text-left text-gray-700">
              <th className="px-4 py-2">Equipo</th>
              <th className="px-4 py-2 text-center">Paros</th>
              <th className="px-4 py-2 text-right">MTBF (horas)</th>
              <th className="px-4 py-2 text-center">Crítico</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.machine} className={r.critical ? 'bg-red-50' : 'border-t border-gray-200'}>
                <td className={`px-4 py-2 font-medium ${r.critical ? 'text-red-700' : ''}`}>
                  {r.machine}{r.critical && ' ★'}
                </td>
                <td className="px-4 py-2 text-center">{fmtInt(r.count)}</td>
                <td className="px-4 py-2 text-right tabular-nums">{fmtH(r.mtbf_hours)}</td>
                <td className="px-4 py-2 text-center">{r.critical ? 'Sí' : 'No'}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-ink-500">Sin paros en el periodo seleccionado</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </ChartCard>
  )
}
