/**
 * GET /cobertura compartido en toda la app: una sola petición en memoria.
 * Se vuelve a pedir solo tras el evento 'kof:cobertura-invalida' (subida de archivos,
 * corrida del motor terminada en ok o cambios en paradas).
 */
import { useEffect, useMemo, useState } from 'react'
import { getCobertura } from '../api/motor.js'
import { evaluarCobertura, unirFuentes } from '../utils/cobertura.js'

let datos = null
let promesa = null
const subs = new Set()

/** La respuesta puede venir plana ({ fuente: {...} }) o dentro de `fuentes`. */
const normalizar = (res) => {
  const f = res?.fuentes ?? res ?? {}
  if (Array.isArray(f)) return Object.fromEntries(f.map((x) => [x.fuente ?? x.clave ?? x.nombre, x]))
  return f
}

function cargar() {
  if (!promesa) {
    promesa = getCobertura()
      .then((res) => { datos = normalizar(res); return datos })
      // Sin cobertura las vistas siguen como antes (sin avisos); se reintenta en la próxima invalidación.
      .catch(() => { datos = {}; return datos })
      .then((d) => { subs.forEach((fn) => fn(d)); return d })
  }
  return promesa
}

export function invalidarCobertura() {
  promesa = null
  datos = null
  if (subs.size) cargar() // con vistas montadas se pide ya; si no, al próximo montaje
}

if (typeof window !== 'undefined') window.addEventListener('kof:cobertura-invalida', invalidarCobertura)

/** Devuelve el mapa { fuente: { primer_dato, ultimo_dato } } o null mientras carga. */
export function useCobertura() {
  const [valor, setValor] = useState(datos)
  useEffect(() => {
    subs.add(setValor)
    if (datos) setValor(datos)
    else cargar()
    return () => { subs.delete(setValor) }
  }, [])
  return valor
}

/** Solo para pruebas. */
export function _reiniciarCobertura() { datos = null; promesa = null; subs.clear() }

/** evaluarCobertura de una fuente para el periodo; null mientras carga o si falta el periodo. */
export function useEvalCobertura(fuente, desde, hasta) {
  const cob = useCobertura()
  return useMemo(() => {
    if (!cob || !desde) return null
    const f = Array.isArray(fuente) ? unirFuentes(...fuente.map((k) => cob[k])) : cob[fuente]
    return evaluarCobertura(f, desde, hasta)
  }, [cob, String(fuente), desde, hasta]) // eslint-disable-line react-hooks/exhaustive-deps
}
