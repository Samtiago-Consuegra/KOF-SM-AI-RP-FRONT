import { seeded } from '../../utils/random.js'
import { getMachine } from '../../data/machines.js'

/**
 * Agrupaciones que usan las gráficas. Trabajan directamente sobre los paros
 * de data/telemetry.js (getStops): { date, machineId, minutes, cause }.
 * No generan datos nuevos: solo agrupan lo que ya viene de la carpeta data.
 */

// Turno 1: 06–14 h · Turno 2: 14–22 h · Turno 3: 22–06 h
const shiftOf = (hour) => (hour >= 6 && hour < 14 ? '1' : hour >= 14 && hour < 22 ? '2' : '3')
const round = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d
const sum = (rows) => rows.reduce((a, r) => a + r.minutes, 0)

// Hora del paro y puntos de eficiencia: derivados de forma estable de cada paro
function detail(s) {
  const r = seeded(`${s.machineId}-${s.date}-${s.minutes}-${s.cause}`)
  const hour = r() * 24
  const factor = r() < 0.05 ? 0.0046 : 0.00025 + r() * 0.00045
  return { shift: shiftOf(hour), efficiency_points_lost: round(s.minutes * factor, 4) }
}

function groupBy(rows, keyFn) {
  const map = new Map()
  for (const r of rows) {
    const k = keyFn(r)
    if (!map.has(k)) map.set(k, [])
    map.get(k).push(r)
  }
  return [...map.values()]
}

const info = (s) => {
  const m = getMachine(s.machineId)
  return { machine: m.name, critical: m.critical }
}

// Imágenes 1, 2 y 3
export const byMachine = (stops) =>
  groupBy(stops, (s) => s.machineId)
    .map((g) => ({ ...info(g[0]), count: g.length, total_minutes: round(sum(g)), avg_minutes: round(sum(g) / g.length) }))
    .sort((a, b) => b.count - a.count)

// Imágenes 4 y 7
export const byFailure = (stops) =>
  groupBy(stops, (s) => `${s.machineId}|${s.cause}`).map((g) => ({
    ...info(g[0]),
    failure_type: g[0].cause,
    count: g.length,
    total_minutes: round(sum(g)),
    avg_minutes: round(sum(g) / g.length),
  }))

// Imagen 5: por mes si el periodo abarca 3 meses o más; si no, por día
export function trend(stops) {
  const monthly = new Set(stops.map((s) => s.date.slice(0, 7))).size >= 3
  const periodOf = (s) => (monthly ? s.date.slice(0, 7) : s.date)
  return groupBy(stops, (s) => `${periodOf(s)}|${s.machineId}`).map((g) => ({
    ...info(g[0]),
    month: periodOf(g[0]),
    count: g.length,
    total_minutes: round(sum(g)),
  }))
}

// Imagen 6
export const byShift = (stops) =>
  groupBy(stops.map((s) => ({ ...s, ...detail(s) })), (s) => `${s.shift}|${s.machineId}`).map((g) => ({
    ...info(g[0]),
    shift: g[0].shift,
    count: g.length,
    total_minutes: round(sum(g)),
  }))

// Imagen 8
export const scatterPoints = (stops) =>
  stops.map((s) => ({ ...info(s), stop_minutes: s.minutes, efficiency_points_lost: detail(s).efficiency_points_lost }))

// Imagen 9: mismo criterio que el KPI "MTBF medio" (horas del periodo / paros)
export const mtbfRows = (stops, days) =>
  byMachine(stops)
    .map((m) => ({ machine: m.machine, count: m.count, mtbf_hours: round((days * 24) / m.count, 1), critical: m.critical }))
    .sort((a, b) => (a.critical === b.critical ? a.machine.localeCompare(b.machine, 'es') : a.critical ? -1 : 1))
