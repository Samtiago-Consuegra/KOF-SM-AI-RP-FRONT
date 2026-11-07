import { PARADAS, MAQUINAS_CRITICAS } from '../data/mock/cumplimiento.js'
import { siguienteDiaHabil } from '../utils/weeks.js'

const clone = (value) => JSON.parse(JSON.stringify(value))
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Estado mutable del cliente mientras no exista backend.
let paradas = clone(PARADAS)

function pad(n) {
  return String(n).padStart(2, '0')
}

function toLocalISO(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`
}

function inRange(dateStr, from, to) {
  if (!from || !to || !dateStr) return false
  const day = String(dateStr).slice(0, 10)
  return day >= from && day <= to
}

function matchesMachine(parada, maquina) {
  return !maquina || maquina === 'todas' || parada.maquina === maquina
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
  return { ...clone(parada), estado: estadoEfectivo(parada) }
}

function findMutable(paradaId) {
  return paradas.find((p) => p.id === paradaId) || null
}

function applyTareas(parada, tareas) {
  if (!tareas) return
  parada.tareas = parada.tareas.map((t) => ({
    ...t,
    completada: tareas[t.id] !== undefined ? !!tareas[t.id] : t.completada,
  }))
}

function withDateAndTime(destino, origenISO) {
  const origen = new Date(origenISO)
  const fecha = new Date(destino)
  fecha.setHours(origen.getHours(), origen.getMinutes(), 0, 0)
  return toLocalISO(fecha)
}

function progreso(parada) {
  const total = parada.tareas?.length || 0
  const hechas = (parada.tareas || []).filter((t) => t.completada).length
  return { total, hechas, pct: total === 0 ? 0 : Math.round((hechas / total) * 100) }
}

export async function getResumen(rango, maquina = 'todas') {
  await delay(150)
  if (!rango) return { cumplimiento: 0, ejecutadas: 0, programadas: 0, pospuestas: 0, vencidas: 0 }

  let programadas = 0
  let ejecutadas = 0
  let pospuestas = 0
  let vencidas = 0

  for (const p of paradas) {
    if (!matchesMachine(p, maquina)) continue

    if (inRange(p.inicio, rango.from, rango.to)) {
      for (const t of p.tareas || []) {
        programadas++
        if (t.completada) ejecutadas++
      }
    }

    // Pospuestas: tareas cuya reprogramación ocurrió dentro del período.
    for (const t of p.tareas || []) {
      if (t.reprogramadaA && inRange(t.reprogramadaEl, rango.from, rango.to)) pospuestas++
    }

    // Vencidas: paradas cuyo fin programado ya pasó y no están Cumplidas.
    // Se cuentan paradas (no tareas) y sin importar el rango seleccionado.
    if (estadoEfectivo(p) === 'Vencida') vencidas++
  }

  const cumplimiento = programadas === 0 ? 0 : Math.round((ejecutadas / programadas) * 100)
  return { cumplimiento, ejecutadas, programadas, pospuestas, vencidas }
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

export async function getCumplimientoSemanal({ rango, maquina = 'todas' }) {
  await delay(150)
  const maquinas = !maquina || maquina === 'todas' ? MAQUINAS_CRITICAS : [maquina]

  if (rango?.type === 'month') {
    const weeks = {}
    for (const p of paradas) {
      if (!inRange(p.inicio, rango.from, rango.to)) continue
      if (!maquinas.includes(p.maquina)) continue
      const wk = getWeekKeyFromDate(p.inicio)
      if (!weeks[wk]) weeks[wk] = { semana: wk, maquinas: {} }
      if (!weeks[wk].maquinas[p.maquina]) weeks[wk].maquinas[p.maquina] = { programadas: 0, ejecutadas: 0 }
      for (const t of p.tareas || []) {
        weeks[wk].maquinas[p.maquina].programadas++
        if (t.completada) weeks[wk].maquinas[p.maquina].ejecutadas++
      }
    }
    const result = []
    Object.values(weeks).forEach((w) => {
      maquinas.forEach((m) => {
        const data = w.maquinas[m] || { programadas: 0, ejecutadas: 0 }
        const pct = data.programadas === 0 ? 0 : Math.round((data.ejecutadas / data.programadas) * 100)
        result.push({ semana: w.semana, maquina: m, cumplimiento: pct, ejecutadas: data.ejecutadas, programadas: data.programadas })
      })
    })
    return result
  }

  const enRango = paradas.filter((p) => inRange(p.inicio, rango?.from, rango?.to))
  const semana = rango?.from ? getWeekKeyFromDate(`${rango.from}T00:00:00`) : 'Sem'
  return maquinas.map((m) => {
    let programadas = 0
    let ejecutadas = 0
    for (const p of enRango.filter((x) => x.maquina === m)) {
      for (const t of p.tareas || []) {
        programadas++
        if (t.completada) ejecutadas++
      }
    }
    const pct = programadas === 0 ? 0 : Math.round((ejecutadas / programadas) * 100)
    return { semana, maquina: m, cumplimiento: pct, ejecutadas, programadas }
  })
}

export async function getParadas({ estado = 'todos', maquina = 'todas' } = {}) {
  await delay(150)
  let list = paradas.map(serialize)
  if (estado && estado !== 'todos') list = list.filter((p) => p.estado === estado)
  if (maquina && maquina !== 'todas') list = list.filter((p) => p.maquina === maquina)
  list.sort((a, b) => new Date(a.inicio) - new Date(b.inicio))
  return list
}

export async function getParada(paradaId) {
  await delay(80)
  const parada = findMutable(paradaId)
  return parada ? serialize(parada) : null
}

export async function registrarSeguimiento(paradaId, payload) {
  await delay(300)
  const parada = findMutable(paradaId)
  if (!parada) throw new Error('Parada no encontrada')
  if (payload.estado === 'Vencida') throw new Error('Las paradas vencidas solo se pueden reprogramar')

  applyTareas(parada, payload.tareas)
  parada.estadoBase = payload.estado || parada.estadoBase
  if (payload.finReal) parada.finReal = payload.finReal
  if (payload.observaciones !== undefined) parada.observaciones = payload.observaciones

  return { success: true, parada: serialize(parada) }
}

/**
 * Cumple la parada. Si quedan tareas sin marcar, la parada queda Cumplida
 * con tareas pendientes (avance parcial).
 */
export async function cumplirParada(paradaId, payload = {}) {
  await delay(300)
  const parada = findMutable(paradaId)
  if (!parada) throw new Error('Parada no encontrada')

  applyTareas(parada, payload.tareas)
  const { total, hechas, pct } = progreso(parada)

  parada.estadoBase = 'Cumplida'
  parada.finReal = payload.finReal || parada.finReal || new Date().toISOString()
  if (payload.observaciones !== undefined) parada.observaciones = payload.observaciones
  parada.cumplidaParcial = hechas < total
  parada.avanceAlCumplir = pct

  return { success: true, parada: serialize(parada) }
}

/**
 * Cumple la parada solo con las tareas hechas y crea una copia Pendiente
 * con las tareas restantes en el siguiente día hábil.
 */
export async function cumplirYReprogramarRestantes(paradaId, payload = {}) {
  await delay(360)
  const parada = findMutable(paradaId)
  if (!parada) throw new Error('Parada no encontrada')

  applyTareas(parada, payload.tareas)

  const totalOriginal = parada.tareas.length
  const hechas = parada.tareas.filter((t) => t.completada)
  const pendientes = parada.tareas.filter((t) => !t.completada)
  const ahora = new Date()

  // No hay nada que reprogramar: se comporta como un cumplimiento normal.
  if (pendientes.length === 0) {
    parada.estadoBase = 'Cumplida'
    parada.finReal = payload.finReal || parada.finReal || ahora.toISOString()
    if (payload.observaciones !== undefined) parada.observaciones = payload.observaciones
    parada.cumplidaParcial = false
    parada.avanceAlCumplir = 100
    return { success: true, parada: serialize(parada), copia: null }
  }

  const nuevaFecha = siguienteDiaHabil(parada.inicio)
  const nuevoInicio = withDateAndTime(nuevaFecha, parada.inicio)
  const nuevoFin = withDateAndTime(nuevaFecha, parada.finProg)
  const avance = totalOriginal === 0 ? 0 : Math.round((hechas.length / totalOriginal) * 100)
  const copiaId = `P-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

  const historial = {
    fechaOriginal: parada.historialReprogramaciones?.[0]?.fechaOriginal || parada.inicio,
    fechaNueva: nuevoInicio,
    registradaEl: ahora.toISOString(),
    avance,
    tareasPendientes: pendientes.length,
    motivo: 'tareas-restantes',
  }

  const copia = {
    id: copiaId,
    maquina: parada.maquina,
    sistema: parada.sistema,
    componente: parada.componente,
    titulo: `${parada.titulo} (tareas restantes)`,
    ordenSap: parada.ordenSap,
    tipo: parada.tipo,
    estadoBase: 'Pendiente',
    inicio: nuevoInicio,
    finProg: nuevoFin,
    finReal: null,
    tareas: pendientes.map((t, index) => ({
      ...clone(t),
      id: `T-${copiaId}-${index + 1}`,
      completada: false,
      reprogramadaA: copiaId,
      reprogramadaEl: ahora.toISOString(),
    })),
    observaciones: '',
    historialReprogramaciones: [historial],
    paradaOriginalId: parada.id,
    reprogramadaA: null,
    reprogramadaAFecha: null,
    cumplidaParcial: false,
    avanceAlCumplir: null,
  }

  parada.tareas = hechas
  parada.estadoBase = 'Cumplida'
  parada.finReal = payload.finReal || parada.finReal || ahora.toISOString()
  if (payload.observaciones !== undefined) parada.observaciones = payload.observaciones
  parada.cumplidaParcial = false
  parada.avanceAlCumplir = avance
  parada.reprogramadaA = copia.id
  parada.reprogramadaAFecha = copia.inicio
  parada.historialReprogramaciones = [...(parada.historialReprogramaciones || []), historial]

  paradas.push(copia)
  return { success: true, parada: serialize(parada), copia: serialize(copia) }
}

/**
 * Mueve la misma parada vencida al siguiente día hábil, conservando sus
 * tareas y horas. Las tareas pendientes quedan marcadas como reprogramadas.
 */
export async function reprogramarParada(paradaId) {
  await delay(300)
  const parada = findMutable(paradaId)
  if (!parada) throw new Error('Parada no encontrada')

  const ahora = new Date()
  const { total, hechas, pct } = progreso(parada)
  const nuevaFecha = siguienteDiaHabil(parada.inicio)
  const fechaOriginal = parada.historialReprogramaciones?.[0]?.fechaOriginal || parada.inicio

  parada.inicio = withDateAndTime(nuevaFecha, parada.inicio)
  parada.finProg = withDateAndTime(nuevaFecha, parada.finProg)
  parada.estadoBase = 'Pendiente'
  parada.finReal = null
  parada.cumplidaParcial = false
  parada.tareas = parada.tareas.map((t) =>
    t.completada
      ? t
      : { ...t, reprogramadaA: parada.id, reprogramadaEl: ahora.toISOString() }
  )
  parada.historialReprogramaciones = [
    ...(parada.historialReprogramaciones || []),
    {
      fechaOriginal,
      fechaNueva: parada.inicio,
      registradaEl: ahora.toISOString(),
      avance: total === 0 ? 0 : pct,
      tareasPendientes: total - hechas,
      motivo: 'vencida',
    },
  ]

  return { success: true, parada: serialize(parada) }
}
