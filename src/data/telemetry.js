import { seeded, normal } from '../utils/random.js'
import { addDays, startOfDay, toISODate } from '../utils/format.js'
import { MACHINES } from './machines.js'

export const HISTORY_DAYS = 60 // archivos Excel disponibles hacia atrás
export const VIBRATION_LIMIT = 4.5 // mm/s — umbral ISO 10816
export const TEMP_LIMIT = 75 // °C

const CAUSES = ['Atasco de envase', 'Falla eléctrica', 'Sobrecalentamiento', 'Cambio de formato', 'Ajuste mecánico', 'Falta de insumo']

// Perfil de cada máquina para la simulación
const PROFILE = Object.fromEntries(MACHINES.map((m, i) => {
  const r = seeded(m.id)
  const hot = { M04: 1, M07: 0.8, M12: 0.45, M15: 0.3 }[m.id] ?? r() * 0.25
  return [m.id, {
    stopRate: 0.25 + hot * 1.6,           // paros esperados por día
    kwh: Math.round(60 + r() * 70 + hot * 40),
    cycles: Math.round(80 + r() * 50),
    vibMean: 2.2 + hot * 2.4 + r() * 0.5,
    tempMean: 52 + hot * 22 + r() * 8,
    idx: i,
  }]
}))

// Paros registrados por día y máquina (lo que traería cada Excel)
export function getStops(today = new Date()) {
  const end = startOfDay(today)
  const stops = []
  for (let d = HISTORY_DAYS - 1; d >= 0; d--) {
    const day = addDays(end, -d)
    const iso = toISODate(day)
    for (const m of MACHINES) {
      const rand = seeded(`${m.id}-${iso}`)
      const p = PROFILE[m.id]
      let n = Math.floor(p.stopRate + rand())
      while (n-- > 0) {
        stops.push({
          date: iso,
          machineId: m.id,
          minutes: Math.round(8 + rand() * 50 * (0.6 + p.stopRate / 2)),
          cause: CAUSES[Math.floor(rand() * CAUSES.length)],
        })
      }
    }
  }
  return stops
}

export const fileNameFor = (iso) => `telemetria_planta_${iso.replaceAll('-', '')}.xlsx`

// Consumo energético y ciclos por máquina
export function getEnergy(ids, seedKey) {
  return ids.map((id) => {
    const r = seeded(`${id}-${seedKey}-energy`)
    const p = PROFILE[id]
    return {
      id: id.replace('M', 'M-'),
      kwh: Math.round(p.kwh * (0.9 + r() * 0.2)),
      cycles: Math.round(p.cycles * (0.9 + r() * 0.2)),
    }
  })
}

// Histograma de vibración RMS con curva normal ajustada
export function getVibrationHistogram(ids, seedKey) {
  const samples = []
  ids.forEach((id) => {
    const r = seeded(`${id}-${seedKey}-vib`)
    const p = PROFILE[id]
    for (let i = 0; i < 160; i++) samples.push(Math.max(0.3, normal(r, p.vibMean, 0.9)))
  })
  const width = 0.5
  const bins = []
  for (let x = 0.5; x < 8; x += width) {
    const count = samples.filter((s) => s >= x && s < x + width).length
    bins.push({ bin: x.toFixed(1), center: x + width / 2, count, over: x >= VIBRATION_LIMIT })
  }
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length
  const sd = Math.sqrt(samples.reduce((a, b) => a + (b - mean) ** 2, 0) / samples.length)
  const skew = samples.reduce((a, b) => a + ((b - mean) / sd) ** 3, 0) / samples.length
  bins.forEach((b) => {
    b.curve = +((samples.length * width) / (sd * Math.sqrt(2 * Math.PI)) * Math.exp(-((b.center - mean) ** 2) / (2 * sd * sd))).toFixed(1)
  })
  const overCount = samples.filter((s) => s >= VIBRATION_LIMIT).length
  return { bins, n: samples.length, mean, skew, overPct: (overCount / samples.length) * 100 }
}

// Nube temperatura vs vibración, separando anomalías
export function getScatter(ids, seedKey) {
  const normalPts = []
  const anomalies = []
  ids.forEach((id) => {
    const r = seeded(`${id}-${seedKey}-sc`)
    const p = PROFILE[id]
    for (let i = 0; i < 12; i++) {
      const temp = +normal(r, p.tempMean, 5).toFixed(1)
      const vib = +Math.max(0.5, normal(r, p.vibMean, 0.6)).toFixed(2)
      const pt = { temp, vib, id }
      if (temp > TEMP_LIMIT && vib > VIBRATION_LIMIT * 0.9) anomalies.push(pt)
      else normalPts.push(pt)
    }
  })
  return { normalPts, anomalies }
}

// Matriz de correlación de Pearson entre variables
export const CORR_VARS = ['Temp.', 'Vibración', 'Presión', 'Corriente']
export function getCorrelation(seedKey) {
  const r = seeded(`${seedKey}-corr`)
  const j = (v) => +Math.min(0.97, Math.max(0.05, v + (r() - 0.5) * 0.08)).toFixed(2)
  const tv = j(0.84), tp = j(0.42), tc = j(0.68), vp = j(0.26), vc = j(0.79), pc = j(0.18)
  return [
    [1, tv, tp, tc],
    [tv, 1, vp, vc],
    [tp, vp, 1, pc],
    [tc, vc, pc, 1],
  ]
}
