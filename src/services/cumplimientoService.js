// Servicio de Cumplimiento.
// Toda la pantalla lee y escribe SOLO desde aquí. Los números y los estados salen del backend
// (/cumplimiento/... y /paradas/...); este archivo solo renombra campos al formato que ya usan
// las tarjetas, la gráfica, la tabla y los modales. "Python calcula, la app solo muestra".
import * as api from '../api/motor.js'
import { textoMaquinas } from '../utils/paradas.js'
import { siguienteDiaHabil } from '../utils/weeks.js'

export const MAQUINAS_CRITICAS = ['Llenadora', 'Empacadora', 'Paletizadora', 'Envolvedora']

const pad = (n) => String(n).padStart(2, '0')
const fechaLocal = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const soloMaquina = (maquina) => (!maquina || maquina === 'todas' ? null : maquina)

// Estado del backend → texto que ya muestra la app
const ESTADO_FRONT = { 'En proceso': 'En ejecución' }
const ESTADO_BACK = { 'En ejecución': 'En proceso' }

/** "HH:MM" local a partir del ISO que entrega el modal (o null). */
function horaLocal(iso) {
  if (!iso) return null
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** { idTarea: true|false } del modal → { idTarea: { completada } } que espera el backend. */
function aTareasEstado(tareas) {
  if (!tareas) return undefined
  return Object.fromEntries(Object.entries(tareas).map(([id, hecha]) => [id, { completada: !!hecha }]))
}

const unicos = (lista) => [...new Set(lista.filter(Boolean))]

/** Una sola etiqueta si todas las tareas coinciden; si no, "N sistemas", "N componentes". */
function resumir(valores, plural) {
  const u = unicos(valores)
  if (u.length === 0) return ''
  return u.length === 1 ? u[0] : `${u.length} ${plural}`
}

function aHistorial(h) {
  return {
    fechaOriginal: h.fecha_anterior ? `${h.fecha_anterior}T${h.inicio_anterior || '00:00'}:00` : null,
    fechaNueva: h.fecha_nueva ? `${h.fecha_nueva}T${h.inicio_nuevo || '00:00'}:00` : null,
    registradaEl: h.reprogramada_en || null,
    avance: typeof h.avance === 'number' ? h.avance : undefined,
    tareasPendientes: typeof h.tareas_pendientes === 'number' ? h.tareas_pendientes : undefined,
    motivo: h.motivo || null,
  }
}

/** Parada del backend → forma que usan la tabla y los modales de Cumplimiento. */
function aParada(p) {
  const tareas = (p.tareas || []).map((t) => ({
    id: String(t.Id_tarea),
    nombre: t.Tarea,
    componente: t.Componente || t.Sistema || t.Maquina || '',
    maquina: t.Maquina,
    sistema: t.Sistema,
    tipo: t.Tipo_tarea,
    completada: !!t.Completada,
  }))
  const tipos = unicos(tareas.map((t) => t.tipo)).join(' y ')
  const modalidad = p.modalidad ? `en ${p.modalidad.toLowerCase()}` : ''
  return {
    id: p.id_parada,
    maquina: textoMaquinas({ maquinas: p.maquinas }) || 'Sin máquina',
    sistema: resumir(tareas.map((t) => t.sistema), 'sistemas') || 'Sin tareas asignadas',
    componente: resumir(tareas.map((t) => t.componente), 'componentes'),
    titulo: p.titulo,
    ordenSap: p.id_parada,                       // la parada de la app no tiene orden SAP propia
    tipo: [tipos || 'Parada', modalidad].filter(Boolean).join(' '),
    estado: ESTADO_FRONT[p.estado] || p.estado,
    inicio: p.inicio_iso,
    finProg: p.fin_iso,
    finReal: p.fin_real_iso,
    tareas,
    observaciones: p.observaciones || '',
    historialReprogramaciones: (p.historial_reprogramaciones || []).map(aHistorial),
    paradaOriginalId: p.parada_original_id,
    reprogramadaA: p.reprogramada_a,
    reprogramadaAFecha: p.reprogramada_a_fecha,
    cumplidaParcial: !!p.cumplida_parcial,
    avanceAlCumplir: p.avance_al_cumplir,
  }
}

// ---------------------------------------------------------------------------------------------
// Tarjetas y gráfica
// ---------------------------------------------------------------------------------------------
export async function getResumen(rango, maquina = 'todas') {
  if (!rango) return { cumplimiento: 0, ejecutadas: 0, programadas: 0, pospuestas: 0, vencidas: 0 }
  const r = await api.getCumplimientoResumen({ desde: rango.from, hasta: rango.to, maquina: soloMaquina(maquina) })
  return {
    cumplimiento: r.cumplimiento_pct == null ? 0 : Math.round(r.cumplimiento_pct),
    sinProgramadas: r.cumplimiento_pct == null,
    ejecutadas: r.ejecutadas ?? 0,
    programadas: r.programadas ?? 0,
    pospuestas: r.pospuestas ?? 0,
    vencidas: r.vencidas ?? 0,
  }
}

// Vista semanal: una fila por máquina. Vista mensual: una fila por semana y máquina.
const aPorTipo = (pt) => ({ Preventiva: pt?.Preventiva ?? 0, Correctiva: pt?.Correctiva ?? 0, Predictiva: pt?.Predictiva ?? 0 })

/** Filas de la gráfica de paradas; el arreglo lleva además `porTipo` (tareas programadas por tipo). */
export async function getCumplimientoSemanal({ rango, maquina = 'todas' }) {
  if (!rango) return Object.assign([], { porTipo: aPorTipo() })
  const r = await api.getCumplimientoGrafica({
    desde: rango.from,
    hasta: rango.to,
    maquina: soloMaquina(maquina),
    agrupar: rango.type === 'month' ? 'semana' : 'maquina',
  })
  const filas = (r.filas || []).map((f) => ({
    semana: f.etiqueta || null,
    maquina: f.maquina,
    cumplimiento: f.cumplimiento_pct == null ? 0 : Math.round(f.cumplimiento_pct),
    ejecutadas: f.ejecutadas ?? 0,
    programadas: f.programadas ?? 0,
    vencidas: f.vencidas ?? 0,
    pospuestas: f.pospuestas ?? 0,
  }))
  return Object.assign(filas, { porTipo: aPorTipo(r.por_tipo) })
}

// ---------------------------------------------------------------------------------------------
// Tabla de seguimiento y modales
// ---------------------------------------------------------------------------------------------
export async function getParadas({ estado = 'todos', maquina = 'todas' } = {}) {
  const lista = await api.listarParadas({
    maquina: soloMaquina(maquina),
    estado: !estado || estado === 'todos' ? null : (ESTADO_BACK[estado] || estado),
    incluir_tareas: true,
  })
  return (lista || []).map(aParada)
}

export async function getParada(paradaId) {
  const p = await api.obtenerParada(paradaId)
  return p ? aParada(p) : null
}

/** Guardar avance: tareas marcadas, estado (Pendiente / En ejecución), fin real y observaciones. */
export async function registrarSeguimiento(paradaId, payload) {
  if (payload.estado === 'Vencida') throw new Error('Las paradas vencidas solo se pueden reprogramar')
  const p = await api.registrarSeguimientoParada(paradaId, {
    tareas_estado: aTareasEstado(payload.tareas),
    estado_base: ESTADO_BACK[payload.estado] || payload.estado || undefined,
    fin_real: payload.finReal ? horaLocal(payload.finReal) : undefined,
    observaciones: payload.observaciones,
  })
  return { success: true, parada: aParada(p) }
}

/** Cerrar la parada. Si quedan tareas sin marcar, queda "Cumplida" con tareas pendientes. */
export async function cumplirParada(paradaId, payload = {}) {
  const p = await api.cumplirParadaApi(paradaId, {
    tareas_estado: aTareasEstado(payload.tareas),
    fin_real: horaLocal(payload.finReal),
    observaciones: payload.observaciones,
  })
  return { success: true, parada: aParada(p) }
}

/** Fecha y horas para mover una parada al siguiente día hábil, con su mismo horario. */
async function siguienteHorario(paradaId) {
  const p = await api.obtenerParada(paradaId)
  if (!p) throw new Error('Parada no encontrada')
  return { Fecha: fechaLocal(siguienteDiaHabil(p.fecha)), Inicio: p.inicio, Fin: p.fin }
}

/** Cierra la parada con lo hecho y pasa las tareas restantes a una copia el siguiente día hábil. */
export async function cumplirYReprogramarRestantes(paradaId, payload = {}) {
  const horario = await siguienteHorario(paradaId)
  const r = await api.cumplirYReprogramarApi(paradaId, {
    ...horario,
    tareas_estado: aTareasEstado(payload.tareas),
    observaciones: payload.observaciones,
  })
  return {
    success: true,
    parada: aParada(r.parada_original),
    copia: r.parada_nueva ? aParada(r.parada_nueva) : null,
  }
}

/** Mueve la parada vencida al siguiente día hábil, conservando sus tareas y horas. */
export async function reprogramarParada(paradaId) {
  const horario = await siguienteHorario(paradaId)
  const p = await api.reprogramarParadaApi(paradaId, { ...horario, motivo: 'vencida' })
  return { success: true, parada: aParada(p) }
}
