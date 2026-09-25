import ChartCard from './ChartCard.jsx'
import { CORR_VARS } from '../../data/telemetry.js'

const ROW_LABELS = ['Temp. (°C)', 'Vib. (mm/s)', 'Presión (bar)', 'Corriente (A)']

function cellStyle(v) {
  if (v >= 0.95) return 'bg-primary-800 text-white'
  if (v >= 0.75) return 'bg-primary-600 text-white'
  if (v >= 0.6) return 'bg-primary-300 text-primary-900'
  if (v >= 0.4) return 'bg-primary-100 text-primary-800'
  return 'bg-neutral-100 text-ink-600'
}

export default function CorrelationMatrix({ matrix }) {
  const tv = matrix[0][1]
  return (
    <ChartCard
      title="Matriz de correlación de variables"
      subtitle="Coeficiente de Pearson (r) de las operaciones en línea"
      legend={<span className="flex items-center gap-1.5">0.0
        <span className="h-2 w-16 rounded-full bg-gradient-to-r from-neutral-100 via-primary-300 to-primary-800" />1.0</span>}
      footer={<>
        <span>Correlación temperatura–vibración ({tv.toFixed(2)}): posible fricción en bujes</span>
        <span className="font-semibold text-primary-600">p &lt; 0.001</span>
      </>}
    >
      <div className="overflow-x-auto scroll-thin">
        <table className="w-full min-w-[300px] border-separate border-spacing-1 text-xs">
          <thead>
            <tr>
              <th className="text-left text-xs font-medium text-ink-400">Variables</th>
              {CORR_VARS.map((v) => <th key={v} className="text-[11px] font-medium text-ink-500 pb-1">{v}</th>)}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, i) => (
              <tr key={i}>
                <th scope="row" className="text-left text-xs font-medium text-ink-700 pr-2 whitespace-nowrap">{ROW_LABELS[i]}</th>
                {row.map((v, j) => (
                  <td key={j} className={`h-11 rounded-lg text-center font-mono font-semibold ${cellStyle(v)}`} title={`${ROW_LABELS[i]} × ${CORR_VARS[j]}: ${v.toFixed(2)}`}>
                    {v.toFixed(2)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ChartCard>
  )
}
