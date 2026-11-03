import { FICHAS, INDICADORES, COMPONENTES, getEventos as getEventosMock, getParosPorMes as getParosPorMesMock } from '../data/mock/historiaClinica'

const delay = (ms = 150) => new Promise((r) => setTimeout(r, ms))

export async function getFicha(maquina) {
  await delay()
  return FICHAS[maquina]
}

export async function getIndicadores(maquina) {
  await delay()
  return INDICADORES[maquina]
}

export async function getParosPorMes(maquina) {
  await delay()
  return getParosPorMesMock(maquina)
}

export async function getEventos({ maquina, tipo = 'Todo', pagina = 1, porPagina = 6 }) {
  await delay()
  let eventos = getEventosMock(maquina)
  if (tipo && tipo !== 'Todo') {
    const map = { Fallas: 'FALLA', Avisos: 'AVISO', Órdenes: 'CORRECTIVO', Preventivos: 'PREVENTIVO' }
    eventos = eventos.filter((e) => e.tipo === map[tipo])
  }
  const total = eventos.length
  const start = (pagina - 1) * porPagina
  const items = eventos.slice(start, start + porPagina)
  return { items, total, pagina, porPagina, hasMore: start + porPagina < total }
}

export async function getComponentes(maquina) {
  await delay()
  const comps = [...(COMPONENTES[maquina] || [])]
  const nivelOrden = { Crítico: 0, Alto: 1, Medio: 2, 'Sin nivel': 3 }
  comps.sort((a, b) => {
    if (nivelOrden[a.nivel] !== nivelOrden[b.nivel]) return nivelOrden[a.nivel] - nivelOrden[b.nivel]
    return b.fallas - a.fallas
  })
  return comps
}

export async function getResumenExportacion({ maquina, desde, hasta }) {
  await delay()
  const eventos = getEventosMock(maquina)
  const indicadores = INDICADORES[maquina]
  const ficha = FICHAS[maquina]
  
  const fallas = eventos.filter((e) => e.tipo === 'FALLA')
  const avisosFalla = eventos.filter((e) => e.tipo === 'AVISO').length
  const preventivasPendientes = eventos
    .filter((e) => e.tipo === 'PREVENTIVO' && e.orden)
    .slice(0, 10)
    .map((e) => ({
      tarea: e.titulo,
      componente: ficha.componentePrincipal.nombre,
      ordenSap: e.orden,
      fechaProgramada: e.fecha
    }))
  
  const topFallas = [
    { componenteModo: ficha.componentePrincipal.nombre, veces: fallas.length, minutos: indicadores.minutosParo }
  ]
  
  return {
    maquina,
    fechaExportacion: new Date(),
    periodo: { desde, hasta },
    indicadores,
    formaFalla: ficha.fallaPredominante,
    avisosFalla,
    topFallas,
    tareasPendientes: preventivasPendientes
  }
}
