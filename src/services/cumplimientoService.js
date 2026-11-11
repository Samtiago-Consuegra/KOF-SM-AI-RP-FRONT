import {
  listarParadas,
  obtenerParada,
  registrarSeguimientoParada,
  cumplirParadaApi,
  cumplirYReprogramarApi,
  reprogramarParadaApi,
} from '../api/motor.js'
import { adaptarParadaCumplimiento, tareasAMotor } from '../api/motorAdapter.js'
import { siguienteDiaHabil } from '../utils/weeks.js'

export const MAQUINAS_CRITICAS = ['Llenadora', 'Empacadora', 'Paletizadora', 'Envolvedora']

const TODA_LA_LINEA = 'Toda la línea'

function pad(n) {
  return String(n).padStart(2, '0')
}

function toISODate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** HH:MM local de una fecha ISO (el back guarda horas, no fechas completas). */
function hora(iso) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? undefined : `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function inRange(dateStr, from, to) {
  if (!from || !to || !dateStr) return false
  const day = String(dateStr).slice(0, 10)
  return day >= from && day <= to
}

function maquinasDe(parada) {
  return parada.maquinas?.length ? parada.maquinas : [parada.maquina]
}

function matchesMachine(parada, maquina) {
  if (!maquina || maquina === 'todas') return true
  const lista = maquinasDe(parada)
  return lista.includes(maquina) || lista.includes(TODA_LA_LINEA)
}

/** Tareas de la parada que tocan la máquina (las de "Toda la línea" traen su Maquina). */
function tareasDeMaquina(parada, maquina) {
  if (!maquina || maquina === 'todas') return parada.tareas || []
  return (parada.tareas || []).filter((t) => (t.maquina || parada.maquina) === maquina || (!t.maquina && matchesMachine(parada, maquina)))
}

/** Vencida se deriva: fin programado en el pasado y todavía no Cumplida. */
export function estadoEfectivo(parada, now = new Date()) {
  const base = parada.estadoBase || parada.estado || 'Pendiente'
  if (base === 'Cumplida') return 'Cumplida'
  const fin = new Date(parada.finProg)
  if (!Number.isNaN(fin.getTime()) && fin.getTime() < now.getTime()) return 'Vencida'
  return base
}

function serialize(parada) {
  return { ...parada, estado: estadoEfectivo(parada) }
}

/** La lista de /paradas no trae tareas: se pide el detalle de cada una (GET cacheado por client.js). */
async function cargarParadas(params = {}) {
  const res = await listarParadas(params)
  const lista = Array.isArray(res) ? res : []
  const detalles = await Promise.all(lista.map((p) => obtenerParada(p.id_parada).catch(() => p)))
  const paradas = detalles.map(adaptarParadaCumplimiento)
  paradas.available = res?.available !== false
  paradas.message = res?.message || ''
  return paradas
}

export async function getResumen(rango, maquina = 'todas') {
  const vacio = { cumplimiento: 0, ejecutadas: 0, programadas: 0, pospuestas: 0, vencidas: 0, available: true }
  if (!rango) return vacio

  const paradas = await cargarParadas()
  if (!paradas.available) return { ...vacio, available: false, message: paradas.message }

  let programadas = 0
  let ejecutadas = 0
  let pospuestas = 0
  let vencidas = 0

  for (const p of paradas) {
    if (!matchesMachine(p, maquina)) continue
    const tareas = tareasDeMaquina(p, maquina)

    if (inRange(p.inicio, rango.from, rango.to)) {
      for (const t of tareas) {
        programadas++
        if (t.completada) ejecutadas++
      }
    }

    // Pospuestas: tareas cuya reprogramación ocurrió dentro del período.
    for (const t of tareas) {
      if (t.reprogramadaA && inRange(t.reprogramadaEl, rango.from, rango.to)) pospuestas++
    }

    // Vencidas: paradas cuyo fin programado ya pasó y no están Cumplidas.
    // Se cuentan paradas (no tareas) y sin importar el rango seleccionado.
    if (estadoEfectivo(p) === 'Vencida') vencidas++
  }

  const cumplimiento = programadas === 0 ? 0 : Math.round((ejecutadas / programadas) * 100)
  return { cumplimiento, ejecutadas, programadas, pospuestas, vencidas, available: true }
}

function getWeekKeyFromDate(dateStr) {
  const d = new Date(dateStr)
  const dayNum = d.getDay() || 7
  const thu = new Date(d)
  thu.setDate(d.getDate() + 4 - dayNum)
  const yearStart = new Date(thu.getFullYear(), 0, 1)
  const weekNo = Math.ceil((((thu - yearStart) / 86400000) + 1) / 7)
  return `Sem ${weekNo}`
}

function contar(paradas, m) {
  let programadas = 0
  let ejecutadas = 0
  for (const p of paradas) {
    if (!matchesMachine(p, m)) continue
    for (const t of tareasDeMaquina(p, m)) {
      programadas++
      if (t.completada) ejecutadas++
    }
  }
  return { programadas, ejecutadas, cumplimiento: programadas === 0 ? 0 : Math.round((ejecutadas / programadas) * 100) }
}

export async function getCumplimientoSemanal({ rango, maquina = 'todas' }) {
  const maquinas = !maquina || maquina === 'todas' ? MAQUINAS_CRITICAS : [maquina]
  if (!rango?.from) return []
  const enRango = (await cargarParadas({ desde: rango.from, hasta: rango.to }))
    .filter((p) => inRange(p.inicio, rango.from, rango.to))

  if (rango.type === 'month') {
    const porSemana = {}
    for (const p of enRango) {
      const wk = getWeekKeyFromDate(p.inicio)
      ;(porSemana[wk] = porSemana[wk] || []).push(p)
    }
    return Object.entries(porSemana).flatMap(([semana, lista]) =>
      maquinas.map((m) => ({ semana, maquina: m, ...contar(lista, m) })),
    )
  }

  const semana = getWeekKeyFromDate(`${rango.from}T00:00:00`)
  return maquinas.map((m) => ({ semana, maquina: m, ...contar(enRango, m) }))
}

export async function getParadas({ estado = 'todos', maquina = 'todas' } = {}) {
  const paradas = await cargarParadas()
  let list = paradas.map(serialize)
  if (estado && estado !== 'todos') list = list.filter((p) => p.estado === estado)
  if (maquina && maquina !== 'todas') list = list.filter((p) => matchesMachine(p, maquina))
  list.sort((a, b) => new Date(a.inicio) - new Date(b.inicio))
  list.available = paradas.available
  list.message = paradas.message
  return list
}

export async function getParada(paradaId) {
  const res = await obtenerParada(paradaId)
  return res?.id_parada ? serialize(adaptarParadaCumplimiento(res)) : null
}

export async function registrarSeguimiento(paradaId, payload) {
  if (payload.estado === 'Vencida') throw new Error('Las paradas vencidas solo se pueden reprogramar')
  const res = await registrarSeguimientoParada(paradaId, {
    tareas_estado: tareasAMotor(payload.tareas),
    observaciones: payload.observaciones,
    estado_base: payload.estado || undefined,
  })
  return { success: true, parada: serialize(adaptarParadaCumplimiento(res)) }
}

export async function cumplirParada(paradaId, payload = {}) {
  const res = await cumplirParadaApi(paradaId, {
    fin_real: payload.finReal ? hora(payload.finReal) : undefined,
    observaciones: payload.observaciones,
    tareas_estado: tareasAMotor(payload.tareas),
  })
  return { success: true, parada: serialize(adaptarParadaCumplimiento(res)) }
}

/** Fecha y horas del siguiente día hábil, conservando el horario de la parada. */
function siguienteVentana(parada) {
  return {
    Fecha: toISODate(siguienteDiaHabil(parada.inicio)),
    Inicio: hora(parada.inicio),
    Fin: hora(parada.finProg),
  }
}

/**
 * Cumple la parada con las tareas hechas; el back crea otra Pendiente con las
 * restantes en el siguiente día hábil.
 */
export async function cumplirYReprogramarRestantes(paradaId, payload = {}) {
  const parada = await getParada(paradaId)
  if (!parada) throw new Error('Parada no encontrada')
  const res = await cumplirYReprogramarApi(paradaId, {
    ...siguienteVentana(parada),
    observaciones: payload.observaciones,
    tareas_estado: tareasAMotor(payload.tareas),
  })
  const nueva = res?.parada_nueva
  return {
    success: true,
    parada: serialize(adaptarParadaCumplimiento(res?.parada_original)),
    copia: nueva?.tareas?.length ? serialize(adaptarParadaCumplimiento(nueva)) : null,
  }
}

/** Mueve la misma parada vencida al siguiente día hábil, conservando sus tareas y horas. */
export async function reprogramarParada(paradaId) {
  const parada = await getParada(paradaId)
  if (!parada) throw new Error('Parada no encontrada')
  const res = await reprogramarParadaApi(paradaId, { ...siguienteVentana(parada), motivo: 'vencida' })
  return { success: true, parada: serialize(adaptarParadaCumplimiento(res)) }
}
