/**
 * Cobertura de datos por fuente (GET /cobertura): primer y último día con registros.
 * Fechas ISO 'YYYY-MM-DD' en todo el módulo (se comparan como texto).
 */

export const NOMBRES_FUENTE = {
  reporte_diario: 'paros diarios',
  predicciones: 'paros diarios',
  ordenes_sap: 'órdenes de SAP',
  paradas: 'paradas programadas',
  fallas_historia: 'paros diarios',
  eventos_historia: 'avisos',
  archivos: 'archivos cargados',
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

const iso = (v) => (v ? String(v).slice(0, 10) : null)

/** '2026-09-22' → '22 sep 2026' */
export function fmtFechaCobertura(v) {
  const d = iso(v)
  if (!d) return '—'
  const [y, m, dd] = d.split('-').map(Number)
  return `${dd} ${MESES[m - 1]} ${y}`
}

/** Día siguiente en ISO (UTC para no saltar por el cambio de horario). */
export function diaSiguiente(v) {
  const [y, m, d] = iso(v).split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10)
}

/** Lee { primer, ultimo } de una entrada de /cobertura con los nombres de campo más comunes. */
export function rangoFuente(f) {
  if (!f || typeof f !== 'object') return { primer: null, ultimo: null }
  return {
    primer: iso(f.primerDato ?? f.primer_dato ?? f.primer ?? f.min ?? f.desde ?? f.inicio),
    ultimo: iso(f.ultimoDato ?? f.ultimo_dato ?? f.ultimo ?? f.max ?? f.hasta ?? f.fin),
  }
}

/** Une varias fuentes en un solo rango (min del primero, max del último). */
export function unirFuentes(...fuentes) {
  const rs = fuentes.map(rangoFuente).filter((r) => r.primer && r.ultimo)
  if (!rs.length) return null
  return {
    primer: rs.map((r) => r.primer).sort()[0],
    ultimo: rs.map((r) => r.ultimo).sort().at(-1),
  }
}

/**
 * evaluarCobertura(fuente, desde, hasta) → { estado, primerDato, ultimoDato, sinDatosDesde, sinDatosHasta }
 * - sin_datos: el periodo queda entero fuera de [primerDato, ultimoDato] (o la fuente no tiene datos).
 * - parcial: el periodo cruza uno de los bordes.
 */
export function evaluarCobertura(fuente, desde, hasta) {
  const { primer, ultimo } = rangoFuente(fuente)
  const d = iso(desde)
  const h = iso(hasta) ?? d
  const base = { primerDato: primer, ultimoDato: ultimo, sinDatosDesde: null, sinDatosHasta: null }
  if (!primer || !ultimo) return { ...base, estado: 'sin_datos' }
  if (!d) return { ...base, estado: 'completo' }

  if (d > ultimo) return { ...base, estado: 'sin_datos', sinDatosDesde: diaSiguiente(ultimo), sinDatosHasta: h }
  if (h < primer) return { ...base, estado: 'sin_datos', sinDatosDesde: d, sinDatosHasta: h }
  if (h > ultimo) return { ...base, estado: 'parcial', sinDatosDesde: diaSiguiente(ultimo), sinDatosHasta: h }
  if (d < primer) return { ...base, estado: 'parcial', sinDatosDesde: d, sinDatosHasta: primer }
  return { ...base, estado: 'completo' }
}

/** La fuente tiene datos en alguna fecha (si no, la vista conserva su mensaje actual). */
export const tieneDatos = (ev) => !!ev?.ultimoDato

/**
 * Fuentes sin aviso de cobertura parcial: las paradas se crean en la app, así que no haber más
 * no significa que falten datos.
 */
export const FUENTES_SIN_AVISO_PARCIAL = new Set(['paradas'])

/** ¿Se muestra el aviso temporal de cobertura parcial para esta fuente y evaluación? */
export const avisaCoberturaParcial = (fuente, ev) =>
  !FUENTES_SIN_AVISO_PARCIAL.has(fuente) && ev?.estado === 'parcial'
