import { buildParadasSemana, PLAN_SUGERIDO_MOCK, TAREAS_SUGERIDAS_MOCK } from '../data/mock/mantenimiento.js'
import { maquinasDeParada } from '../utils/paradas.js'
import { getAlertas, getArchivosMotor, subirArchivoMotor } from '../api/motor.js'
import { adaptarAlertas, adaptarArchivos, adaptarSubida } from '../api/motorAdapter.js'

function normalizarParada(datos = {}) {
  const maquinas = maquinasDeParada(datos)
  return {
    ...datos,
    condicion: datos.condicion || 'frio',
    maquinas,
    maquina: datos.maquina || maquinas[0] || '',
  }
}

let paradas = []
let planSugerido = PLAN_SUGERIDO_MOCK.map((p) => ({ ...p }))
let tareasSugeridas = TAREAS_SUGERIDAS_MOCK.map((t) => ({ ...t }))
export async function getAlertasSemana(semana) { return adaptarAlertas(await getAlertas(semana)) }
export async function getArchivosSemana() { return adaptarArchivos(await getArchivosMotor()) }
/** tipo: clave del motor (avisos, ordenes, plan, consolidado, acr, acr_revisado). */
export async function subirArchivo({ tipo, file }) { return adaptarSubida(await subirArchivoMotor(tipo, file)) }
export async function getParadasSemana({ startISO }) {
  await new Promise((r) => setTimeout(r, 150))
  if (!paradas.length && startISO) paradas = buildParadasSemana({ startISO })
  return paradas
}
export async function programarParada(parada) {
  await new Promise((r) => setTimeout(r, 200))
  const normalizada = normalizarParada(parada)
  const tareasArr = normalizada.tareasDetalle ? normalizada.tareasDetalle.map(t => t.descripcion) : (normalizada.tareas || [])
  const p = { id: 'p-' + Date.now(), ...normalizada, tareas: tareasArr, tareasDetalle: normalizada.tareasDetalle || [] }
  paradas = [...paradas, p]
  return p
}

export async function actualizarParada(id, datos) {
  await new Promise((r) => setTimeout(r, 200))
  const normalizada = normalizarParada(datos)
  paradas = paradas.map((p) => {
    if (p.id !== id) return p
    const tareasDetalle = normalizada.tareasDetalle || p.tareasDetalle || []
    const tareasArr = normalizada.tareasDetalle ? normalizada.tareasDetalle.map(t => t.descripcion) : (normalizada.tareas || p.tareas || [])
    return { ...p, ...normalizada, tareas: tareasArr, tareasDetalle }
  })
  return { ok: true }
}

export async function eliminarParada(id) {
  await new Promise((r) => setTimeout(r, 150))
  paradas = paradas.filter((p) => p.id !== id)
  return { ok: true }
}
export async function getPlanSugerido() { await new Promise((r) => setTimeout(r, 150)); return planSugerido }
export async function enviarPlanACalendario(id, { fecha, horaInicio, horaFin, condicion = 'frio' }) {
  await new Promise((r) => setTimeout(r, 200))
  planSugerido = planSugerido.map((p) => p.id === id ? { ...p, enCalendario: true, parada: { ...p.parada, fecha, horaInicio, horaFin } } : p)
  const item = planSugerido.find((p) => p.id === id)
  if (item && fecha) paradas = [...paradas, { id: 'p-plan-' + id, fecha, condicion: condicion || 'frio', maquina: item.maquina, maquinas: [item.maquina], tipo: 'Predictiva o sugerida por el sistema', titulo: item.tarea, horaInicio, horaFin, tareas: [item.tarea, 'Verificación', 'Pruebas'] }]
  return { ok: true }
}
export async function getTareasSugeridas() { await new Promise((r) => setTimeout(r, 150)); return tareasSugeridas }
export async function enviarTareaAParada(tareaId, { paradaId }) {
  await new Promise((r) => setTimeout(r, 200))
  tareasSugeridas = tareasSugeridas.map((t) => t.id === tareaId ? { ...t, paradaSugerida: { ...t.paradaSugerida, existe: true, id: paradaId } } : t)
  const tarea = tareasSugeridas.find((t) => t.id === tareaId)
  paradas = paradas.map((p) => {
    if (p.id !== paradaId) return p
    const maquinas = [...new Set([...maquinasDeParada(p), tarea?.maquina].filter(Boolean))]
    const baseDetalle = p.tareasDetalle?.length
      ? p.tareasDetalle
      : (p.tareas || []).map((desc) => ({ maquina: p.maquina || '', sistema: '', componente: '', tipo: 'Preventiva', descripcion: desc }))
    const tareasDetalle = tarea
      ? [...baseDetalle, { maquina: tarea.maquina, sistema: tarea.sistema, componente: tarea.componente, tipo: 'Preventiva', descripcion: tarea.tarea }]
      : baseDetalle
    return { ...p, maquinas, tareas: [...(p.tareas || []), tarea?.tarea].filter(Boolean), tareasDetalle }
  })
  return { ok: true }
}
export async function crearParadaYAsignar({ tareaId, parada }) {
  await new Promise((r) => setTimeout(r, 250))
  const p = { id: 'p-' + Date.now(), ...normalizarParada(parada), tareas: parada.tareas || [] }
  paradas = [...paradas, p]
  tareasSugeridas = tareasSugeridas.map((t) => t.id === tareaId ? { ...t, paradaSugerida: { ...t.paradaSugerida, existe: true, id: p.id } } : t)
  return { ok: true, parada: p }
}
export async function getAsistenteSugerencias() { return ['¿Qué paradas hay esta semana?', '¿Qué componente falla más?', '¿Qué tareas están pendientes?'] }
export async function enviarMensajeAsistente(historial) {
  await new Promise((r) => setTimeout(r, 700))
  const { respuestaAsistenteSimulada } = await import('../data/mock/mantenimiento.js')
  const ultimo = Array.isArray(historial) ? historial[historial.length - 1] : { text: '' }
  return { respuesta: respuestaAsistenteSimulada(ultimo?.text || '') }
}
