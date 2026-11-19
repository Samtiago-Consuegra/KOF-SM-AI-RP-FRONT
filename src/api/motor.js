/**
 * Endpoints del motor de planes (/motor) y de paradas (/paradas).
 * "Python calcula, la app solo muestra": aquí no se transforma nada; la traducción
 * de campos va en motorAdapter.js. Las respuestas 202 {"status":"calculando"} y
 * {"available": false} se devuelven tal cual (son estados normales, no errores).
 */
import { apiDelete, apiGet, apiPost, apiPut, apiUpload, clearApiCache, invalidarCoberturaEvt } from './client.js'

const enc = (v) => encodeURIComponent(String(v))

/** Tras una escritura el back encola una corrida: lo cacheado deja de ser válido. */
async function escribir(promesa) {
  const res = await promesa
  clearApiCache()
  return res
}

/** Crear, editar o borrar una parada cambia la cobertura de "paradas". */
async function escribirParada(promesa) {
  const res = await escribir(promesa)
  invalidarCoberturaEvt()
  return res
}

// --- Cobertura -----------------------------------------------------------------------------------

/** Primer y último día con datos por fuente. Se cachea en useCobertura (una sola petición en la app). */
export const getCobertura = () => apiGet('/cobertura', undefined, { trackSlow: false })

// --- Motor: estado y archivos --------------------------------------------------------------------

/** { run: {status: en_cola|en_proceso|ok|error, error, ...} | null, en_cola, pendientes } */
export const getMotorEstado = (opts) => apiGet('/motor/estado', undefined, { trackSlow: false, ...opts })

export const getArchivosMotor = () => apiGet('/motor/archivos')

/** params: { tipo, desde, hasta, buscar, pagina, por_pagina } — sin caché: siempre fresco. */
export const getHistorialArchivos = (params) => apiGet('/motor/archivos/historial', params)

export function subirArchivoMotor(tipo, file) {
  const form = new FormData()
  form.append('tipo', tipo)
  form.append('file', file)
  return apiUpload('/motor/archivos', form)
}

// --- Motor: salidas ------------------------------------------------------------------------------

export const getCatalogo = () => apiGet('/motor/catalogo')

export const getAlertas = (semana) => apiGet('/motor/alertas', { semana })

export const getPlanSemanal = (semana) => apiGet('/motor/plan-semanal', { semana })

/** Devuelve un Blob (xlsx) o, si aún no existe, el JSON 202 / {available:false}. */
export const descargarPlanSemanalExcel = (semana) =>
  apiGet('/motor/plan-semanal/excel', { semana }, { responseType: 'blob', trackSlow: false })

/** params: { desde, hasta, maquina } → { ordenes: [...], resumen: { total, por_tipo, por_estado } } (máx. 31 días) */
export const getOrdenesSap = (params) => apiGet('/motor/ordenes-sap', params)

export const getPlanRecomendado =() => apiGet('/motor/plan-recomendado')

export const getHistoriaClinica = () => apiGet('/motor/historia-clinica')

export const getHistoriaClinicaAcr = () => apiGet('/motor/historia-clinica-acr')

// --- Historia clínica (cálculos por periodo en app/historia_service.py) ------------------------

/** { available, months, min, max, datos_hasta } — límites del filtro de periodo. */
export const getHistoriaPeriodos = () => apiGet('/motor/historia/periodos')

/** { available, maquina, sistemas: [{ id, nombre, componentes: [{ id, nombre }] }] } */
export const getHistoriaJerarquia = (maquina) => apiGet('/motor/historia/jerarquia', { maquina })

/** params: { maquina, desde, hasta } */
export const getHistoriaFicha = (params) => apiGet('/motor/historia/ficha', params)

/** params: { maquina, desde, hasta, sistema, componente } */
export const getHistoriaIndicadores = (params) => apiGet('/motor/historia/indicadores', params)

/** params: { maquina, sistema, componente } — últimos 12 meses con datos. */
export const getHistoriaParosPorMes = (params) => apiGet('/motor/historia/paros-por-mes', params)

/** params: { maquina, desde, hasta } — datos del PDF "Exportar historia". */
export const getHistoriaResumen = (params) => apiGet('/motor/historia/resumen', params)

/** params: { maquina, tipo, desde, hasta, sistema, id_componente, pagina, por_pagina } */
export const getEventosHistoria = (params) => apiGet('/motor/historia/eventos', params)

export const getCumplimientoSap = () => apiGet('/motor/cumplimiento-sap')

// --- Motor: decisiones ---------------------------------------------------------------------------

export const enviarDecision = ({ Id_tarea, Decision, Id_parada = null, semana = null }) =>
  escribir(apiPost('/motor/decisiones', { Id_tarea, Decision, Id_parada, semana }))

export const deshacerDecision = (id) => escribir(apiDelete(`/motor/decisiones/${enc(id)}`))

// --- Paradas -------------------------------------------------------------------------------------

/** params: { desde, hasta, maquina, estado } */
export const listarParadas = (params) => apiGet('/paradas', params)

export const obtenerParada = (id) => apiGet(`/paradas/${enc(id)}`)

export const crearParada = (datos) => escribirParada(apiPost('/paradas', datos))

export const editarParada = (id, datos) => escribirParada(apiPut(`/paradas/${enc(id)}`, datos))

export const borrarParada = (id) => escribirParada(apiDelete(`/paradas/${enc(id)}`))

export const registrarSeguimientoParada = (id, datos) =>
  escribir(apiPost(`/paradas/${enc(id)}/seguimiento`, datos))

export const cumplirParadaApi = (id, datos = {}) => escribir(apiPost(`/paradas/${enc(id)}/cumplir`, datos))

export const cumplirYReprogramarApi = (id, datos) =>
  escribir(apiPost(`/paradas/${enc(id)}/cumplir-y-reprogramar`, datos))

export const reprogramarParadaApi = (id, datos) => escribir(apiPost(`/paradas/${enc(id)}/reprogramar`, datos))

// --- Cumplimiento (cálculos en app/cumplimiento_service.py) --------------------------------------

/** params: { desde, hasta, maquina } → { programadas, ejecutadas, vencidas, pospuestas, cumplimiento_pct } */
export const getCumplimientoResumen = (params) => apiGet('/cumplimiento/resumen', params)

/** params: { desde, hasta, maquina, agrupar: 'maquina' | 'semana' } → { filas: [...] } */
export const getCumplimientoGrafica = (params) => apiGet('/cumplimiento/grafica', params)
