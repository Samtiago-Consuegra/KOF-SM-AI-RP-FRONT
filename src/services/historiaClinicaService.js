// Servicio de Historia Clínica.
// Toda la UI accede a los datos SOLO desde aquí. Los valores salen del motor
// (/motor/historia-clinica y /motor/historia/eventos); la traducción de campos vive en
// src/api/motorAdapter.js. El front no calcula indicadores.
import { getHistoriaClinica, getHistoriaClinicaAcr, getEventosHistoria } from '../api/motor'
import {
  adaptarHistoria,
  adaptarFichaHistoria,
  adaptarIndicadoresHistoria,
  adaptarComponentesHistoria,
  adaptarSerieHistoria,
  adaptarResumenHistoria,
  adaptarEventosHistoria,
  TIPO_EVENTO_MOTOR,
} from '../api/motorAdapter'

// Las 4 máquinas críticas de la Línea 4 (mismo orden que MAQ4 del motor)
export const MAQUINAS = ['Llenadora', 'Empacadora', 'Paletizadora', 'Envolvedora']
export const SUFIJO_LINEA = 'L4'

// Última historia cargada: jerarquiaDe() es síncrona y la lee de aquí.
let ultimaHistoria = null
let enCurso = null

function cargarHistoria() {
  if (ultimaHistoria) return Promise.resolve(ultimaHistoria)
  if (enCurso) return enCurso
  enCurso = getHistoriaClinica()
    .then((res) => {
      const h = adaptarHistoria(res)
      // Solo se guarda en memoria cuando hay datos; "calculando" o "sin datos" se reintentan
      if (h.available) ultimaHistoria = h
      return h
    })
    .catch((err) => adaptarHistoria({ available: false, message: err?.message || 'No se pudo cargar la historia clínica.' }))
    .finally(() => { enCurso = null })
  return enCurso
}

function conEstado(valor, historia) {
  if (valor && typeof valor === 'object') {
    valor.available = historia.available
    valor.calculando = historia.calculando
    valor.message = historia.message
  }
  return valor
}

// Jerarquía máquina → sistemas → componentes para los filtros en cascada
export async function getJerarquia(maquina) {
  const h = await cargarHistoria()
  const lista = (h.jerarquia[maquina] ?? []).map((sis) => ({
    id: sis.id,
    nombre: sis.nombre,
    componentes: sis.componentes.map((c) => ({ id: c.id, nombre: c.nombre })),
  }))
  return conEstado(lista, h)
}

export function jerarquiaDe(maquina) {
  return (ultimaHistoria?.jerarquia[maquina] ?? []).map((sis) => ({ ...sis, componentes: [...sis.componentes] }))
}

export async function getFicha(maquina) {
  const h = await cargarHistoria()
  return conEstado(adaptarFichaHistoria(h, maquina, SUFIJO_LINEA), h)
}

export async function getIndicadoresGeneral(maquina, filtros = {}) {
  const h = await cargarHistoria()
  return conEstado(adaptarIndicadoresHistoria(h, maquina, filtros), h)
}

// La gráfica muestra los últimos 12 meses que trae el motor; Sistema y Componente la filtran.
export async function getParosPorMesSector(maquina, { sistema = null, componente = null } = {}) {
  const h = await cargarHistoria()
  return conEstado(adaptarSerieHistoria(h, maquina, { sistema, componente }), h)
}

export async function getEventosPaginados({ maquina, tipo = 'Todo', desde, hasta, pagina = 1, porPagina = 6 }) {
  const res = await getEventosHistoria({
    maquina,
    tipo: TIPO_EVENTO_MOTOR[tipo] ?? 'Todo',
    desde,
    hasta,
    pagina,
    por_pagina: porPagina,
  })
  return adaptarEventosHistoria(res, porPagina)
}

export async function getComponentesOrdenados(maquina) {
  const h = await cargarHistoria()
  return conEstado(adaptarComponentesHistoria(h, maquina), h)
}

// Antecedentes (historia_clinica_acr.json): fallas mayores, ACR, repuestos críticos y
// antes/después de mantenimientos. "calculando", {available:false} o error → null.
let ultimoAcr = null
let acrEnCurso = null

function cargarAcr() {
  if (ultimoAcr) return Promise.resolve(ultimoAcr)
  if (acrEnCurso) return acrEnCurso
  acrEnCurso = getHistoriaClinicaAcr()
    .then((res) => {
      const datos = Array.isArray(res?.maquinas) ? res : res?.data
      if (!Array.isArray(datos?.maquinas)) return null
      ultimoAcr = datos
      return datos
    })
    .catch(() => null)
    .finally(() => { acrEnCurso = null })
  return acrEnCurso
}

const tieneAntecedentes = (c) =>
  (c.Fallas_mayores?.N ?? 0) > 0 ||
  (c.ACR?.length ?? 0) > 0 ||
  c.Repuesto_critico != null ||
  (c.Pre_post_mantenimientos?.length ?? 0) > 0

const ordenarConteo = (obj) => Object.entries(obj ?? {}).sort((a, b) => b[1] - a[1])

// Une por Id_componente con maquinas[].componentes[]. Sin idComponente: todos los que tienen antecedentes.
export async function getAntecedentes(maquina, idComponente = null) {
  const acr = await cargarAcr()
  const maq = acr?.maquinas.find((m) => m.Maquina === maquina)
  if (!maq) return null
  const componentes = (maq.componentes ?? [])
    .filter((c) => !idComponente || String(c.Id_componente) === String(idComponente))
    .filter(tieneAntecedentes)
  return {
    causasFalla: ordenarConteo(maq.Causas_falla),
    causasAltoTiempo: ordenarConteo(maq.Causas_alto_tiempo),
    componentes,
  }
}

// Resumen para exportar el PDF: máquina COMPLETA según el motor. El alcance de
// sistema/componente solo se documenta como línea informativa.
export async function getResumenExportacion({ maquina, desde, hasta, sistema, componente }) {
  const h = await cargarHistoria()
  const jerarquia = jerarquiaDe(maquina)
  const resumen = adaptarResumenHistoria(h, maquina)
  const antecedentes = await getAntecedentes(maquina, componente)

  const alcanceSistemas = sistema
    ? jerarquia.find((s) => s.id === sistema)?.nombre ?? null
    : null
  const alcanceComponentes = componente
    ? (jerarquia.flatMap((s) => s.componentes).find((c) => c.id === componente)?.nombre ?? null)
    : null

  return {
    maquina,
    nombreMaquina: `${maquina} ${SUFIJO_LINEA}`,
    alcance: (alcanceSistemas || alcanceComponentes)
      ? [alcanceSistemas, alcanceComponentes].filter(Boolean)
      : null,
    fechaExportacion: new Date(),
    periodo: { desde, hasta },
    datosHasta: h.datosHasta,
    indicadores: resumen.indicadores,
    formaFalla: resumen.formaFalla,
    explicacionFalla: explicacionFalla(resumen.formaFalla),
    avisosFalla: resumen.avisosFalla,
    topFallas: resumen.topFallas,
    tareasPendientes: resumen.tareasPendientes,
    antecedentes,
  }
}

// Etiquetas de Forma_falla del motor (fase 14): "Desgaste (…)", "Aleatoria (…)", "En racha (…)"
const EXPLICACIONES = {
  'Desgaste': 'Las fallas aumentan con el uso (β de Weibull > 1,2).',
  'Por desgaste': 'Las fallas aumentan con el uso (β de Weibull > 1,2).',
  'Aleatoria': 'Las fallas ocurren sin patrón con el tiempo (β entre 0,8 y 1,2).',
  'En racha': 'Después de una falla es probable otra pronto (β < 0,8).',
}
export function explicacionFalla(forma) {
  if (!forma) return ''
  const clave = Object.keys(EXPLICACIONES).find((k) => String(forma).startsWith(k))
  return clave ? EXPLICACIONES[clave] : ''
}
