/**
 * Capa HTTP mínima sobre fetch. No hay axios ni react-query en el proyecto, así que
 * aquí se centraliza: la URL base, la construcción del query string, la traducción
 * de los errores de FastAPI (`{detail}`) a excepciones de JavaScript, el aviso de
 * "servidor despertando" y una caché corta para los GET que no cambian seguido.
 */

const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '')

const TOKEN_KEY = 'kof_smart_token'

const SLOW_API_MS = 4000
const GET_CACHE_TTL = 60_000
const WARM_UP_TIMEOUT = 60_000

export function getAuthToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setAuthToken(token, remember = true) {
  try {
    if (!token) {
      localStorage.removeItem(TOKEN_KEY)
      sessionStorage.removeItem(TOKEN_KEY)
      return
    }
    if (remember) {
      localStorage.setItem(TOKEN_KEY, token)
      sessionStorage.removeItem(TOKEN_KEY)
    } else {
      sessionStorage.setItem(TOKEN_KEY, token)
      localStorage.removeItem(TOKEN_KEY)
    }
  } catch {
    // ignore storage errors
  }
}

export function clearAuthToken() {
  try {
    localStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
  } catch {
    // ignore
  }
}

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

// --- Aviso global de servidor lento -------------------------------------------------------------
// Varias peticiones pueden estar en curso a la vez. Solo avisamos cuando la primera supera
// los 4 s y solo ocultamos el aviso cuando termina la última petición lenta.
let slowRequests = 0

function emitWindowEvent(name) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(name))
}

function beginSlowWatch() {
  let counted = false
  const timer = setTimeout(() => {
    counted = true
    slowRequests += 1
    if (slowRequests === 1) emitWindowEvent('kof:slow-api')
  }, SLOW_API_MS)

  return () => {
    clearTimeout(timer)
    if (!counted) return
    counted = false
    slowRequests = Math.max(0, slowRequests - 1)
    if (slowRequests === 0) emitWindowEvent('kof:api-ready')
  }
}

// --- Caché de GET -------------------------------------------------------------------------------
// Solo los catálogos y la vista previa de predicciones: son datos que cambian únicamente
// al subir un Excel. La caché se limpia completa después de cualquier apiUpload exitoso.
const getCache = new Map()
let warmUpPromise = null

function isCacheableGet(path, params) {
  if (path === '/machines' || path === '/eda/periodos') return true
  return path === '/predicciones' && params?.include === 'matriz,meta'
}

function readCache(key) {
  const entry = getCache.get(key)
  if (!entry) return undefined
  if (entry.expires <= Date.now()) {
    getCache.delete(key)
    return undefined
  }
  return entry.value
}

function writeCache(key, value) {
  getCache.set(key, { value, expires: Date.now() + GET_CACHE_TTL })
}

/**
 * Despierta el backend en paralelo al render. Render (u otro host gratuito) duerme la
 * instancia tras un rato sin tráfico; /health no exige token y responde en cuanto el
 * proceso está arriba. La promesa se guarda para que un segundo montaje no repita la
 * llamada. Cualquier error se absorbe: el arranque del frontend no depende de esto.
 */
export function warmUpApi() {
  if (!warmUpPromise) {
    warmUpPromise = (async () => {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), WARM_UP_TIMEOUT)
      const doneSlow = beginSlowWatch()
      try {
        await fetch(`${BASE}/health`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          cache: 'no-store',
          signal: controller.signal,
        })
      } catch {
        // El backend puede tardar más de 60 s o estar caído. No bloqueamos la interfaz.
      } finally {
        clearTimeout(timeout)
        doneSlow()
      }
    })()
  }
  return warmUpPromise
}

async function request(path, { params, signal, body, headers, auth = true } = {}) {
  const method = body !== undefined && body !== null ? 'POST' : 'GET'
  const query = buildQuery(params)
  const cacheKey = `${path}${query}`
  const cacheable = method === 'GET' && isCacheableGet(path, params)

  if (cacheable) {
    const cached = readCache(cacheKey)
    if (cached !== undefined) return cached
  }

  const doneSlow = beginSlowWatch()
  try {
    let res
    try {
      const token = auth ? getAuthToken() : null
      const reqHeaders = { Accept: 'application/json', ...(headers || {}) }
      if (token) {
        reqHeaders.Authorization = `Bearer ${token}`
      }

      const init = { method, headers: reqHeaders, signal }
      if (body instanceof FormData) {
        // FormData lleva su propio Content-Type (con el boundary): no lo fijamos a mano.
        init.body = body
      } else if (body !== undefined && body !== null) {
        reqHeaders['Content-Type'] = reqHeaders['Content-Type'] || 'application/json'
        init.body = typeof body === 'string' ? body : JSON.stringify(body)
      }

      res = await fetch(`${BASE}${cacheKey}`, init)
    } catch (err) {
      if (err.name === 'AbortError') throw err
      throw new ApiError('No se pudo conectar con el servidor. Revisa que el backend esté encendido.', 0)
    }

    if (res.status === 204) return null
    const payload = await res.json().catch(() => null)
    if (!res.ok) throw new ApiError(errorMessage(payload, res.status), res.status)
    if (cacheable) writeCache(cacheKey, payload)
    return payload
  } finally {
    doneSlow()
  }
}

export const apiGet = (path, params, opts) => request(path, { ...opts, params })

export const apiPost = (path, body, opts) => request(path, { ...opts, body })

export async function apiUpload(path, formData, opts) {
  const result = await request(path, { ...opts, body: formData })
  // El Excel puede traer máquinas, periodos y predicciones nuevas.
  getCache.clear()
  return result
}

export { BASE as API_BASE }
