// Vista "Órdenes de SAP" de Cumplimiento: pide /motor/ordenes-sap por tramos y resume en el front
// (solo conteos de lo que ya trae la respuesta; los estados vienen calculados del backend).
import * as api from '../api/motor.js'
import { ordenPantalla } from './mantenimientoService.js'
import { getISOWeekNumber } from '../utils/weeks.js'
import { MAQUINAS_CRITICAS } from './cumplimientoService.js'

export const VISTAS = { PARADAS: 'paradas', SAP: 'sap' }
export const TIPOS_ORDEN = ['Preventiva', 'Correctiva', 'Predictiva']
const MAX_DIAS = 31
const DIA = 86_400_000

/** ?vista=sap → 'sap'; cualquier otra cosa (o nada) → 'paradas'. */
export const vistaDesdeParams = (params) => (params?.get('vista') === VISTAS.SAP ? VISTAS.SAP : VISTAS.PARADAS)

const aDia = (iso) => Date.parse(`${iso}T00:00:00Z`)
const aIso = (ms) => new Date(ms).toISOString().slice(0, 10)

/** Divide [desde, hasta] en tramos de máximo 31 días (el backend no acepta más). */
export function tramos(desde, hasta) {
  const fin = aDia(hasta)
  const lista = []
  for (let ini = aDia(desde); ini <= fin; ini += MAX_DIAS * DIA) {
    lista.push({ desde: aIso(ini), hasta: aIso(Math.min(ini + (MAX_DIAS - 1) * DIA, fin)) })
  }
  return lista
}

const soloMaquina = (maquina) => (!maquina || maquina === 'todas' ? undefined : maquina)
const clave = (o) => (o.orden ? `#${o.orden}` : `${o.fecha_programada}|${o.maquina}|${o.texto}`)

// Una petición por periodo y máquina: volver a la vista o al mismo filtro reutiliza la promesa.
const cache = new Map()

export function getOrdenesSapPeriodo({ desde, hasta, maquina = 'todas' }) {
  const key = `${desde}|${hasta}|${maquina}`
  if (!cache.has(key)) {
    const promesa = Promise.all(
      tramos(desde, hasta).map((t) => api.getOrdenesSap({ ...t, maquina: soloMaquina(maquina) })),
    ).then((respuestas) => {
      const sinDatos = respuestas.find((r) => !r || r.available === false || r.status === 'calculando')
      if (sinDatos) {
        cache.delete(key) // el motor puede tener datos más tarde
        return { sinDatos: true, mensaje: sinDatos?.message || sinDatos?.detail || 'El motor aún no tiene órdenes de SAP para este periodo.', ordenes: [] }
      }
      const unicas = new Map()
      respuestas.forEach((r) => (r.ordenes || []).forEach((o) => { if (!unicas.has(clave(o))) unicas.set(clave(o), o) }))
      return { sinDatos: false, mensaje: null, ordenes: [...unicas.values()].map(ordenPantalla) }
    })
    promesa.catch(() => cache.delete(key))
    cache.set(key, promesa)
  }
  return cache.get(key)
}

export function resumenOrdenes(ordenes = []) {
  const r = { total: ordenes.length, ejecutadas: 0, noEjecutadas: 0, abiertas: 0 }
  ordenes.forEach((o) => {
    if (o.estado === 'Ejecutada') r.ejecutadas += 1
    else if (o.estado === 'No ejecutada') r.noEjecutadas += 1
    else r.abiertas += 1
  })
  return { ...r, cumplimiento: r.total ? Math.round((100 * r.ejecutadas) / r.total) : null }
}

/** Conteo por tipo (preventiva, correctiva, predictiva; "Otro" solo si aparece). */
export function desgloseTipos(ordenes = []) {
  const conteo = Object.fromEntries(TIPOS_ORDEN.map((t) => [t, 0]))
  ordenes.forEach((o) => {
    const t = TIPOS_ORDEN.includes(o.tipo) ? o.tipo : 'Otro'
    conteo[t] = (conteo[t] || 0) + 1
  })
  return conteo
}

/** Una fila por semana ISO del periodo: órdenes totales, ejecutadas y desglose por tipo. */
export function ordenesPorSemana(ordenes = []) {
  const semanas = new Map()
  ordenes.forEach((o) => {
    if (!o.fecha) return
    const d = new Date(`${o.fecha}T00:00:00`)
    const lunes = aIso(aDia(o.fecha) - ((d.getDay() + 6) % 7) * DIA)
    if (!semanas.has(lunes)) semanas.set(lunes, { lunes, semana: `Sem ${getISOWeekNumber(d)}`, lista: [] })
    semanas.get(lunes).lista.push(o)
  })
  return [...semanas.values()]
    .sort((a, b) => a.lunes.localeCompare(b.lunes))
    .map(({ semana, lista }) => ({
      semana,
      total: lista.length,
      ejecutadas: lista.filter((o) => o.estado === 'Ejecutada').length,
      porTipo: desgloseTipos(lista),
    }))
}

/** Nombre de máquina de SAP con el mismo texto que usa la gráfica ('LLENADORA' → 'Llenadora'). */
const nombreMaquina = (m) => MAQUINAS_CRITICAS.find((c) => c.toLowerCase() === String(m ?? '').trim().toLowerCase()) ?? (m || 'Sin máquina')

/**
 * Cumplimiento SAP por máquina, con las mismas filas que la gráfica de paradas
 * ({ semana, maquina, cumplimiento, ... }). Se agrupa en el front con las órdenes ya cargadas.
 * - porSemana=false (filtro semana): una fila por máquina, `semana` null.
 * - porSemana=true (filtro mes): una fila por semana ISO y máquina ('Sem 47').
 * cumplimiento = ejecutadas / órdenes (en %, redondeado); 0 si no hay órdenes.
 */
export function cumplimientoSapPorMaquina(ordenes = [], { porSemana = false } = {}) {
  const grupos = new Map()
  ordenes.forEach((o) => {
    let lunes = ''
    let semana = null
    if (porSemana) {
      if (!o.fecha) return
      const d = new Date(`${o.fecha}T00:00:00`)
      lunes = aIso(aDia(o.fecha) - ((d.getDay() + 6) % 7) * DIA)
      semana = `Sem ${getISOWeekNumber(d)}`
    }
    const maquina = nombreMaquina(o.maquina)
    const k = `${lunes}|${maquina}`
    if (!grupos.has(k)) grupos.set(k, { lunes, semana, maquina, lista: [] })
    grupos.get(k).lista.push(o)
  })
  return [...grupos.values()]
    .sort((a, b) => a.lunes.localeCompare(b.lunes) || a.maquina.localeCompare(b.maquina))
    .map(({ semana, maquina, lista }) => {
      const r = resumenOrdenes(lista)
      return {
        semana,
        maquina,
        cumplimiento: r.cumplimiento ?? 0,
        ordenes: r.total,
        ejecutadas: r.ejecutadas,
        noEjecutadas: r.noEjecutadas,
        abiertas: r.abiertas,
      }
    })
}
