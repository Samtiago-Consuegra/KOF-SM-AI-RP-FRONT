// Servicio de Historia Clínica.
// Toda la UI accede a los datos simulados SOLO desde aquí: cuando exista backend
// (FastAPI/Supabase + kof_engine) se reemplaza la capa de mock sin tocar componentes.
import { MAQUINAS, PLANES, SUFIJO_LINEA, getEventos, getIndicadores, getParosPorMes, getComponentesResumen, JERARQUIA } from '../data/mock/historiaClinica'

const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms))

export { MAQUINAS, SUFIJO_LINEA }

// Jerarquía máquina → sistemas → componentes para los filtros en cascada
export async function getJerarquia(maquina) {
  await delay(60)
  return (JERARQUIA[maquina] ?? []).map((sis) => ({
    id: sis.id,
    nombre: sis.nombre,
    componentes: sis.componentes.map((c) => ({ id: c.id, nombre: c.nombre })),
  }))
}

export function jerarquiaDe(maquina) {
  return (JERARQUIA[maquina] ?? []).map((sis) => ({ ...sis, componentes: [...sis.componentes] }))
}

export async function getFicha(maquina, filtros = {}) {
  await delay()
  const eventos = getEventos(maquina, filtros)
  const planes = PLANES[maquina]
  // Componente principal: el que más paros (fallas) causa en el periodo
  const porComponente = {}
  eventos.filter((e) => e.tipo === 'FALLA').forEach((e) => {
    porComponente[e.componenteNombre] = (porComponente[e.componenteNombre] ?? 0) + 1
  })
  const top = Object.entries(porComponente).sort((a, b) => b[1] - a[1])[0]
  // Criticidad: puesto según el número de fallas frente a las 4 máquinas críticas
  const ranking = MAQUINAS.map((m) => ({ m, fallas: getEventos(m, {...filtros}).filter((e) => e.tipo === 'FALLA').length }))
    .sort((a, b) => b.fallas - a.fallas)
  const puesto = ranking.findIndex((r) => r.m === maquina) + 1
  return {
    maquina,
    nombre: `${maquina} ${SUFIJO_LINEA}`,
    fallaPredominante: planes.fallaPredominante,
    componentePrincipal: top ? { nombre: top[0], paros: top[1] } : null,
    planesPreventivosVigentes: planes.planesPreventivosVigentes,
    ordenesSinEjecutar: planes.ordenesSinEjecutar,
    criticidad: puesto === 1 && ranking[0].fallas > 0 ? 'mas_danada' : puesto,
    rankingFallas: ranking,
  }
}

export async function getIndicadoresGeneral(maquina, filtros = {}) {
  await delay()
  const base = getIndicadores(maquina, filtros)
  // Promedio de la línea: se calcula sobre las 4 máquinas completas, sin alcance de sistema
  const conFiltrosLinea = { ...filtros, sistema: null, componente: null }
  const fallasLinea = MAQUINAS.map((m) => getIndicadores(m, conFiltrosLinea).fallas)
  const promedioFallas = Math.round(fallasLinea.reduce((a, b) => a + b, 0) / MAQUINAS.length)
  return { ...base, promedioLinea: promedioFallas }
}

// La gráfica siempre muestra los últimos 12 meses (independiente del periodo
// seleccionado en la página); Sistema y Componente sí la filtran.
export async function getParosPorMesSector(maquina, { sistema = null, componente = null } = {}) {
  await delay()
  return getParosPorMes(maquina, { sistema, componente })
}

export async function getEventosPaginados({ maquina, tipo = 'Todo', desde, hasta, pagina = 1, porPagina = 6 }) {
  await delay()
  const todos = getEventos(maquina, { tipo, desde, hasta })
  const total = todos.length
  const start = (pagina - 1) * porPagina
  const items = todos.slice(start, start + porPagina)
  return { items, total, pagina, porPagina, hasMore: start + porPagina < total }
}

export async function getComponentesOrdenados(maquina, filtros = {}) {
  await delay()
  const filas = getComponentesResumen(maquina, filtros)
  const nivelOrden = { 'Crítico': 0, 'Alto': 1, 'Medio': 2, 'Sin nivel': 3 }
  return filas.sort((a, b) => {
    if (nivelOrden[a.nivel] !== nivelOrden[b.nivel]) return nivelOrden[a.nivel] - nivelOrden[b.nivel]
    return b.fallas - a.fallas
  })
}

// Resumen para exportar el PDF: máquina COMPLETA en el periodo (sin alcance de
// sistema/componente). El alcance solo se documenta como línea informativa.
export async function getResumenExportacion({ maquina, desde, hasta, sistema, componente }) {
  await delay()
  const filtrosPeriodo = { desde, hasta }
  const eventos = getEventos(maquina, filtrosPeriodo)
  const indicadores = getIndicadores(maquina, { ...filtrosPeriodo })
  const jerarquia = jerarquiaDe(maquina)

  const fallas = eventos.filter((e) => e.tipo === 'FALLA')
  const avisosFalla = eventos.filter((e) => e.tipo === 'AVISO').length

  // Fallas que más se repiten: agrupadas por componente/modo
  const porComponente = {}
  fallas.forEach((e) => {
    const k = e.componenteNombre
    porComponente[k] = porComponente[k] ?? { componenteModo: k, veces: 0, minutos: 0 }
    porComponente[k].veces += 1
    porComponente[k].minutos += e.minutosParo || 0
  })
  const topFallas = Object.values(porComponente).sort((a, b) => b.veces - a.veces).slice(0, 5)

  // Tareas pendientes: SOLO preventivas (representación mock: próximas a programar)
  const comps = await getComponentesOrdenados(maquina, filtrosPeriodo)
  const tareasPendientes = comps.slice(0, 3).map((c, i) => ({
    tarea: `Preventivo programado · ${c.nombre}`,
    componente: c.nombre,
    ordenSap: ZFI_ORDEN(i, maquina),
    fechaProgramada: fechaFutura(desde, hasta, i + 1),
  }))

  const dias = Math.max(Math.round((new Date(hasta) - new Date(desde)) / 864e5) + 1, 1)
  const horas = dias * 24
  const mtbf = fallas.length ? Math.round(horas / fallas.length) : 0
  const minutosParo = fallas.reduce((s, e) => s + (e.minutosParo || 0), 0)
  const mttr = fallas.length ? Math.round(minutosParo / fallas.length) : 0

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
    indicadores: { paros: fallas.length, minutosParo, mttr, mtbf },
    formaFalla: PLANES[maquina].fallaPredominante,
    explicacionFalla: explicacionFalla(PLANES[maquina].fallaPredominante),
    avisosFalla,
    topFallas,
    tareasPendientes,
  }
}

const ZFI_ORDEN = (i, maquina) => `ZFI${MAQUINAS.indexOf(maquina) * 10 + 60 + i}`
const fechaFutura = (desde, hasta, dias) => {
  const d = new Date(hasta)
  d.setDate(d.getDate() + dias * 7)
  return d.toISOString().slice(0, 10)
}

const EXPLICACIONES = {
  'Por desgaste': 'Las fallas aumentan con el uso (β de Weibull > 1).',
  'Aleatoria': 'Las fallas ocurren sin patrón con el tiempo (β ≈ 1).',
  'En racha': 'Varias fallas seguidas en poco tiempo.',
}
export function explicacionFalla(forma) {
  return EXPLICACIONES[forma] ?? ''
}
