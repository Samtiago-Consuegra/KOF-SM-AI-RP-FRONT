/**
 * Único vigilante de /motor/estado para toda la app.
 * - Una sola petición en curso: quien pregunte a la vez recibe la misma promesa.
 * - Mientras haya corridas en cola o en proceso consulta con espera creciente (2, 4, 8, 10 s…).
 * - Se detiene cuando ya no hay pendientes y se pausa con la pestaña oculta.
 */
import { getMotorEstado } from '../api/motor.js'

const ESPERA_MIN = 2000
const ESPERA_MAX = 10000

let estado = null
let enCurso = null
let timer = null
let espera = ESPERA_MIN
let activo = false
const subs = new Set()

const oculta = () => typeof document !== 'undefined' && document.hidden

const pendiente = (e) => !!e?.en_cola || ['en_cola', 'en_proceso'].includes(e?.run?.status)

function avisar(e) {
  // Copia: esperarFin se desuscribe dentro del recorrido.
  ;[...subs].forEach((fn) => { try { fn(e) } catch { /* un suscriptor no tumba a los demás */ } })
}

function consultar() {
  if (!enCurso) {
    enCurso = getMotorEstado()
      .then((e) => { estado = e; avisar(e); return e })
      // Sin respuesta no se sigue esperando (igual que antes): se avisa con null y se detiene.
      .catch(() => { avisar(null); return null })
      .finally(() => { enCurso = null })
  }
  return enCurso
}

async function ciclo() {
  timer = null
  const e = await consultar()
  if (!activo) return
  if (!pendiente(e)) {
    activo = false
    espera = ESPERA_MIN
    return
  }
  if (oculta()) return // en pausa: visibilitychange retoma
  timer = setTimeout(ciclo, espera)
  espera = Math.min(espera * 2, ESPERA_MAX)
}

/** Arranca el sondeo si no está corriendo (una consulta inmediata; sigue solo si hay pendientes). */
export function vigilar() {
  if (activo) return
  activo = true
  espera = ESPERA_MIN
  ciclo()
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && activo && !timer && !enCurso) ciclo()
  })
}

/** fn(estado) en cada lectura. Devuelve la función para desuscribirse. */
export function suscribir(fn) {
  subs.add(fn)
  vigilar()
  return () => subs.delete(fn)
}

/** Resuelve cuando no quedan corridas pendientes (o al vencer maxMs). */
export function esperarFin(maxMs = 90000) {
  return new Promise((resolve) => {
    let fin = null
    const listo = (e) => {
      if (pendiente(e)) return
      clearTimeout(fin)
      subs.delete(listo)
      resolve(e)
    }
    fin = setTimeout(() => { subs.delete(listo); resolve(estado) }, maxMs)
    subs.add(listo)
    vigilar()
  })
}

export const estadoActual = () => estado

/** Solo para pruebas. */
export function _reiniciar() {
  clearTimeout(timer)
  estado = null; enCurso = null; timer = null; espera = ESPERA_MIN; activo = false
  subs.clear()
}
