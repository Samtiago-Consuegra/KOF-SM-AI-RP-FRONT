import {
  getAlertas, getArchivosMotor, subirArchivoMotor, getCatalogo, getPlanSemanal, descargarPlanSemanalExcel,
  crearParada, editarParada, borrarParada, enviarDecision, deshacerDecision,
} from '../api/motor.js'
import {
  adaptarAlertas, adaptarArchivos, adaptarSubida, adaptarCatalogo, adaptarParadasPlan, adaptarPlanSugerido,
  adaptarSinParada, adaptarIndicadores, paradaAMotor, idParadaCreada, semanaISO,
} from '../api/motorAdapter.js'

let maquinasCatalogo = []

export async function getAlertasSemana(semana) { return adaptarAlertas(await getAlertas(semana)) }
export async function getArchivosSemana() { return adaptarArchivos(await getArchivosMotor()) }
/** tipo: clave del motor (avisos, ordenes, plan, consolidado, acr, acr_revisado). */
export async function subirArchivo({ tipo, file }) { return adaptarSubida(await subirArchivoMotor(tipo, file)) }

/** Menús del formulario de parada (catalogo.json). */
export async function getCatalogoParada() {
  const cat = adaptarCatalogo(await getCatalogo())
  if (cat.maquinas.length) maquinasCatalogo = cat.maquinas
  return cat
}

export async function getParadasSemana({ startISO }) {
  return adaptarParadasPlan(await getPlanSemanal(semanaISO(startISO)))
}
export async function getIndicadoresSemana(semana) { return adaptarIndicadores(await getPlanSemanal(semana)) }
export async function getPlanSugerido(semana) { return adaptarPlanSugerido(await getPlanSemanal(semana)) }
export async function getTareasSugeridas(semana) { return adaptarSinParada(await getPlanSemanal(semana)) }

export async function programarParada(parada) {
  const res = await crearParada(paradaAMotor(parada, maquinasCatalogo))
  return { ...parada, id: idParadaCreada(res) }
}
export async function actualizarParada(id, datos) {
  await editarParada(id, paradaAMotor(datos, maquinasCatalogo))
  return { ok: true }
}
export async function eliminarParada(id) {
  await borrarParada(id)
  return { ok: true }
}

export async function enviarPlanACalendario(id, { paradaId = null, semana = null } = {}) {
  await enviarDecision({ Id_tarea: id, Decision: 'Enviada', Id_parada: paradaId, semana })
  return { ok: true }
}
export async function enviarTareaAParada(tareaId, { paradaId = null, semana = null } = {}) {
  await enviarDecision({ Id_tarea: tareaId, Decision: 'Enviada', Id_parada: paradaId, semana })
  return { ok: true }
}
export async function crearParadaYAsignar({ tareaId, parada, semana = null }) {
  const creada = await programarParada(parada)
  await enviarDecision({ Id_tarea: tareaId, Decision: 'Enviada', Id_parada: creada.id, semana })
  return { ok: true, parada: creada }
}
export async function posponerTarea(tareaId, semana = null) {
  await enviarDecision({ Id_tarea: tareaId, Decision: 'Pospuesta', semana })
  return { ok: true }
}
export async function deshacerDecisionTarea(tareaId) {
  await deshacerDecision(tareaId)
  return { ok: true }
}

/** Excel generado por el motor. { ok:true, blob } o { ok:false, calculando, message }. */
export async function descargarExcelSemana(semana) {
  const res = await descargarPlanSemanalExcel(semana)
  if (res instanceof Blob) return { ok: true, blob: res }
  return { ok: false, calculando: res?.status === 'calculando', message: res?.message || '' }
}

export async function getAsistenteSugerencias() { return ['¿Qué paradas hay esta semana?', '¿Qué componente falla más?', '¿Qué tareas están pendientes?'] }
export async function enviarMensajeAsistente(historial) {
  await new Promise((r) => setTimeout(r, 700))
  const { respuestaAsistenteSimulada } = await import('../data/mock/mantenimiento.js')
  const ultimo = Array.isArray(historial) ? historial[historial.length - 1] : { text: '' }
  return { respuesta: respuestaAsistenteSimulada(ultimo?.text || '') }
}
