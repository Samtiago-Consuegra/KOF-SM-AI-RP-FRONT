// Servicio de Historia Clínica.
// Toda la UI accede a los datos simulados SOLO desde aquí: cuando exista backend
// (FastAPI/Supabase + kof_engine) se reemplaza la capa de mock sin tocar componentes.
import { MAQUINAS, PLANES, SUFIJO_LINEA, getEventos, getIndicadores, getParosPorMes, getComponentesResumen, JERARQUIA } from '../data/mock/historiaClinica'
import * as api from '../api/motor.js'

const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms))

// ---------------------------------------------------------------------------------------------
// Datos del motor (Fase 14: historia_clinica · Fase 23: historia_clinica_acr).
// "Python calcula, la app solo muestra": aquí solo se renombran campos del motor.
// ---------------------------------------------------------------------------------------------
const sinDatos = (res) => !res || res.available === false || res.status === 'calculando'
const num = (v) => (v == null || Number.isNaN(Number(v)) ? null : Number(v))

let componentesMotor = null
/** { datosHasta, porMaquina: { Maquina: [componente] } } o null si el motor aún no tiene datos. */
export function getComponentesMotor() {
  if (!componentesMotor) {
    componentesMotor = api.getHistoriaClinica()
      .then((res) => {
        // Sin datos todavía: no se memoriza, la próxima visita vuelve a preguntar.
        if (sinDatos(res)) { componentesMotor = null; return null }
        const porMaquina = {}
        for (const m of res.maquinas || []) {
          porMaquina[m.Maquina] = (m.sistemas || []).flatMap((s) => (s.componentes || []).map((c) => ({
            id: c.Id_componente,
            nombre: c.Componente || c.Id_componente,
            maquina: m.Maquina,
            sistema: s.Sistema || 'Sin sistema',
            eventos: num(c.Eventos) ?? 0,
            minutosParo: num(c.Minutos_paro) ?? 0,
            mttrMediana: num(c.MTTR_mediana_min),
            mtbfMedianaH: num(c.MTBF_mediana_h),
            ultimoEvento: c.Ultimo_evento || null,
            tendencia: c.Tendencia || '—',
            confianza: c.Confianza || '—',
            datosSuficientes: Boolean(c.Datos_suficientes),
          }))).sort((a, b) => b.minutosParo - a.minutosParo)
        }
        return { datosHasta: res.generado_con_datos_hasta || null, porMaquina }
      })
      .catch(() => { componentesMotor = null; return null })
  }
  return componentesMotor
}

const VENCIDA = 'Fecha cumplida sin cierre registrado'
let antecedentesMotor = null
/** Antecedentes de un componente (fallas mayores, ACR, repuesto crítico, antes/después) o null. */
export async function getAntecedentesComponente(maquina, id) {
  if (!antecedentesMotor) {
    antecedentesMotor = api.getHistoriaClinicaAcr().catch(() => { antecedentesMotor = null; return null })
  }
  const res = await antecedentesMotor
  if (sinDatos(res)) { antecedentesMotor = null; return null }
  const c = (res.maquinas || []).find((m) => m.Maquina === maquina)?.componentes?.find((x) => x.Id_componente === id)
  if (!c) return null
  const fm = c.Fallas_mayores || {}
  const out = {
    fallasMayores: {
      n: num(fm.N) ?? 0,
      minutos: num(fm.Minutos) ?? 0,
      lista: (fm.Lista || []).map((f) => ({
        fecha: f.Fecha, minutos: num(f.Minutos), causaFalla: f.Causa_falla || '', causaAltoTiempo: f.Causa_alto_tiempo || '', detalle: f.Detalle || '',
      })),
    },
    acr: (c.ACR || []).map((a) => ({
      fecha: a.Fecha, falla: a.Falla || '', duracionMin: num(a.Duracion_min), causaRaiz: a.Causa_raiz || '', nota: a.Nota || '', archivo: a.Archivo || '',
      acciones: (a.Acciones || []).map((x) => ({
        actividad: x.Actividad || '', responsable: x.Responsable || '', fechaFin: x.Fecha_fin || null,
        tipo: x.Tipo_accion || '', estado: x.Estado || '', vencida: x.Estado === VENCIDA,
      })),
    })),
    repuestoCritico: c.Repuesto_critico ? { nivel: c.Repuesto_critico.Nivel || '', motivo: c.Repuesto_critico.Motivo || '' } : null,
    prePost: (c.Pre_post_mantenimientos || []).map((p) => ({
      fecha: p.Fecha, orden: p.Orden, plan: p.Plan, tarea: p.Tarea || '', horas: num(p.Horas_orden),
      antes: num(p.Minutos_30d_antes), despues: num(p.Minutos_30d_despues), cambioPct: num(p.Cambio_pct),
    })),
  }
  const vacio = !out.fallasMayores.lista.length && !out.acr.length && !out.repuestoCritico && !out.prePost.length
  return vacio ? null : out
}

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
