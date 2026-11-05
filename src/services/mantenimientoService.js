import { ALERTAS_MOCK, ARCHIVOS_SEMANA_MOCK, buildParadasSemana, PLAN_SUGERIDO_MOCK, TAREAS_SUGERIDAS_MOCK } from '../data/mock/mantenimiento.js'

let paradas = []
let planSugerido = PLAN_SUGERIDO_MOCK.map((p) => ({ ...p }))
let tareasSugeridas = TAREAS_SUGERIDAS_MOCK.map((t) => ({ ...t }))
let archivos = ARCHIVOS_SEMANA_MOCK.map((f) => ({ ...f }))

export async function getAlertasSemana() { await new Promise((r) => setTimeout(r, 150)); return ALERTAS_MOCK }
export async function getArchivosSemana() { await new Promise((r) => setTimeout(r, 100)); return archivos }
export async function subirArchivo({ tipo, file }) {
  await new Promise((r) => setTimeout(r, 500))
  const entry = { id: 'f-' + Date.now(), tipo, icon: tipo === 'Avisos de daño' ? 'AlertTriangle' : tipo === 'Órdenes de trabajo' ? 'ClipboardList' : 'CalendarCheck', nombre: file?.name || 'archivo.xlsx', estado: 'actual', actualizado: new Date().toISOString() }
  archivos = archivos.filter((f) => f.tipo !== tipo)
  archivos.unshift(entry)
  return { ok: true, archivo: entry }
}
export async function getParadasSemana({ startISO }) {
  await new Promise((r) => setTimeout(r, 150))
  if (!paradas.length && startISO) paradas = buildParadasSemana({ startISO })
  return paradas
}
export async function programarParada(parada) {
  await new Promise((r) => setTimeout(r, 200))
  const tareasArr = parada.tareasDetalle ? parada.tareasDetalle.map(t => t.descripcion) : (parada.tareas || [])
  const p = { id: 'p-' + Date.now(), ...parada, tareas: tareasArr, tareasDetalle: parada.tareasDetalle || [] }
  paradas = [...paradas, p]
  return p
}

export async function actualizarParada(id, datos) {
  await new Promise((r) => setTimeout(r, 200))
  const tareasArr = datos.tareasDetalle ? datos.tareasDetalle.map(t => t.descripcion) : (datos.tareas || [])
  paradas = paradas.map((p) => p.id === id ? { ...p, ...datos, tareas: tareasArr, tareasDetalle: datos.tareasDetalle || p.tareasDetalle || [] } : p)
  return { ok: true }
}

export async function eliminarParada(id) {
  await new Promise((r) => setTimeout(r, 150))
  paradas = paradas.filter((p) => p.id !== id)
  return { ok: true }
}
export async function getPlanSugerido() { await new Promise((r) => setTimeout(r, 150)); return planSugerido }
export async function enviarPlanACalendario(id, { fecha, horaInicio, horaFin }) {
  await new Promise((r) => setTimeout(r, 200))
  planSugerido = planSugerido.map((p) => p.id === id ? { ...p, enCalendario: true, parada: { ...p.parada, fecha, horaInicio, horaFin } } : p)
  const item = planSugerido.find((p) => p.id === id)
  if (item && fecha) paradas = [...paradas, { id: 'p-plan-' + id, fecha, maquina: item.maquina, tipo: 'Predictiva o sugerida por el sistema', titulo: item.tarea, horaInicio, horaFin, tareas: [item.tarea, 'Verificación', 'Pruebas'] }]
  return { ok: true }
}
export async function getTareasSugeridas() { await new Promise((r) => setTimeout(r, 150)); return tareasSugeridas }
export async function enviarTareaAParada(tareaId, { paradaId }) {
  await new Promise((r) => setTimeout(r, 200))
  tareasSugeridas = tareasSugeridas.map((t) => t.id === tareaId ? { ...t, paradaSugerida: { ...t.paradaSugerida, existe: true, id: paradaId } } : t)
  const tarea = tareasSugeridas.find((t) => t.id === tareaId)
  paradas = paradas.map((p) => p.id === paradaId ? { ...p, tareas: [...(p.tareas || []), tarea?.tarea].filter(Boolean) } : p)
  return { ok: true }
}
export async function crearParadaYAsignar({ tareaId, parada }) {
  await new Promise((r) => setTimeout(r, 250))
  const p = { id: 'p-' + Date.now(), ...parada, tareas: parada.tareas || [] }
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
