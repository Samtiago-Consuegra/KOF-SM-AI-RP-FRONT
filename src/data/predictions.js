import { seeded } from '../utils/random.js'
import { fromISODate } from '../utils/format.js'
import { MACHINES } from './machines.js'

export const RISK_LEVELS = {
  critico: { label: 'Crítico', order: 0, dot: 'bg-primary-500', badge: 'bg-primary-500 text-white', bar: 'bg-primary-500', text: 'text-primary-600' },
  alto: { label: 'Alto', order: 1, dot: 'bg-amber-500', badge: 'bg-amber-400 text-amber-950', bar: 'bg-amber-400', text: 'text-amber-600' },
  medio: { label: 'Medio', order: 2, dot: 'bg-yellow-400', badge: 'bg-yellow-100 text-yellow-800', bar: 'bg-yellow-400', text: 'text-yellow-700' },
  bajo: { label: 'Bajo', order: 3, dot: 'bg-tertiary-500', badge: 'bg-tertiary-100 text-tertiary-800', bar: 'bg-tertiary-500', text: 'text-tertiary-700' },
}

// Base del modelo por máquina: probabilidad de falla, RUL (h) y variable que la dispara
const BASE = {
  M04: { risk: 'critico', prob: 89, rul: 18, variable: 'Vibración rodamiento frontal', reading: 'RMS: 8.42 mm/s (+142%)', icon: 'vibration' },
  M07: { risk: 'critico', prob: 76, rul: 34, variable: 'Sobrecalentamiento estator', reading: 'Temp: 88.4 °C (>75 lím.)', icon: 'thermo' },
  M02: { risk: 'alto', prob: 61, rul: 58, variable: 'Presión bomba de lavado', reading: 'Delta: -1.2 bar', icon: 'gauge' },
  M14: { risk: 'alto', prob: 57, rul: 66, variable: 'Temperatura de descarga', reading: 'Temp: 104 °C', icon: 'thermo' },
  M12: { risk: 'medio', prob: 42, rul: 112, variable: 'Presión de válvula de sello', reading: 'Delta: -0.85 bar', icon: 'gauge' },
  M06: { risk: 'medio', prob: 37, rul: 140, variable: 'Nivel de CO₂', reading: 'Var: ±4.1%', icon: 'drop' },
  M10: { risk: 'medio', prob: 33, rul: 160, variable: 'Corriente de resistencias', reading: '31.6 A', icon: 'bolt' },
}

const DEFAULT = { risk: 'bajo', variable: 'Amperaje motor', reading: 'Nominal', icon: 'bolt' }

// Deriva de la probabilidad según el rango elegido
const DRIFT = { hoy: 0.03, semana: 0, mes: -0.35 }

// Puntos de la serie temporal: el día actual se muestrea por hora, la semana por día
export const predictionPoints = (mode, days) => {
  if (mode === 'mes') return Math.max(2, Math.min(15, days))
  return mode === 'semana' ? 7 : 12
}

// Genera la matriz predictiva para el rango de fechas resuelto (ver utils/period.js).
// `end` admite un Date o un ISO ('YYYY-MM-DD').
export function getPredictions({ mode = 'semana', seed = mode, days = 7, end = new Date(), now = new Date() } = {}) {
  const points = predictionPoints(mode, days)
  return MACHINES.map((m, i) => {
    const rand = seeded(`${m.id}-${seed}`)
    const base = BASE[m.id] ?? { ...DEFAULT, prob: 6 + Math.round(rand() * 14), rul: 320 + Math.round(rand() * 200) }

    const prob = Math.max(3, Math.min(99, Math.round(base.prob * (1 + (DRIFT[mode] ?? 0)))))
    const rising = base.risk === 'critico' || base.risk === 'alto'

    const trend = Array.from({ length: points }, (_, k) => {
      const t = k / (points - 1)
      const growth = rising ? Math.pow(t, 2.2) * prob * 0.45 : 0
      return { k, v: +(prob * 0.62 + growth + (rand() - 0.5) * prob * 0.1).toFixed(1) }
    })
    const first = trend[0].v
    const last = trend[trend.length - 1].v
    const trendPct = Math.round(((last - first) / first) * 100)

    // Última lectura: dentro del rango escogido y siempre en el pasado respecto a "ahora"
    const lastDay = end instanceof Date ? end : fromISODate(end)
    const endDay = new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate())
    let updated = mode === 'mes'
      ? new Date(endDay.getFullYear(), endDay.getMonth(), endDay.getDate(), 23, 40 - i)
      : new Date(now.getTime() - (5 + ((i * 37) % 180)) * 60000)
    if (updated > now) updated = new Date(now.getTime() - 60000)

    return {
      ...m,
      risk: base.risk,
      probability: prob,
      rul: base.rul,
      variable: base.variable,
      reading: base.reading,
      icon: base.icon,
      trend,
      trendPct,
      updatedAt: updated,
    }
  })
}

// Planes de mantenimiento (vista previa del dashboard)
export const MAINTENANCE_PLANS = [
  { machineId: 'M07', priority: 'alta', task: 'Cambio de sellos hidráulicos', when: 'Mañana, 08:00', tech: 'Cuadrilla mecánica turno 1' },
  { machineId: 'M04', priority: 'media', task: 'Alineación de rodamiento frontal', when: 'En 3 días, 14:00', tech: 'Cuadrilla mecánica turno 2' },
  { machineId: 'M12', priority: 'baja', task: 'Lubricación de cabezales', when: 'En 4 días, 09:30', tech: 'Lubricación' },
]
