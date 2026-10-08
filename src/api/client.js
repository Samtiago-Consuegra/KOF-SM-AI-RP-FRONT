/**
 * Capa HTTP mínima sobre fetch. No hay axios ni react-query en el proyecto, así que
 * aquí se centraliza: la URL base, la construcción del query string y la traducción
 * de los errores de FastAPI (`{detail}`) a excepciones de JavaScript.
 */

const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '')

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/**
 * FastAPI devuelve los errores en `detail`: texto plano para los HTTPException y una
 * lista de problemas para el 422 de validación.
 */
function errorMessage(body, status) {
  const detail = body?.detail
  if (typeof detail === 'string' && detail) return detail
  if (Array.isArray(detail)) {
    const text = detail.map((d) => d?.msg).filter(Boolean).join(' · ')
    if (text) return text
  }
  return `Error ${status}`
}

/** Los arrays se unen con coma: es el formato que espera `_parse_machines` del backend. */
export function buildQuery(params = {}) {
  const q = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === '') continue
    q.set(key, Array.isArray(value) ? value.join(',') : String(value))
  }
  const s = q.toString()
  return s ? `?${s}` : ''
}

async function request(path, { params, signal, body, headers } = {}) {
  let res
  try {
    res = await fetch(`${BASE}${path}${buildQuery(params)}`, {
      method: body ? 'POST' : 'GET',
      // FormData lleva su propio Content-Type (con el boundary): no lo fijamos a mano.
      headers: { Accept: 'application/json', ...(body ? {} : headers) },
      body,
      signal,
    })
  } catch (err) {
    if (err.name === 'AbortError') throw err
    throw new ApiError('No se pudo conectar con el servidor. Revisa que el backend esté encendido.', 0)
  }

  if (res.status === 204) return null
  const payload = await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(errorMessage(payload, res.status), res.status)
  return payload
}

export const apiGet = (path, params, opts) => request(path, { ...opts, params })

export const apiUpload = (path, formData, opts) => request(path, { ...opts, body: formData })

export { BASE as API_BASE }