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

export function adaptarSubida(res) {
  return {
    ok: true,
    runId: res?.run_id ?? null,
    archivo: res?.archivo ? adaptarArchivo(TIPOS_ARCHIVO.find((t) => t.clave === res.archivo.tipo) || { clave: res.archivo.tipo, label: res.archivo.tipo, icon: 'FileSpreadsheet' }, res.archivo) : null,
  }
}
