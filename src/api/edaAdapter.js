/**
 * `GET /eda/summary` devuelve tres formas distintas según lo que encuentre
 * (ver app/eda.py::build_summary):
 *   - sin datos en la base           -> {empty, message}
 *   - máquinas sin histórico         -> {empty, data_range, message}   (sin `kpis`)
 *   - rango sin paros                -> {empty, filters, data_range, kpis, by_day, listas vacías}
 * Aquí se aplana todo a una sola forma para que los componentes no tengan que comprobar nada.
 */

const EMPTY_KPIS = {
  events_count: 0,
  stop_minutes: 0,
  stop_hours: 0,
  machines_count: 0,
  previous_events_count: 0,
  delta_vs_previous_pct: null,
  mtbf_critical_hours: null,
  critical_machines_count: 0,
}

export function normalizeSummary(raw) {
  return {
    empty: Boolean(raw?.empty),
    message: raw?.message ?? null,
    data_range: raw?.data_range ?? null,
    filters: raw?.filters ?? null,
    kpis: { ...EMPTY_KPIS, ...(raw?.kpis ?? {}) },
    by_day: raw?.by_day ?? [],
    machines: raw?.machines ?? [],
    top_failures: raw?.top_failures ?? [],
    monthly_trend: raw?.monthly_trend ?? [],
    by_day_machine: raw?.by_day_machine ?? [],
    shifts: raw?.shifts ?? [],
    avg_duration: raw?.avg_duration ?? [],
    scatter: raw?.scatter ?? [],
    mtbf: raw?.mtbf ?? [],
  }
}

/**
 * El backend siempre agrupa por mes (`monthly_trend`), pero para rangos cortos eso
 * deja una sola línea plana. Cuando el periodo abarca menos de tres meses distintos
 * se usa la serie diaria por máquina; en caso contrario, la mensual.
 * Mismo criterio que usaba el agregador del frontend.
 */
export function trendSeries(summary) {
  const months = new Set(summary.by_day_machine.map((p) => p.date.slice(0, 7)))
  return months.size >= 3 ? summary.monthly_trend : summary.by_day_machine
}

export const isMonthlyTrend = (points) => points.length > 0 && points[0].month !== undefined

/**
 * `resolveTimeRange` devuelve los días como lista, no como {start, end}:
 * el rango real es el primer y el último elemento. Tomando `start`/`end`
 * directamente se enviaban `undefined` y el backend caía en su rango por defecto,
 * así que el filtro de fechas no filtraba nada.
 */
export function rangeParams(resolved) {
  const list = resolved?.list ?? []
  if (list.length === 0) return {}
  return { start: list[0], end: list[list.length - 1] }
}