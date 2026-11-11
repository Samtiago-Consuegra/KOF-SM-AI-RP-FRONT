/**
 * Traducción de campos del motor (español con mayúscula) a la forma que usan los componentes.
 * Aquí no se calcula nada: solo se renombran campos y se eligen icono/color por etiqueta.
 * Los estados {available:false} y 202 {status:"calculando"} se conservan como props del array
 * devuelto, así los services mantienen su forma (array) y la página puede leer el estado.
 */

// --- Utilidades ----------------------------------------------------------------------------------

function conEstado(lista, res) {
  const arr = Array.isArray(lista) ? lista : []
  arr.available = res?.available !== false
  arr.message = res?.message || ''
  arr.calculando = res?.status === 'calculando'
  return arr
}

/** Formatea una fecha AAAA-MM-DD como semana ISO "AAAA-Wnn" (parámetro de consulta). */
export function semanaISO(fechaISO) {
  if (!fechaISO) return undefined
  const d = new Date(String(fechaISO).slice(0, 10) + 'T00:00:00Z')
  if (Number.isNaN(d.getTime())) return undefined
  const dia = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dia)
  const inicioAnio = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const semana = Math.ceil(((d - inicioAnio) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(semana).padStart(2, '0')}`
}

// --- Alertas -------------------------------------------------------------------------------------

const ICONO_POR_TIPO = {
  'Ciclo': 'RefreshCcw',
  'Paros en aumento': 'TrendingUp',
  'Síntomas': 'Stethoscope',
  'Estacionalidad': 'CalendarRange',
  'Cumplimiento': 'ClipboardX',
  'Brecha del plan': 'ShieldAlert',
  'Oportunidad': 'Lightbulb',
  'Riesgo de repuesto': 'PackageX',
  'Falla mayor en racha': 'Flame',
  'Después de mantenimiento mayor': 'Wrench',
  'Acción ACR sin cierre': 'FileWarning',
}

const COLOR_POR_PRIORIDAD = {
  'Crítica': 'primary-500',
  'Alta': 'primary-700',
  'Media': 'tertiary',
  'Baja': 'ink-700',
}

function rutaAccion(enlace, maquina, componente) {
  switch (String(enlace || '').toLowerCase()) {
    case 'componente':
      return { to: '/historia-clinica', state: { maquina, componente } }
    case 'plan':
      return '#plan'
    case 'calendario':
      return '#calendario'
    default:
      return null
  }
}

function adaptarAlerta(a, i) {
  return {
    id: a.Id_alerta ?? `alerta-${i}`,
    tipo: a.Tipo || '',
    icon: ICONO_POR_TIPO[a.Tipo] || 'RefreshCcw',
    prioridad: a.Prioridad || '',
    color: COLOR_POR_PRIORIDAD[a.Prioridad] || 'ink-700',
    maquina: a.Maquina || '',
    componente: a.Componente || '',
    mensaje: a.Mensaje || '',
    disparado: [a.Evidencia, a.Confianza].filter((v) => v !== null && v !== undefined && v !== '').join(' · '),
    accion: a.Accion_sugerida || '',
    accionRuta: rutaAccion(a.Enlace, a.Maquina, a.Componente),
    mostrar: a.Mostrar === true,
  }
}

export function adaptarAlertas(res) {
  const lista = Array.isArray(res?.alertas) ? res.alertas.map(adaptarAlerta) : []
  return conEstado(lista, res)
}

// --- Archivos ------------------------------------------------------------------------------------

export const TIPOS_ARCHIVO = [
  { clave: 'avisos', label: 'Avisos de daño', icon: 'AlertTriangle', desc: 'Avisos de daño SAP' },
  { clave: 'ordenes', label: 'Órdenes de trabajo', icon: 'ClipboardList', desc: 'Órdenes de trabajo SAP' },
  { clave: 'plan', label: 'Plan preventivo', icon: 'CalendarCheck', desc: 'Plan preventivo vigente' },
  { clave: 'consolidado', label: 'Consolidado de fallas mayores', icon: 'Layers', desc: 'Fallas mayores consolidadas' },
  { clave: 'acr', label: 'ACR', icon: 'FileSearch', desc: 'Uno o varios análisis de causa raíz', multiple: true },
  { clave: 'acr_revisado', label: 'ACR revisado', icon: 'FileCheck2', desc: 'Consolidado de ACR revisado' },
]

function adaptarArchivo(tipo, f) {
  return {
    id: f?.id ?? `sin-${tipo.clave}`,
    clave: tipo.clave,
    tipo: tipo.label,
    icon: tipo.icon,
    nombre: f?.nombre_archivo || '',
    estado: f ? 'actual' : 'sin_archivo',
    actualizado: f?.subido_en || null,
    subidoPor: f?.subido_por || '',
  }
}

export function adaptarArchivos(res) {
  const vigentes = res?.vigentes || {}
  const acr = Array.isArray(res?.acr) ? res.acr : []
  const lista = TIPOS_ARCHIVO.map((t) => {
    if (t.clave === 'acr') return { ...adaptarArchivo(t, acr[0] || null), cantidad: acr.length }
    return adaptarArchivo(t, vigentes[t.clave] || null)
  })
  return conEstado(lista, res)
}

// --- Catálogo (menús Máquina → Sistema → Componente) --------------------------------------------

/** Devuelve la misma forma que usaba la jerarquía mock: { [Maquina]: [{ id, nombre, componentes: [{ id, nombre }] }] }. */
export function adaptarCatalogo(res) {
  const lista = Array.isArray(res?.maquinas) ? res.maquinas : []
  const jerarquia = {}
  lista.forEach((m) => {
    jerarquia[m.Maquina] = (m.Sistemas || []).map((s) => ({
      id: s.Sistema,
      nombre: s.Sistema,
      componentes: (s.Componentes || []).map((c) => ({ id: c.Id_componente, nombre: c.Componente })),
    }))
  })
  return {
    maquinas: lista.map((m) => m.Maquina),
    jerarquia,
    available: res?.available !== false,
    calculando: res?.status === 'calculando',
    message: res?.message || '',
  }
}

// --- Plan semanal --------------------------------------------------------------------------------

const TODA_LA_LINEA = 'Toda la línea'

function fusion(res) {
  return res?.versiones?.fusion || {}
}

function condicionDeModalidad(modalidad) {
  return String(modalidad || '').toLowerCase().startsWith('cal') ? 'caliente' : 'frio'
}

function adaptarParadaMotor(p) {
  const tareas = Array.isArray(p.Tareas) ? p.Tareas : []
  const maquinas = Array.isArray(p.Maquinas) ? p.Maquinas : []
  return {
    id: p.Id_parada,
    titulo: p.Titulo || '',
    condicion: condicionDeModalidad(p.Modalidad),
    modalidad: p.Modalidad || '',
    dia: p.Dia || '',
    fecha: p.Fecha || '',
    horaInicio: p.Inicio || '',
    horaFin: p.Fin || '',
    horas: p.Horas ?? null,
    maquinas,
    maquina: maquinas[0] || '',
    capacidadH: p.Capacidad_h ?? null,
    horasAsignadas: p.Horas_asignadas ?? null,
    porSistema: Array.isArray(p.Por_sistema) ? p.Por_sistema : [],
    tareas: tareas.map((t) => t.Tarea),
    tareasDetalle: tareas.map((t) => ({
      idTarea: t.Id_tarea ?? null,
      maquina: t.Maquina || '',
      sistema: t.Sistema || '',
      sistemaId: t.Sistema || '',
      componente: t.Componente || '',
      componenteId: t.Id_componente || '',
      tipo: t.Tipo_tarea || '',
      descripcion: t.Tarea || '',
      duracionH: t.Duracion_h ?? null,
    })),
  }
}

function adaptarTareaMotor(t, i, paradasPorId, semana) {
  const parada = t.Id_parada ? paradasPorId[t.Id_parada] : null
  return {
    id: t.Id_tarea ?? `tarea-${i}`,
    semana,
    prioridad: t.Prioridad || '',
    maquina: t.Maquina || '',
    sistema: t.Sistema || '',
    grupo: t.Grupo || '',
    componente: t.Componente || '',
    componenteId: t.Id_componente || '',
    tarea: t.Tarea || '',
    tipoTarea: t.Tipo_tarea || '',
    claseOrden: t.Clase_orden || '',
    plan: t.Plan || '',
    orden: t.Orden || '',
    idParada: t.Id_parada || null,
    duracionH: t.Duracion_h ?? null,
    origen: t.Origen || '',
    estado: t.Estado || '',
    motivo: t.Motivo || '',
    conContratista: t.Con_contratista === true,
    enCalendario: t.Estado === 'Enviada a la parada',
    decidida: t.Estado === 'Enviada a la parada' || t.Estado === 'Pospuesta por el usuario',
    parada: {
      id: t.Id_parada || null,
      titulo: parada?.titulo || '',
      dia: parada?.dia || parada?.fecha || '',
      fecha: parada?.fecha || null,
      horaInicio: parada?.horaInicio || '',
      horaFin: parada?.horaFin || '',
      condicion: parada?.condicion || '',
    },
    paradaSugerida: {
      existe: !!parada,
      id: t.Id_parada || null,
      dia: parada?.dia || parada?.fecha || '',
      fecha: parada?.fecha || null,
      horaInicio: parada?.horaInicio || '',
      horaFin: parada?.horaFin || '',
      maquina: t.Maquina || '',
    },
  }
}

function paradasIndexadas(res) {
  const map = {}
  ;(fusion(res).paradas || []).forEach((p) => { map[p.Id_parada] = adaptarParadaMotor(p) })
  return map
}

function adaptarListaTareas(lista, res) {
  const porId = paradasIndexadas(res)
  return (Array.isArray(lista) ? lista : []).map((t, i) => adaptarTareaMotor(t, i, porId, res?.semana ?? null))
}

export function adaptarParadasPlan(res) {
  const lista = (fusion(res).paradas || []).map(adaptarParadaMotor)
  const arr = conEstado(lista, res)
  arr.calendarioEsEjemplo = res?.calendario_es_ejemplo === true
  arr.semana = res?.semana ?? null
  return arr
}

export function adaptarPlanSugerido(res) {
  return conEstado(adaptarListaTareas(fusion(res).tareas_sugeridas, res), res)
}

export function adaptarSinParada(res) {
  const f = fusion(res)
  const arr = conEstado(adaptarListaTareas(f.sin_parada, res), res)
  arr.porVerificar = adaptarListaTareas(f.por_verificar, res)
  arr.fueraDeParada = adaptarListaTareas(f.fuera_de_parada, res)
  return arr
}

export function adaptarIndicadores(res) {
  const ind = fusion(res).indicadores || {}
  return {
    tareas: ind.tareas ?? null,
    enParadasExistentes: ind.en_paradas_existentes ?? null,
    usoParadasPct: ind.uso_paradas_pct ?? null,
    conContratista: ind.con_contratista ?? null,
    requierenParadaDedicada: ind.requieren_parada_dedicada ?? null,
    pasanASiguienteSemana: ind.pasan_a_siguiente_semana ?? null,
    ordenesPorVerificar: ind.ordenes_por_verificar ?? null,
    alertas: ind.alertas ?? null,
    disponible: !!res?.versiones?.fusion?.indicadores,
    available: res?.available !== false,
    calculando: res?.status === 'calculando',
    message: res?.message || '',
  }
}

/** Forma de la app → cuerpo de /paradas (ParadaIn). */
export function paradaAMotor(datos = {}, maquinasCatalogo = []) {
  const maquinas = Array.isArray(datos.maquinas) && datos.maquinas.length
    ? datos.maquinas
    : (datos.maquina ? [datos.maquina] : [])
  const todaLaLinea = maquinas.includes(TODA_LA_LINEA)
    || (maquinasCatalogo.length > 0 && maquinasCatalogo.every((m) => maquinas.includes(m)))
  const detalle = Array.isArray(datos.tareasDetalle) ? datos.tareasDetalle : []
  return {
    Titulo: datos.titulo || '',
    Modalidad: datos.condicion === 'caliente' ? 'Caliente' : 'Frío',
    Fecha: datos.fecha,
    Inicio: datos.horaInicio,
    Fin: datos.horaFin,
    Maquinas: todaLaLinea ? [TODA_LA_LINEA] : maquinas,
    Tareas_manuales: detalle.map((t) => {
      const tarea = {
        Maquina: t.maquina || '',
        Sistema: t.sistema || t.sistemaId || '',
        Id_componente: t.componenteId || '',
        Componente: t.componente || '',
        Tipo_tarea: t.tipo || 'Preventiva',
        Tarea: t.descripcion || '',
      }
      if (t.duracionH !== null && t.duracionH !== undefined && t.duracionH !== '') tarea.Duracion_h = Number(t.duracionH)
      return tarea
    }),
  }
}

export function idParadaCreada(res) {
  return res?.Id_parada ?? res?.id_parada ?? res?.id ?? null
}

export function adaptarSubida(res) {
  return {
    ok: true,
    runId: res?.run_id ?? null,
    archivo: res?.archivo ? adaptarArchivo(TIPOS_ARCHIVO.find((t) => t.clave === res.archivo.tipo) || { clave: res.archivo.tipo, label: res.archivo.tipo, icon: 'FileSpreadsheet' }, res.archivo) : null,
  }
}
