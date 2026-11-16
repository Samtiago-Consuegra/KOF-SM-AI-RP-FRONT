// Servicio de Historia Clínica.
// Toda la UI accede a los datos SOLO desde aquí. Los números salen del backend
// (/motor/historia/... y /motor/historia-clinica[-acr]); este archivo solo renombra campos
// al formato que ya usan los componentes. El front no calcula indicadores.
import * as api from '../api/motor.js'

// Las 4 máquinas críticas, en el mismo orden que el motor (MAQ4)
export const MAQUINAS = ['Llenadora', 'Empacadora', 'Paletizadora', 'Envolvedora']
export const SUFIJO_LINEA = 'L4'

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

/** Olvida lo memorizado del motor: se llama cuando termina una corrida. */
export function invalidarHistoria() {
  componentesMotor = null
  antecedentesMotor = null
}

// ---------------------------------------------------------------------------------------------
// Secciones calculadas por periodo (app/historia_service.py)
// ---------------------------------------------------------------------------------------------
const params = (maquina, { desde = null, hasta = null, sistema = null, componente = null } = {}) =>
  ({ maquina, desde, hasta, sistema, componente })

/** Límites del filtro de periodo { months, min, max, datosHasta } o null si el motor no tiene datos. */
export async function getPeriodos() {
  const res = await api.getHistoriaPeriodos()
  if (sinDatos(res)) return null
  return { months: res.months || [], min: res.min, max: res.max, datosHasta: res.datos_hasta || null }
}

// Jerarquía máquina → sistemas → componentes para los filtros en cascada
export async function getJerarquia(maquina) {
  const res = await api.getHistoriaJerarquia(maquina)
  if (sinDatos(res)) return []
  return (res.sistemas || []).map((s) => ({
    id: s.id,
    nombre: s.nombre,
    componentes: (s.componentes || []).map((c) => ({ id: c.id, nombre: c.nombre })),
  }))
}

export async function getFicha(maquina, filtros = {}) {
  const res = await api.getHistoriaFicha(params(maquina, filtros))
  if (sinDatos(res)) return null
  return {
    maquina,
    nombre: `${maquina} ${SUFIJO_LINEA}`,
    fallaPredominante: res.falla_predominante,
    componentePrincipal: res.componente_principal,
    planesPreventivosVigentes: res.planes_preventivos_vigentes,
    ordenesSinEjecutar: res.ordenes_sin_ejecutar,
    criticidad: res.es_la_mas_danada ? 'mas_danada' : res.puesto_fallas,
    rankingFallas: (res.ranking_fallas || []).map((r) => ({ m: r.maquina, fallas: r.fallas })),
  }
}

const indicadoresDe = (r = {}) => ({
  fallas: num(r.fallas),
  minutosParo: num(r.minutos_paro),
  mtbf: num(r.mtbf_h),
  mttr: num(r.mttr_min),
  disponibilidad: num(r.disponibilidad_pct),
  cumplimientoPlan: num(r.cumplimiento_plan_pct),
})

export async function getIndicadoresGeneral(maquina, filtros = {}) {
  const res = await api.getHistoriaIndicadores(params(maquina, filtros))
  if (sinDatos(res)) return null
  // promedioLinea: mismo indicador, promedio de las 4 máquinas en el periodo
  return { ...indicadoresDe(res), promedioLinea: indicadoresDe(res.promedio_linea), diasOperados: res.dias_operados }
}

// "Nov 25": etiqueta corta del mes para el eje de la gráfica
const etiquetaMes = (key) => {
  const [y, m] = key.split('-').map(Number)
  const s = new Date(y, m - 1, 1).toLocaleDateString('es-CO', { month: 'short', year: '2-digit' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}
const ddmm = (iso) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : '')

// La gráfica siempre muestra los últimos 12 meses con datos (independiente del periodo
// seleccionado en la página); Sistema y Componente sí la filtran.
export async function getParosPorMesSector(maquina, { sistema = null, componente = null } = {}) {
  const res = await api.getHistoriaParosPorMes({ maquina, sistema, componente })
  if (sinDatos(res)) return null
  return (res.meses || []).map((m) => ({
    key: m.mes,
    mes: etiquetaMes(m.mes),
    paros: num(m.paros) ?? 0,
    minutosParo: num(m.minutos_paro) ?? 0,
    mantenimientosTotal: num(m.mantenimientos_total) ?? 0,
    mantenimientos: (m.mantenimientos || []).map((x) => ({ orden: x.orden, tarea: x.tarea, fecha: ddmm(x.fecha) })),
  }))
}

// Botones de la línea de tiempo → tipo de evento del backend
const TIPO_EVENTO = { Todo: 'Todo', Fallas: 'FALLA', Avisos: 'AVISO', Órdenes: 'CORRECTIVO', Preventivos: 'PREVENTIVO' }

export async function getEventosPaginados({ maquina, tipo = 'Todo', desde, hasta, pagina = 1, porPagina = 6 }) {
  const res = await api.getEventosHistoria({
    maquina, tipo: TIPO_EVENTO[tipo] ?? 'Todo', desde, hasta, pagina, por_pagina: porPagina,
  })
  const total = num(res?.total) ?? 0
  const items = (res?.eventos || []).map((e) => ({
    id: e.id,
    fecha: e.fecha,
    tipo: e.tipo,
    orden: e.orden,
    sistemaNombre: e.sistema,
    componenteId: e.id_componente,
    componenteNombre: e.componente,
    titulo: e.titulo,
    detalle: e.detalle,
    minutosParo: num(e.minutos_paro),
  }))
  return { items, total, pagina, porPagina, hasMore: pagina * porPagina < total }
}

// Resumen para exportar el PDF: máquina COMPLETA en el periodo (sin alcance de
// sistema/componente). El alcance solo se documenta como línea informativa.
export async function getResumenExportacion({ maquina, desde, hasta, sistema, componente }) {
  const [res, jerarquia] = await Promise.all([
    api.getHistoriaResumen({ maquina, desde, hasta }),
    getJerarquia(maquina),
  ])
  if (sinDatos(res)) throw new Error(res?.message || 'Aún no hay resultados del motor')
  const sis = sistema ? jerarquia.find((s) => s.id === sistema) : null
  const comp = componente ? jerarquia.flatMap((s) => s.componentes).find((c) => c.id === componente) : null
  const alcance = [sis?.nombre, comp?.nombre].filter(Boolean)
  const ind = res.indicadores || {}
  const mostrar = (v) => (v == null ? '—' : Math.round(v))
  return {
    maquina,
    nombreMaquina: `${maquina} ${SUFIJO_LINEA}`,
    alcance: alcance.length ? alcance : null,
    fechaExportacion: new Date(),
    periodo: { desde, hasta },
    indicadores: { paros: ind.paros ?? 0, minutosParo: mostrar(ind.minutos_paro), mttr: mostrar(ind.mttr_min), mtbf: mostrar(ind.mtbf_h) },
    formaFalla: res.forma_falla,
    explicacionFalla: explicacionFalla(res.forma_falla),
    avisosFalla: res.avisos_falla ?? 0,
    topFallas: (res.top_fallas || []).map((f) => ({ componenteModo: f.componente, veces: f.veces, minutos: f.minutos })),
    tareasPendientes: (res.tareas_pendientes || []).map((t) => ({
      tarea: t.tarea, componente: t.componente, ordenSap: t.orden, fechaProgramada: t.fecha_programada,
    })),
  }
}

const EXPLICACIONES = {
  'Por desgaste': 'Las fallas aumentan con el uso (β de Weibull > 1).',
  'Aleatoria': 'Las fallas ocurren sin patrón con el tiempo (β ≈ 1).',
  'En racha': 'Varias fallas seguidas en poco tiempo.',
  'Pocos datos': 'Ningún componente tiene eventos suficientes para estimar la forma de falla.',
}
export function explicacionFalla(forma) {
  return EXPLICACIONES[forma] ?? ''
}
