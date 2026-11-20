// Utilidades de los catálogos del asistente. Sin dependencias de servicios: cada respuesta con
// datos importa su servicio de forma diferida, así el catálogo no arrastra código al abrirse.

export const ERROR_CONSULTA = 'No pude consultar los datos en este momento.'

/**
 * Ejecuta la respuesta de una pregunta. Texto fijo o explicación: se devuelve tal cual.
 * Función: se espera su resultado (texto o { texto, accion }); si falla, el mensaje de error.
 */
export async function responder(pregunta, contexto) {
  const r = pregunta.respuesta
  if (typeof r !== 'function') return { contenido: r, accion: pregunta.accion ?? null }
  try {
    const res = await r(contexto)
    if (res && typeof res === 'object') return { contenido: res.texto, accion: res.accion ?? pregunta.accion ?? null }
    return { contenido: res || ERROR_CONSULTA, accion: pregunta.accion ?? null }
  } catch {
    return { contenido: ERROR_CONSULTA, accion: null }
  }
}

const nf = (d) => new Intl.NumberFormat('es-CO', { maximumFractionDigits: d, minimumFractionDigits: 0 })
/** 1234.5 → "1.234,5"; null → "—". */
export const num = (n, d = 0) => (n == null || Number.isNaN(Number(n)) ? '—' : nf(d).format(Number(n)))

/** plural(1, 'parada') → "1 parada"; plural(3, 'parada') → "3 paradas". */
export const plural = (n, singular, pluralTxt = `${singular}s`) => `${num(n)} ${n === 1 ? singular : pluralTxt}`

/** ['a','b','c'] → "a, b y c". */
export const lista = (items) => {
  const xs = items.filter(Boolean)
  return xs.length <= 1 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}`
}

/** "2026-11-19" → "jue 19 nov". */
export function fechaCorta(iso) {
  if (!iso) return '—'
  const d = new Date(`${String(iso).slice(0, 10)}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('es-CO', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' }).replace(/\./g, '')
}

/** Lunes (AAAA-MM-DD) de la semana actual en hora de Colombia. */
export function lunesDeHoy(ahora = new Date()) {
  const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(ahora)
  const d = new Date(`${hoy}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() || 7) - 1))
  return d.toISOString().slice(0, 10)
}

/** Explicación en tres partes (grupo "explicar"). */
export const explicacion = (queEs, comoSeCalcula, origen) => ({ queEs, comoSeCalcula, origen })
