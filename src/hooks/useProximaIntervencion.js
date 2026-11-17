import { useEffect, useState } from 'react'
import {
  getParadasSemana,
  getPlanSugerido,
  leerCacheSemana,
  leerEstadoPlan,
  semanaISO,
  suscribirEstadoPlan,
} from '../services/mantenimientoService.js'

const RANGO = { 'Crítica': 0, 'Alta': 1, 'Media': 2, 'Baja': 3 }
const URGENTES = new Set(['Crítica', 'Alta'])

/** Fecha y hora actuales en Colombia, como texto: { fecha: 'AAAA-MM-DD', hora: 'HH:MM' }. */
export function ahoraColombia(d = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(d).map((x) => [x.type, x.value]))
  return { fecha: `${p.year}-${p.month}-${p.day}`, hora: `${p.hour}:${p.minute}` }
}

export function sumarDias(fechaISO, n) {
  const d = new Date(fechaISO + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/** Lunes (AAAA-MM-DD) de la semana de la fecha. */
export function lunesDe(fechaISO) {
  const dia = new Date(fechaISO + 'T00:00:00Z').getUTCDay() || 7
  return sumarDias(fechaISO, 1 - dia)
}

/** Primera parada que empieza en `ahora` o después, por fecha y hora de inicio. */
export function elegirProxima(paradas = [], ahora) {
  const ref = `${ahora.fecha} ${ahora.hora}`
  return paradas
    .filter((p) => p.fecha && `${p.fecha} ${p.horaInicio || '00:00'}` >= ref)
    .sort((a, b) => `${a.fecha} ${a.horaInicio}`.localeCompare(`${b.fecha} ${b.horaInicio}`))[0] ?? null
}

/** Tareas Crítica o Alta del plan que aún no están en el calendario. */
export const contarUrgentes = (plan = []) => plan.filter((t) => URGENTES.has(t._prioridadMotor) && !t.enCalendario).length

/** La tarea de mayor prioridad real de la parada (las manuales no tienen prioridad). */
export function tareaPrincipal(parada) {
  const tareas = parada?.tareasDetalle ?? []
  const conPrioridad = tareas.filter((t) => t.prioridad in RANGO).sort((a, b) => RANGO[a.prioridad] - RANGO[b.prioridad])
  return conPrioridad[0] ?? tareas[0] ?? null
}

/** "Hoy, 06:00" · "Mañana, 14:00" · "Jue 19 nov, 06:00". */
export function textoRelativo(fecha, hora, hoyISO) {
  if (fecha === hoyISO) return `Hoy, ${hora}`
  if (fecha === sumarDias(hoyISO, 1)) return `Mañana, ${hora}`
  const d = new Date(fecha + 'T00:00:00Z')
  const op = (o) => d.toLocaleDateString('es-CO', { timeZone: 'UTC', ...o }).replace('.', '')
  const dia = op({ weekday: 'short' })
  return `${dia.charAt(0).toUpperCase()}${dia.slice(1)} ${d.getUTCDate()} ${op({ month: 'short' })}, ${hora}`
}

/** "8 h" · "1 h 30 min" · "45 min" (si fin < inicio, cruza la medianoche). */
export function duracion(inicio, fin) {
  const min = (h) => { const [a, b] = String(h || '').split(':').map(Number); return a * 60 + (b || 0) }
  let total = min(fin) - min(inicio)
  if (Number.isNaN(total)) return ''
  if (total <= 0) total += 24 * 60
  const h = Math.floor(total / 60)
  const m = total % 60
  return [h && `${h} h`, m && `${m} min`].filter(Boolean).join(' ')
}

// Lo que Mantenimiento ya cargó se reutiliza: esa semana no se vuelve a pedir.
const paradasDe = async (start) => leerCacheSemana(start)?.paradas ?? getParadasSemana({ startISO: start })
const planDe = async (start) => leerCacheSemana(start)?.plan ?? getPlanSugerido(start)

/** Próxima parada (esta semana o la siguiente) y urgentes sin programar de esta semana. */
export async function cargarProximaIntervencion(ahora) {
  const actual = lunesDe(ahora.fecha)
  const [paradasActual, plan] = await Promise.all([paradasDe(actual), planDe(actual)])
  let parada = elegirProxima(paradasActual, ahora)
  let semanaInicio = actual
  if (!parada) {
    semanaInicio = sumarDias(actual, 7)
    parada = elegirProxima(await paradasDe(semanaInicio), ahora)
  }
  return { parada, semanaInicio, urgentesPendientes: contarUrgentes(plan) }
}

const INICIAL = { loading: true, parada: null, semanaInicio: null, urgentesPendientes: 0 }

export function useProximaIntervencion() {
  const [ahora] = useState(ahoraColombia)
  const actual = lunesDe(ahora.fecha)
  const [datos, setDatos] = useState(INICIAL)
  const [estado, setEstado] = useState(() => leerEstadoPlan(actual))

  useEffect(() => {
    let cancelado = false
    const semana = semanaISO(actual)
    const baja = suscribirEstadoPlan((s) => { if (!cancelado && s === semana) setEstado(leerEstadoPlan(actual)) })
    cargarProximaIntervencion({ fecha: ahora.fecha, hora: ahora.hora })
      .then((res) => { if (!cancelado) setDatos({ loading: false, ...res }) })
      .catch(() => { if (!cancelado) setDatos({ ...INICIAL, loading: false }) })
    return () => { cancelado = true; baja() }
  }, [actual, ahora.fecha, ahora.hora])

  const calculando = datos.loading && estado?.estado === 'calculando'
  return {
    ...datos,
    calculando,
    sinDatosMotor: !datos.loading && estado?.estado === 'sin_datos',
    mensaje: estado?.mensaje ?? null,
    semanaISO: semanaISO(actual),
    hoy: ahora.fecha,
  }
}
