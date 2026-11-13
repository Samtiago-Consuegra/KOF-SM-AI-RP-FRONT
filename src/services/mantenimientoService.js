// Servicio de la pestaña Mantenimiento.
// Lee los resultados del motor (backend /motor y /paradas) y los entrega con la MISMA forma que usaban
// los datos de ejemplo de la rama main, para que los componentes de la pantalla no cambien.
// Aquí no se calcula nada del mantenimiento: solo se filtra, se agrupa y se renombran campos.
import { AlertTriangle, CalendarCheck, ClipboardList, FileCheck2, FileSearch, Layers } from 'lucide-react'
import * as api from '../api/motor.js'
import { esperarFin, vigilar } from './motorEstadoStore.js'
import { maquinasDeParada } from '../utils/paradas.js'

const MAQUINAS_LINEA = ['Llenadora', 'Empacadora', 'Paletizadora', 'Envolvedora']
const TODA_LA_LINEA = 'Toda la línea'
const MAX_ALERTAS = 5

// ---------------------------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------------------------
const esperar = (ms) => new Promise((r) => setTimeout(r, ms))

function hoyISO() {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

/** 'AAAA-MM-DD' -> semana ISO 'AAAA-Wnn' (parámetro que usa el backend). */
export function semanaISO(fechaISO) {
  const d = new Date(String(fechaISO || hoyISO()).slice(0, 10) + 'T00:00:00Z')
  const dia = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dia)
  const inicioAnio = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const semana = Math.ceil(((d - inicioAnio) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(semana).padStart(2, '0')}`
}

function sumarDias(fechaISO, n) {
  const d = new Date(fechaISO + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/** '2026-11-09' -> 'Lun 9 nov' (formato de la columna PARADA). */
function etiquetaDia(fechaISO) {
  if (!fechaISO) return 'Por definir'
  const d = new Date(fechaISO + 'T00:00:00')
  const dia = d.toLocaleDateString('es-CO', { weekday: 'short' }).replace('.', '')
  const mes = d.toLocaleDateString('es-CO', { month: 'short' }).replace('.', '')
  return `${dia.charAt(0).toUpperCase()}${dia.slice(1)} ${d.getDate()} ${mes}`
}

// La pantalla de main maneja tres niveles de prioridad (Alta, Media, Baja). El motor usa cuatro:
// "Crítica" se muestra como "Alta" (la más alta que tiene la pantalla) y el orden se conserva.
const PRIORIDAD_PANTALLA = { 'Crítica': 'Alta', 'Alta': 'Alta', 'Media': 'Media', 'Baja': 'Baja' }
const RANGO_PRIORIDAD = { 'Crítica': 0, 'Alta': 1, 'Media': 2, 'Baja': 3 }
const prioridadPantalla = (p) => PRIORIDAD_PANTALLA[p] || 'Media'

/**
 * El motor responde 202 {status:"calculando"} mientras corre. Se reintenta hasta que haya datos.
 * {available:false} = todavía no se han subido los archivos: se devuelve null.
 */
async function conDatos(llamada, intentos = 40) {
  for (let i = 0; i < intentos; i++) {
    const res = await llamada()
    if (res?.status === 'calculando') { await esperar(3000); continue }
    if (res?.available === false) return null
    return res
  }
  return null
}

/** Después de una escritura el backend recalcula: se espera (con el vigilante único) a que termine. */
const esperarMotor = () => esperarFin()

// ---------------------------------------------------------------------------------------------
// Plan semanal del motor (una sola consulta por semana, compartida por calendario y tablas)
// ---------------------------------------------------------------------------------------------
let semanaVista = semanaISO(hoyISO())
const planPorSemana = new Map()

function planSemanal(semana = semanaVista, { fresco = false } = {}) {
  if (fresco || !planPorSemana.has(semana)) {
    planPorSemana.set(semana, conDatos(() => api.getPlanSemanal(semana)).catch(() => null))
  }
  return planPorSemana.get(semana)
}

// Caché en memoria de lo ya mostrado: al volver a la vista se pinta al instante y se refresca en silencio.
const cacheSemanas = new Map()
let cacheArchivos = null

function guardar(semana, campo, valor) {
  cacheSemanas.set(semana, { ...cacheSemanas.get(semana), [campo]: valor, guardadoEn: Date.now() })
  return valor
}

/** { paradas, alertas, plan, tareas, guardadoEn } de la semana, o null. No hace peticiones. */
export function leerCacheSemana(startISO) {
  return startISO ? cacheSemanas.get(semanaISO(startISO)) ?? null : null
}

/** Últimos archivos cargados, o null. No hace peticiones. */
export function leerCacheArchivos() {
  return cacheArchivos
}

export function invalidar() {
  planPorSemana.clear()
  cacheSemanas.clear()
  cacheArchivos = null
}

function versionFusion(res) {
  return res?.versiones?.fusion || {}
}

/** Paradas que propone el programador (son las mismas paradas del usuario, por Id_parada). */
function paradasDelPlan(res) {
  const mapa = new Map()
  ;(versionFusion(res).paradas || []).forEach((p) => mapa.set(p.Id_parada, p))
  return mapa
}

// Qué se muestra en las tablas de sugerencias:
//  - NO las tareas que escribió el usuario (ya están en su parada).
//  - NO las órdenes "por verificar" (abiertas de la semana pasada: casi siempre hechas y sin cerrar).
//  - NO las que el usuario pospuso.
function seMuestraEnSugerencias(t) {
  if (t.Origen === 'Registrada por el usuario') return false
  if (String(t.Estado || '').startsWith('Verificar')) return false
  if (t.Estado === 'Pospuesta por el usuario') return false
  return true
}

function paradaSugerida(t, paradas) {
  const p = t.Id_parada ? paradas.get(t.Id_parada) : null
  if (!p) return { existe: false, id: null, fecha: null, horaInicio: '', horaFin: '', dia: 'Por definir', maquina: t.Maquina }
  return { existe: true, id: p.Id_parada, fecha: p.Fecha, horaInicio: p.Inicio, horaFin: p.Fin, dia: etiquetaDia(p.Fecha), maquina: t.Maquina }
}

const enviada = (t) => t.Decision === 'Enviada' || t.Estado === 'Enviada a la parada'
const ordenarPorPrioridad = (a, b) => (RANGO_PRIORIDAD[a._prioridadMotor] ?? 9) - (RANGO_PRIORIDAD[b._prioridadMotor] ?? 9)

// ---------------------------------------------------------------------------------------------
// Alertas: solo las 5 que el motor marca como destacadas de la semana
// ---------------------------------------------------------------------------------------------
// Íconos y colores que ya existen en la tarjeta de alertas de main.
const ICONO = {
  'Ciclo': 'RefreshCcw', 'Paros en aumento': 'TrendingUp', 'Síntomas': 'Stethoscope', 'Estacionalidad': 'CalendarRange',
  'Cumplimiento': 'ClipboardX', 'Brecha del plan': 'ShieldAlert', 'Oportunidad': 'Lightbulb',
  'Riesgo de repuesto': 'ShieldAlert', 'Falla mayor en racha': 'TrendingUp',
  'Después de mantenimiento mayor': 'Stethoscope', 'Acción ACR sin cierre': 'ClipboardX',
}
const COLOR = { 'Crítica': 'primary-500', 'Alta': 'primary-600', 'Media': 'ink-700', 'Baja': 'tertiary' }
const ACCION = {
  componente: { accion: 'Ver en Historia clínica', accionRuta: '/historia-clinica' },
  plan: { accion: 'Ver plan', accionRuta: '/mantenimiento', accionTab: 'plan' },
  calendario: { accion: 'Ver calendario', accionRuta: '/mantenimiento' },
}

export async function getAlertasSemana(startISO) {
  const semana = startISO ? semanaISO(startISO) : semanaVista
  const res = await conDatos(() => api.getAlertas(semana)).catch(() => null)
  const todas = Array.isArray(res?.alertas) ? res.alertas : []
  // El motor ya las entrega ordenadas por prioridad del componente y marca con Mostrar=true las
  // destacadas (máximo 5, una por componente, máximo 2 del mismo tipo). Aquí solo se respetan.
  return guardar(semana, 'alertas', todas
    .filter((a) => a.Mostrar === true)
    .slice(0, MAX_ALERTAS)
    .map((a, i) => ({
      id: a.Id_alerta || `alerta-${i}`,
      tipo: a.Tipo,
      icon: ICONO[a.Tipo] || 'RefreshCcw',
      color: COLOR[a.Prioridad] || 'ink-700',
      maquina: a.Maquina || '',
      componente: a.Componente || 'General',
      mensaje: a.Mensaje || '',
      disparado: a.Evidencia || '',
      ...(ACCION[String(a.Enlace || '').toLowerCase()] || ACCION.componente),
    })))
}

// ---------------------------------------------------------------------------------------------
// Archivos
// ---------------------------------------------------------------------------------------------
/** Única fuente de verdad de los tipos de Excel del motor (modal, tarjeta e historial). */
export const ARCHIVOS = [
  { clave: 'avisos', tipo: 'Avisos de daño', desc: 'Avisos de daño SAP', Icon: AlertTriangle },
  { clave: 'ordenes', tipo: 'Órdenes de trabajo', desc: 'Órdenes de trabajo SAP', Icon: ClipboardList },
  { clave: 'plan', tipo: 'Plan preventivo', desc: 'Plan preventivo vigente', Icon: CalendarCheck },
  { clave: 'consolidado', tipo: 'Consolidado de fallas mayores', desc: 'Fallas mayores consolidadas', Icon: Layers },
  { clave: 'acr', tipo: 'ACR', desc: 'Uno o varios análisis de causa raíz', Icon: FileSearch },
  { clave: 'acr_revisado', tipo: 'ACR revisado', desc: 'Consolidado de ACR revisado', Icon: FileCheck2 },
]

export async function getArchivosSemana() {
  const res = await api.getArchivosMotor().catch(() => null)
  const vigentes = res?.vigentes || {}
  const acrs = Array.isArray(res?.acr) ? res.acr : []
  cacheArchivos = ARCHIVOS.map((a) => {
    // El back ordena los ACR por fecha descendente: el primero es el último subido.
    const f = a.clave === 'acr' ? acrs[0] : vigentes[a.clave]
    return {
      id: f?.id ? String(f.id) : `sin-${a.clave}`,
      clave: a.clave,
      tipo: a.tipo,
      nombre: f?.nombre_archivo || '',
      estado: f ? 'actual' : 'sin_actualizar',
      actualizado: f?.subido_en || null,
      ...(a.clave === 'acr' ? { total: acrs.length } : {}),
    }
  })
  return cacheArchivos
}

export async function subirArchivo({ tipo, file }) {
  const clave = ARCHIVOS.find((a) => a.clave === tipo || a.tipo === tipo)?.clave
  if (!clave) throw new Error('Tipo de archivo no reconocido')
  const res = await api.subirArchivoMotor(clave, file)
  invalidar()
  vigilar() // el back encoló una corrida: Mantenimiento se entera cuando termine
  return { ok: true, archivo: res?.archivo }
}

// ---------------------------------------------------------------------------------------------
// Paradas (las del usuario, guardadas en el backend)
// ---------------------------------------------------------------------------------------------
const tipoDeClase = (clase) => (String(clase || '').includes('Predictiva') ? 'Predictiva'
  : String(clase || '').includes('Correctiva') ? 'Correctiva' : 'Preventiva')

function tareasEnviadas(resPlan, idParada) {
  return (versionFusion(resPlan).tareas_sugeridas || [])
    .filter((t) => t.Id_parada === idParada && t.Origen !== 'Registrada por el usuario' && enviada(t))
}

function tipoParada(detalle, hayEnviadas) {
  if (!detalle.length) return 'Parada de producción (limpieza, cambio de formato)'
  const conteo = { Correctiva: 0, Predictiva: 0, Preventiva: 0 }
  detalle.forEach((t) => { if (conteo[t.tipo] !== undefined) conteo[t.tipo] += 1 })
  if (hayEnviadas && conteo.Correctiva === 0 && conteo.Predictiva >= conteo.Preventiva) return 'Predictiva o sugerida por el sistema'
  if (conteo.Correctiva >= conteo.Predictiva && conteo.Correctiva >= conteo.Preventiva) return 'Correctiva'
  if (conteo.Predictiva >= conteo.Preventiva) return 'Predictiva o sugerida por el sistema'
  return 'Preventiva'
}

function paradaPantalla(p, resPlan) {
  const manuales = (p.tareas_manuales || []).map((t) => ({
    maquina: t.Maquina, sistema: t.Sistema || '', sistemaId: t.Sistema || '',
    componente: t.Componente || '', componenteId: t.Id_componente || t.Componente || '',
    tipo: t.Tipo_tarea || 'Preventiva', descripcion: t.Tarea,
  }))
  const enviadas = tareasEnviadas(resPlan, p.id_parada).map((t) => ({
    maquina: t.Maquina, sistema: t.Sistema || '', sistemaId: t.Sistema || '',
    componente: t.Componente || '', componenteId: t.Id_componente || t.Componente || '',
    tipo: tipoDeClase(t.Clase_orden), descripcion: t.Tarea, idMotor: t.Id_tarea,
  }))
  const tareasDetalle = [...manuales, ...enviadas]
  const maquinas = (p.maquinas || []).includes(TODA_LA_LINEA) ? [...MAQUINAS_LINEA] : (p.maquinas || [])
  return {
    id: p.id_parada,
    fecha: p.fecha,
    condicion: p.modalidad === 'Caliente' ? 'caliente' : 'frio',
    maquinas,
    maquina: maquinas[0] || '',
    tipo: tipoParada(tareasDetalle, enviadas.length > 0),
    titulo: p.titulo,
    horaInicio: p.inicio,
    horaFin: p.fin,
    tareas: tareasDetalle.map((t) => t.descripcion),
    tareasDetalle,
  }
}

let ultimasParadas = []

export async function getParadasSemana({ startISO }) {
  if (!startISO) return []
  semanaVista = semanaISO(startISO)
  const [lista, resPlan] = await Promise.all([
    api.listarParadas({ desde: startISO, hasta: sumarDias(startISO, 6) }).catch(() => []),
    planSemanal(semanaVista),
  ])
  ultimasParadas = (Array.isArray(lista) ? lista : []).map((p) => paradaPantalla(p, resPlan))
  return guardar(semanaVista, 'paradas', ultimasParadas)
}

const esIdCatalogo = (v) => /^[A-Z]{3}-\d{3}$/.test(String(v || ''))

/** Datos del formulario de main -> cuerpo que espera POST/PUT /paradas. */
function paradaAlBackend(datos, idParada = null) {
  const detalle = datos.tareasDetalle || (datos.tareas || []).map((d) => ({ descripcion: d, tipo: 'Preventiva', maquina: datos.maquina }))
  // Las tareas que vinieron del motor (enviadas a esta parada) siguen siendo decisiones, no tareas
  // escritas a mano: no se guardan otra vez como manuales.
  const previa = idParada ? ultimasParadas.find((p) => p.id === idParada) : null
  const delMotor = new Set((previa?.tareasDetalle || []).filter((t) => t.idMotor).map((t) => t.descripcion))
  const manuales = detalle.filter((t) => t.descripcion && !delMotor.has(t.descripcion))
  let maquinas = [...new Set([...(datos.maquinas || []), ...manuales.map((t) => t.maquina)].filter(Boolean))]
  if (!maquinas.length) maquinas = datos.maquina ? [datos.maquina] : [TODA_LA_LINEA]
  return {
    Titulo: datos.titulo,
    Modalidad: datos.condicion === 'caliente' ? 'Caliente' : 'Frío',
    Fecha: datos.fecha,
    Inicio: datos.horaInicio,
    Fin: datos.horaFin,
    Maquinas: maquinas,
    Tareas_manuales: manuales.map((t) => ({
      Maquina: t.maquina || maquinas[0],
      Sistema: t.sistema || null,
      Id_componente: esIdCatalogo(t.componenteId) ? t.componenteId : null,
      Componente: t.componente || null,
      Tipo_tarea: ['Preventiva', 'Predictiva', 'Correctiva'].includes(t.tipo) ? t.tipo : 'Preventiva',
      Tarea: t.descripcion,
    })),
  }
}

export async function programarParada(parada) {
  // Si al crear la parada desde una sugerencia viene esa misma tarea, se registra como sugerencia
  // enviada (decisión) y no como una tarea escrita a mano, para que no quede duplicada.
  const sugeridas = [...ultimoPlan.map((p) => ({ texto: p.tarea, ids: [p.id], maquina: p.maquina })),
    ...ultimasTareas.map((t) => ({ texto: t.tarea, ids: t.idsMotor, maquina: t.maquina }))]
  const detalle = parada.tareasDetalle || []
  const coincide = (t) => sugeridas.find((s) => s.texto === t.descripcion && s.maquina === t.maquina)
  const aEnviar = detalle.map(coincide).filter(Boolean)
  const cuerpo = paradaAlBackend({ ...parada, tareasDetalle: detalle.filter((t) => !coincide(t)) })
  if (!cuerpo.Maquinas.length || (cuerpo.Maquinas.length === 1 && cuerpo.Maquinas[0] === TODA_LA_LINEA && aEnviar.length)) {
    cuerpo.Maquinas = [...new Set(aEnviar.map((s) => s.maquina))]
  }
  const res = await api.crearParada(cuerpo)
  const idParada = res?.id_parada
  if (idParada) {
    await Promise.all(aEnviar.flatMap((s) => s.ids).map((Id_tarea) =>
      api.enviarDecision({ Id_tarea, Decision: 'Enviada', Id_parada: idParada, semana: semanaVista })))
  }
  invalidar()
  await esperarMotor()
  return { id: idParada, ...parada }
}

export async function actualizarParada(id, datos) {
  // Si al editar el usuario quitó una tarea que había enviado desde las sugerencias, se deshace esa decisión.
  const previa = ultimasParadas.find((p) => p.id === id)
  const quedan = new Set((datos.tareasDetalle || []).map((t) => t.descripcion))
  const quitadas = (previa?.tareasDetalle || []).filter((t) => t.idMotor && !quedan.has(t.descripcion))
  await api.editarParada(id, paradaAlBackend(datos, id))
  await Promise.all(quitadas.map((t) => api.deshacerDecision(t.idMotor).catch(() => null)))
  invalidar()
  await esperarMotor()
  return { ok: true }
}

export async function eliminarParada(id) {
  await api.borrarParada(id)
  invalidar()
  await esperarMotor()
  return { ok: true }
}

// ---------------------------------------------------------------------------------------------
// Plan sugerido de la semana = recomendaciones del motor (por componente, según el IPM)
// ---------------------------------------------------------------------------------------------
let ultimoPlan = []

export async function getPlanSugerido(startISO) {
  const semana = startISO ? semanaISO(startISO) : semanaVista
  const res = await planSemanal(semana)
  const paradas = paradasDelPlan(res)
  ultimoPlan = (versionFusion(res).tareas_sugeridas || [])
    .filter((t) => t.Origen === 'Recomendación del motor' && seMuestraEnSugerencias(t))
    .map((t) => {
      const sug = paradaSugerida(t, paradas)
      return {
        id: t.Id_tarea,
        _prioridadMotor: t.Prioridad,
        prioridad: prioridadPantalla(t.Prioridad),
        maquina: t.Maquina,
        sistema: t.Sistema || '',
        componente: t.Componente || '',
        componenteId: t.Id_componente || '',
        tarea: t.Tarea,
        claseOrden: String(t.Clase_orden || '').split(' · ')[0],
        parada: { id: sug.id, dia: sug.dia, fecha: sug.fecha, horaInicio: sug.horaInicio, horaFin: sug.horaFin },
        enCalendario: enviada(t),
        origen: t.Origen || '',
        motivo: t.Motivo || '',
      }
    })
    .sort(ordenarPorPrioridad)
  return guardar(semana, 'plan', ultimoPlan)
}

export async function enviarPlanACalendario(id, { fecha, horaInicio, horaFin, condicion = 'frio' }) {
  const item = ultimoPlan.find((p) => p.id === id)
  if (!item) return { ok: false }
  let idParada = item.parada?.id || null
  // Sin parada sugerida (o con otro horario elegido al personalizar): se crea una parada con ese horario.
  const cambioHorario = item.parada?.id && (horaInicio !== item.parada.horaInicio || horaFin !== item.parada.horaFin)
  if (!idParada || cambioHorario) {
    const nueva = await api.crearParada({
      Titulo: item.tarea,
      Modalidad: condicion === 'caliente' ? 'Caliente' : 'Frío',
      Fecha: item.parada?.fecha || fecha,
      Inicio: horaInicio,
      Fin: horaFin,
      Maquinas: [item.maquina],
      Tareas_manuales: [],
    })
    idParada = nueva?.id_parada
  }
  await api.enviarDecision({ Id_tarea: id, Decision: 'Enviada', Id_parada: idParada, semana: semanaVista })
  invalidar()
  await esperarMotor()
  return { ok: true }
}

// ---------------------------------------------------------------------------------------------
// Tareas sugeridas = órdenes del plan preventivo SAP que vencen esta semana (una fila por orden)
// ---------------------------------------------------------------------------------------------
let ultimasTareas = []

export async function getTareasSugeridas(startISO) {
  const semana = startISO ? semanaISO(startISO) : semanaVista
  const res = await planSemanal(semana)
  const paradas = paradasDelPlan(res)
  const porOrden = new Map()
  ;(versionFusion(res).tareas_sugeridas || [])
    .filter((t) => t.Origen === 'Plan SAP' && seMuestraEnSugerencias(t))
    .forEach((t) => {
      const clave = String(t.Orden ?? t.Id_tarea)
      if (!porOrden.has(clave)) porOrden.set(clave, [])
      porOrden.get(clave).push(t)
    })
  ultimasTareas = [...porOrden.entries()].map(([orden, ops]) => {
    const t = ops[0]
    const planCodigo = t.Plan ? `Plan ${t.Plan}` : 'Plan SAP'
    const descripcion = ops.length === 1 ? t.Tarea : `${t.Tarea} y ${ops.length - 1} operación(es) más · orden ${orden}`
    return {
      id: `OT-${orden}`,
      idsMotor: ops.map((o) => o.Id_tarea),
      _prioridadMotor: t.Prioridad,
      prioridad: prioridadPantalla(t.Prioridad),
      tarea: descripcion,
      componente: t.Componente || planCodigo,
      componenteId: t.Id_componente || '',
      maquina: t.Maquina,
      sistema: t.Sistema || planCodigo,
      paradaSugerida: paradaSugerida(t, paradas),
      origen: t.Origen || '',
      // Una orden agrupa varias operaciones: se juntan sus motivos sin repetir.
      motivo: [...new Set(ops.map((o) => String(o.Motivo || '').trim()).filter(Boolean))].join('\n\n'),
    }
  }).sort(ordenarPorPrioridad)
  return guardar(semana, 'tareas', ultimasTareas)
}

export async function enviarTareaAParada(tareaId, { paradaId }) {
  const tarea = ultimasTareas.find((t) => t.id === tareaId)
  const ids = tarea?.idsMotor?.length ? tarea.idsMotor : [tareaId]
  await Promise.all(ids.map((Id_tarea) => api.enviarDecision({ Id_tarea, Decision: 'Enviada', Id_parada: paradaId, semana: semanaVista })))
  invalidar()
  await esperarMotor()
  return { ok: true }
}

export async function crearParadaYAsignar({ tareaId, parada }) {
  const creada = await api.crearParada(paradaAlBackend(parada))
  if (creada?.id_parada) await enviarTareaAParada(tareaId, { paradaId: creada.id_parada })
  return { ok: true, parada: { id: creada?.id_parada, ...parada } }
}

// ---------------------------------------------------------------------------------------------
// Asistente (todavía de ejemplo: la Fase 25 del motor no está construida)
// ---------------------------------------------------------------------------------------------
export async function getAsistenteSugerencias() { return ['¿Qué paradas hay esta semana?', '¿Qué componente falla más?', '¿Qué tareas están pendientes?'] }
export async function enviarMensajeAsistente(historial) {
  await esperar(700)
  const { respuestaAsistenteSimulada } = await import('../data/mock/mantenimiento.js')
  const ultimo = Array.isArray(historial) ? historial[historial.length - 1] : { text: '' }
  return { respuesta: respuestaAsistenteSimulada(ultimo?.text || '') }
}

// Compatibilidad con utilidades de main que usan las máquinas de una parada.
export { maquinasDeParada }
