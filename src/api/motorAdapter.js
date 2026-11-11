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

// --- Historia clínica ----------------------------------------------------------------------------
// historia_clinica.json: maquinas[] → sistemas[] → componentes[] (cada componente con serie_mensual[]).
// Todo valor sale del motor; aquí solo se renombra, se ordena y se suman series ya calculadas.

export const POCOS_DATOS = 'Pocos datos'
const SIN_DATO = '—'

/** Si el motor marca Datos_suficientes=false, se muestra "Pocos datos" en lugar del número. */
export function valorMotor(valor, suficiente = true) {
  if (suficiente === false) return POCOS_DATOS
  return valor ?? null
}

/** Índice crudo + jerarquía para los menús. Conserva los estados available / calculando. */
export function adaptarHistoria(res) {
  const lista = Array.isArray(res?.maquinas) ? res.maquinas : []
  const jerarquia = {}
  const nodos = {}
  lista.forEach((m) => {
    const sistemas = Array.isArray(m.sistemas) ? m.sistemas : []
    const nodoMaquina = { nodo: m, sistemas: {}, componentes: {} }
    jerarquia[m.Maquina] = sistemas.map((s) => {
      const comps = Array.isArray(s.componentes) ? s.componentes : []
      nodoMaquina.sistemas[s.Sistema] = s
      comps.forEach((c) => { nodoMaquina.componentes[c.Id_componente] = { ...c, Sistema: s.Sistema } })
      return {
        id: s.Sistema,
        nombre: s.Sistema,
        componentes: comps.map((c) => ({ id: c.Id_componente, nombre: c.Componente })),
      }
    })
    nodos[m.Maquina] = nodoMaquina
  })
  return {
    available: res?.available !== false && res?.status !== 'calculando',
    calculando: res?.status === 'calculando',
    message: res?.message || (res?.status === 'calculando' ? 'El motor está calculando la historia clínica. Vuelve en unos minutos.' : ''),
    datosHasta: res?.generado_con_datos_hasta || null,
    maquinas: lista.map((m) => m.Maquina),
    jerarquia,
    nodos,
  }
}

function nodoMaquinaDe(historia, maquina) {
  return historia?.nodos?.[maquina] ?? null
}

/** Nodo del alcance elegido: componente > sistema > máquina. */
function nodoAlcance(historia, maquina, { sistema = null, componente = null } = {}) {
  const nm = nodoMaquinaDe(historia, maquina)
  if (!nm) return null
  if (componente && nm.componentes[componente]) return { nivel: 'componente', nodo: nm.componentes[componente] }
  if (sistema && nm.sistemas[sistema]) return { nivel: 'sistema', nodo: nm.sistemas[sistema] }
  return { nivel: 'maquina', nodo: nm.nodo }
}

/** Componentes (crudos) que caen dentro del alcance: para la serie mensual y el resumen. */
function componentesAlcance(historia, maquina, { sistema = null, componente = null } = {}) {
  const nm = nodoMaquinaDe(historia, maquina)
  if (!nm) return []
  const todos = Object.values(nm.componentes)
  if (componente) return todos.filter((c) => c.Id_componente === componente)
  if (sistema) return todos.filter((c) => c.Sistema === sistema)
  return todos
}

function costosDe(n) {
  return {
    preventiva: n?.Costo_preventiva ?? null,
    predictiva: n?.Costo_predictiva ?? null,
    correctiva: n?.Costo_correctiva ?? n?.Costo_correctivo ?? null,
  }
}

/** Componente principal crudo de la máquina (el motor ya lo nombra en Componente_principal). */
function principalCrudo(historia, maquina) {
  const nm = nodoMaquinaDe(historia, maquina)
  if (!nm) return null
  const nombre = nm.nodo?.Componente_principal
  return Object.values(nm.componentes).find((c) => c.Componente === nombre) ?? null
}

export function adaptarIndicadoresHistoria(historia, maquina, filtros = {}) {
  const alcance = nodoAlcance(historia, maquina, filtros)
  const n = alcance?.nodo ?? {}
  const esComponente = alcance?.nivel === 'componente'
  const suficiente = esComponente ? n.Datos_suficientes !== false : true
  const principal = esComponente ? n : principalCrudo(historia, maquina)
  return {
    nivel: alcance?.nivel ?? 'maquina',
    fallas: n.Eventos ?? null,
    minutosParo: n.Minutos_paro ?? null,
    mttr: valorMotor(n.MTTR_mediana_min, suficiente),
    mttrMedia: valorMotor(n.MTTR_media_min, suficiente),
    mtbf: esComponente ? valorMotor(n.MTBF_mediana_dias, suficiente) : null,
    tendencia: esComponente ? (n.Tendencia ?? null) : (principal?.Tendencia ?? null),
    formaFalla: esComponente ? (n.Forma_falla ?? null) : (principal?.Forma_falla ?? null),
    weibullBeta: esComponente ? valorMotor(n.Weibull_beta, suficiente) : null,
    sintomas: esComponente ? (n.Sintomas ?? null) : null,
    modoPrincipal: esComponente ? (n.Modo_principal ?? null) : null,
    tareaVigente: esComponente ? (n.Tarea_vigente ?? null) : null,
    confianza: esComponente ? (n.Confianza ?? null) : null,
    componentePrincipal: esComponente ? (n.Componente ?? null) : (n.Componente_principal ?? null),
    costos: costosDe(n),
    datosSuficientes: suficiente,
    disponibilidad: null,
    cumplimientoPlan: null,
    promedioLinea: null,
  }
}

export function adaptarFichaHistoria(historia, maquina, sufijo = '') {
  const nm = nodoMaquinaDe(historia, maquina)
  const m = nm?.nodo ?? {}
  const principal = principalCrudo(historia, maquina)
  // Criticidad: orden de las máquinas por Minutos_paro del motor (no se calcula nada nuevo)
  const ranking = Object.values(historia?.nodos ?? {})
    .map((x) => ({ m: x.nodo.Maquina, fallas: x.nodo.Eventos ?? 0, minutosParo: x.nodo.Minutos_paro ?? 0 }))
    .sort((a, b) => b.minutosParo - a.minutosParo)
  const puesto = ranking.findIndex((r) => r.m === maquina) + 1
  return {
    maquina,
    nombre: `${maquina}${sufijo ? ` ${sufijo}` : ''}`,
    fallaPredominante: principal?.Forma_falla ?? null,
    componentePrincipal: m.Componente_principal
      ? { nombre: m.Componente_principal, paros: principal?.Eventos ?? null }
      : null,
    planesPreventivosVigentes: principal?.Tarea_vigente ?? null,
    ordenesSinEjecutar: null,
    criticidad: puesto === 1 && (ranking[0]?.minutosParo ?? 0) > 0 ? 'mas_danada' : (puesto || null),
    rankingFallas: ranking,
    tendencia: principal?.Tendencia ?? null,
    sintomas: principal?.Sintomas ?? null,
    modoPrincipal: principal?.Modo_principal ?? null,
    confianza: principal?.Confianza ?? null,
    avisosFalla: m.Avisos_falla ?? null,
    costos: costosDe(m),
  }
}

export function adaptarComponentesHistoria(historia, maquina) {
  const nm = nodoMaquinaDe(historia, maquina)
  if (!nm) return []
  // Orden del motor: sistemas por Minutos_paro y, dentro, componentes por Minutos_paro
  return Object.values(nm.componentes)
    .filter((c) => (c.Eventos ?? 0) > 0)
    .map((c) => ({
      id: c.Id_componente,
      sistemaId: c.Sistema,
      sistemaNombre: c.Sistema,
      nombre: c.Componente,
      fallas: c.Eventos ?? 0,
      mtbf: valorMotor(c.MTBF_mediana_dias, c.Datos_suficientes !== false),
      ultimoEvento: c.Ultimo_evento ?? null,
      minutos: c.Minutos_paro ?? 0,
      nivel: null,
      confianza: c.Confianza ?? null,
      tendencia: c.Tendencia ?? null,
    }))
    .sort((a, b) => b.minutos - a.minutos)
}

function etiquetaMes(mes) {
  const [y, m] = String(mes).split('-').map(Number)
  if (!y || !m) return String(mes)
  const s = new Date(y, m - 1, 1).toLocaleDateString('es-CO', { month: 'short', year: '2-digit' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Une las serie_mensual de los componentes del alcance (suma de lo recibido) y deja los últimos 12 meses. */
export function adaptarSerieHistoria(historia, maquina, filtros = {}) {
  const porMes = {}
  componentesAlcance(historia, maquina, filtros).forEach((c) => {
    ;(c.serie_mensual || []).forEach((r) => {
      const k = String(r.Mes)
      porMes[k] = porMes[k] ?? { paros: 0, minutosParo: 0 }
      porMes[k].paros += r.Eventos ?? 0
      porMes[k].minutosParo += r.Minutos ?? 0
    })
  })
  return Object.keys(porMes).sort().slice(-12).map((key) => ({
    key,
    mes: etiquetaMes(key),
    paros: porMes[key].paros,
    minutosParo: porMes[key].minutosParo,
    mantenimientos: [],
  }))
}

/** Datos del PDF: todo sale de los nodos del motor; sin órdenes ni fechas inventadas. */
export function adaptarResumenHistoria(historia, maquina) {
  const nm = nodoMaquinaDe(historia, maquina)
  const m = nm?.nodo ?? {}
  const comps = adaptarComponentesHistoria(historia, maquina)
  const crudos = nm ? nm.componentes : {}
  const principal = principalCrudo(historia, maquina)
  return {
    indicadores: {
      paros: m.Eventos ?? 0,
      minutosParo: m.Minutos_paro ?? 0,
      mttr: m.MTTR_mediana_min ?? SIN_DATO,
      // El PDF rotula MTBF en horas: se usa MTBF_mediana_h del componente principal tal como lo entrega el motor
      mtbf: principal ? (valorMotor(principal.MTBF_mediana_h, principal.Datos_suficientes !== false) ?? SIN_DATO) : SIN_DATO,
    },
    formaFalla: principal?.Forma_falla ?? SIN_DATO,
    avisosFalla: m.Avisos_falla ?? 0,
    topFallas: comps.slice(0, 5).map((c) => ({ componenteModo: c.nombre, veces: c.fallas, minutos: c.minutos })),
    tareasPendientes: comps.slice(0, 3)
      .filter((c) => crudos[c.id]?.Tarea_vigente)
      .map((c) => ({ tarea: crudos[c.id].Tarea_vigente, componente: c.nombre, ordenSap: SIN_DATO, fechaProgramada: SIN_DATO })),
  }
}

// Eventos (tabla historia_eventos del back)
export const TIPO_EVENTO_MOTOR = {
  Todo: 'Todo',
  Fallas: 'FALLA',
  Avisos: 'AVISO',
  'Órdenes': 'CORRECTIVO',
  Preventivos: 'PREVENTIVO',
}

export function adaptarEventosHistoria(res, porPagina) {
  const lista = Array.isArray(res?.eventos) ? res.eventos : []
  const total = res?.total ?? 0
  const pagina = res?.pagina ?? 1
  const tam = res?.por_pagina ?? porPagina
  return {
    items: lista.map((e) => ({
      id: e.id,
      fecha: e.fecha,
      tipo: e.tipo,
      orden: e.orden ?? null,
      sistemaId: e.sistema ?? null,
      sistemaNombre: e.sistema ?? null,
      componenteId: e.id_componente ?? null,
      componenteNombre: e.componente ?? null,
      titulo: e.titulo || '',
      detalle: e.detalle || '',
      minutosParo: e.minutos_paro ?? null,
    })),
    total,
    pagina,
    porPagina: tam,
    hasMore: pagina * tam < total,
    available: res?.available !== false,
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
