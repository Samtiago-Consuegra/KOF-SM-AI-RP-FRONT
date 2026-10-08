import { apiGet } from './client.js'

// El motor trabaja con 4 niveles (Crítico/Alto/Medio/Bajo); la aplicación muestra 3,
// así que "alto" se fusiona en "critico". Vale tanto para ejecuciones nuevas como
// para las ya guardadas en la base.
const RISK_MAP = { critico: 'critico', alto: 'critico', medio: 'medio', bajo: 'bajo' }
export const normalizeRisk = (risk) => RISK_MAP[risk] ?? 'bajo'

export function normalizeMatrixRow(r) {
  return {
    machine: r.machine,
    risk: normalizeRisk(r.risk),
    ipm: r.ipm,
    ranking: r.ranking,
    regime: r.regime,
    regimeCode: r.regime_code,
    topCause: r.top_cause,
    trend: (r.trend ?? []).map((p) => ({ k: p.k, date: p.date, v: p.v })),
    trendPct: r.trend_pct,
    probability: r.probability,
    horizon: r.horizon,
    predictionType: r.prediction_type,
    expectedFailuresWeek: r.expected_failures_week,
    meanResidualDaysOp: r.mean_residual_days_op,
    highlighted: r.highlighted,
  }
}

export function normalizePredictions(raw) {
  if (!raw?.available) {
    return { available: false, message: raw?.message ?? null, rows: [], meta: null, run: null, ipmHistory: [] }
  }
  return {
    available: true,
    message: null,
    rows: (raw.matriz ?? []).map(normalizeMatrixRow),
    meta: raw.meta ?? null,
    run: raw.run ?? null,
    ipmHistory: raw.ipm_history ?? raw.historico_ipm ?? [],
  }
}

/** Matriz predictiva completa (todas las secciones) para la pantalla /predicciones. */
export async function fetchPredictions() {
  const res = await apiGet('/predicciones')
  return normalizePredictions(res)
}

/**
 * Vista previa del dashboard: solo las secciones que usa la card
 * (matriz por máquina y metadatos de la ejecución).
 */
export async function fetchPredictionPreview() {
  const res = await apiGet('/predicciones', { include: 'matriz,meta' })
  if (!res.available) return { available: false, message: res.message ?? null, rows: [], meta: null, run: res.run ?? null }
  return {
    available: true,
    rows: (res.matriz ?? []).map(normalizeMatrixRow),
    meta: res.meta ?? null,
    run: res.run ?? null,
  }
}

/** Estado de una ejecución del motor: en_proceso | ok | error. */
export const fetchRunStatus = (runId) => apiGet('/predicciones/estado', { run_id: runId })