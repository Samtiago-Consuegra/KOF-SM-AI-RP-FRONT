import { explicacion, lista, num, plural } from './helpers.js'

const periodo = ({ datos }) => (datos.rangoLabel ? `en ${datos.rangoLabel}` : 'en el periodo')
// Lo publicado por las tarjetas, la gráfica o la vista SAP solo vale si es del filtro actual.
const clave = ({ rango, maquina }) => `${rango?.from}|${rango?.to}|${maquina}`
const SIN_FILTRO = 'No pude saber qué periodo tienes seleccionado.'

async function resumenDe({ datos }) {
  if (datos.resumen && datos.resumenClave === clave(datos)) return datos.resumen
  if (!datos.rango) return null
  const { getResumen } = await import('../../services/cumplimientoService.js')
  return getResumen(datos.rango, datos.maquina)
}

async function filasDe({ datos }) {
  if (Array.isArray(datos.filas) && datos.filasClave === clave(datos)) return datos.filas
  if (!datos.rango) return null
  const { getCumplimientoSemanal } = await import('../../services/cumplimientoService.js')
  return getCumplimientoSemanal({ rango: datos.rango, maquina: datos.maquina })
}

async function ordenesSapDe({ datos }) {
  if (datos.ordenesSap && datos.ordenesSapClave === clave(datos)) return datos.ordenesSap
  if (!datos.rango) return null
  const s = await import('../../services/ordenesSapCumplimiento.js')
  return s.getOrdenesSapPeriodo({ desde: datos.rango.from, hasta: datos.rango.to, maquina: datos.maquina }) // caché por periodo
}

export default {
  vista: 'cumplimiento',
  titulo: 'Cumplimiento',
  secciones: ['Paradas programadas', 'Gráfica semanal', 'Órdenes de SAP'],
  preguntas: [
    // ── Sobre esta vista ────────────────────────────────────────────────────
    {
      id: 'cum-periodo',
      grupo: 'vista',
      texto: '¿Cuál es el cumplimiento del periodo?',
      respuesta: async (ctx) => {
        const r = await resumenDe(ctx)
        if (!r) return SIN_FILTRO
        if (r.sinProgramadas || !r.programadas) return `No hay tareas programadas ${periodo(ctx)}.`
        return `El cumplimiento del plan ${periodo(ctx)} es ${num(r.cumplimiento)} %: ${num(r.ejecutadas)} de ${plural(r.programadas, 'tarea programada', 'tareas programadas')} ejecutadas. La meta es 90 %.`
      },
      relacionadas: ['cum-k-cumplimiento', 'cum-mas-bajo'],
    },
    {
      id: 'cum-mas-bajo',
      grupo: 'vista',
      texto: '¿Qué máquina tiene el cumplimiento más bajo?',
      respuesta: async (ctx) => {
        const filas = (await filasDe(ctx))?.filter((f) => f.programadas > 0)
        if (filas == null) return SIN_FILTRO
        if (!filas.length) return `No hay tareas programadas ${periodo(ctx)}.`
        // En vista mensual hay una fila por semana: se suma por máquina.
        const porMaquina = new Map()
        filas.forEach((f) => {
          const m = porMaquina.get(f.maquina) ?? { ejecutadas: 0, programadas: 0 }
          porMaquina.set(f.maquina, { ejecutadas: m.ejecutadas + f.ejecutadas, programadas: m.programadas + f.programadas })
        })
        const [maquina, m] = [...porMaquina.entries()].sort((a, b) => a[1].ejecutadas / a[1].programadas - b[1].ejecutadas / b[1].programadas)[0]
        return `${maquina} tiene el cumplimiento más bajo ${periodo(ctx)}: ${num((100 * m.ejecutadas) / m.programadas)} % (${num(m.ejecutadas)} de ${num(m.programadas)} tareas).`
      },
      relacionadas: ['cum-g-semanal', 'cum-periodo'],
    },
    {
      id: 'cum-vencidas',
      grupo: 'vista',
      texto: '¿Cuántas tareas están vencidas?',
      respuesta: async (ctx) => {
        const r = await resumenDe(ctx)
        if (!r) return SIN_FILTRO
        if (!r.vencidas) return `No hay tareas vencidas ${periodo(ctx)}.`
        return `Hay ${plural(r.vencidas, 'tarea vencida', 'tareas vencidas')} ${periodo(ctx)}: son de paradas cuyo fin programado ya pasó sin cerrarse.`
      },
      relacionadas: ['cum-k-vencidas', 'cum-pospuestas'],
    },
    {
      id: 'cum-pospuestas',
      grupo: 'vista',
      texto: '¿Cuántas tareas se pospusieron?',
      respuesta: async (ctx) => {
        const r = await resumenDe(ctx)
        if (!r) return SIN_FILTRO
        if (!r.pospuestas) return `No se pospusieron tareas ${periodo(ctx)}.`
        return `Se pospusieron ${plural(r.pospuestas, 'tarea', 'tareas')} ${periodo(ctx)}.`
      },
      relacionadas: ['cum-k-pospuestas'],
    },
    {
      id: 'cum-por-tipo',
      grupo: 'vista',
      texto: '¿Cuántas tareas hay de cada tipo?',
      respuesta: async (ctx) => {
        const filas = await filasDe(ctx)
        if (filas == null) return SIN_FILTRO
        const t = filas.porTipo ?? {}
        const total = (t.Preventiva ?? 0) + (t.Correctiva ?? 0) + (t.Predictiva ?? 0)
        if (!total) return `No hay tareas programadas ${periodo(ctx)}.`
        return `${periodo(ctx).replace(/^en/, 'En')} hay ${num(t.Preventiva ?? 0)} preventivas, ${num(t.Correctiva ?? 0)} correctivas y ${num(t.Predictiva ?? 0)} predictivas.`
      },
      relacionadas: ['cum-g-chips'],
    },
    {
      id: 'cum-sap',
      grupo: 'vista',
      texto: '¿Cuál es el cumplimiento de las órdenes de SAP?',
      respuesta: async (ctx) => {
        const res = await ordenesSapDe(ctx)
        if (!res) return SIN_FILTRO
        if (res.sinDatos || !res.ordenes?.length) return `No hay órdenes de SAP ${periodo(ctx)}.`
        const { resumenOrdenes } = await import('../../services/ordenesSapCumplimiento.js')
        const r = resumenOrdenes(res.ordenes)
        return `${periodo(ctx).replace(/^en/, 'En')} hay ${plural(r.total, 'orden de SAP', 'órdenes de SAP')}: ${num(r.ejecutadas)} ejecutadas, ${num(r.noEjecutadas)} no ejecutadas y ${num(r.abiertas)} abiertas. Cumplimiento SAP: ${num(r.cumplimiento)} %.`
      },
      accion: { etiqueta: 'Ver órdenes de SAP', ruta: '/cumplimiento?vista=sap' },
      relacionadas: ['cum-s-cumplimiento', 'cum-s-ordenes'],
    },
    {
      id: 'cum-sap-maquina',
      grupo: 'vista',
      texto: '¿Qué máquina tiene más órdenes de SAP sin ejecutar?',
      respuesta: async (ctx) => {
        const res = await ordenesSapDe(ctx)
        if (!res) return SIN_FILTRO
        const pendientes = (res.ordenes ?? []).filter((o) => o.estado !== 'Ejecutada')
        if (!pendientes.length) return `No hay órdenes de SAP pendientes ${periodo(ctx)}.`
        const porMaquina = new Map()
        pendientes.forEach((o) => porMaquina.set(o.maquina || 'Sin máquina', (porMaquina.get(o.maquina || 'Sin máquina') ?? 0) + 1))
        const orden = [...porMaquina.entries()].sort((a, b) => b[1] - a[1])
        return `${orden[0][0]} tiene más órdenes sin ejecutar (${num(orden[0][1])}). Por máquina: ${lista(orden.map(([m, n]) => `${m} ${num(n)}`))}.`
      },
      relacionadas: ['cum-s-no-ejecutadas', 'cum-s-abiertas'],
    },

    // ── ¿Qué significa…? · Paradas programadas ─────────────────────────────
    {
      id: 'cum-k-cumplimiento',
      grupo: 'explicar',
      seccion: 'Paradas programadas',
      texto: 'Cumplimiento del plan',
      respuesta: explicacion(
        'Porcentaje de las tareas programadas en paradas que se ejecutaron.',
        'Cumplimiento = 100 × ejecutadas / programadas (redondeado). Programadas = tareas de las paradas con fecha en el periodo, sin las movidas a otra parada con "Cumplir y reprogramar restantes". Si no hay programadas no se calcula.',
        'Paradas registradas en la app y su seguimiento (no SAP). Cuentan las tareas enviadas desde el plan del motor y las manuales.',
      ),
      relacionadas: ['cum-k-ejecutadas', 'cum-periodo'],
    },
    {
      id: 'cum-k-ejecutadas',
      grupo: 'explicar',
      seccion: 'Paradas programadas',
      texto: 'Ejecutadas',
      respuesta: explicacion(
        'Tareas programadas que se marcaron como cumplidas.',
        'Se cuentan las tareas programadas del periodo marcadas en "Registrar seguimiento" de su parada; la tarjeta muestra "X de Y" programadas.',
        'Seguimiento de paradas en la app.',
      ),
      relacionadas: ['cum-k-cumplimiento'],
    },
    {
      id: 'cum-k-pospuestas',
      grupo: 'explicar',
      seccion: 'Paradas programadas',
      texto: 'Pospuestas',
      respuesta: explicacion(
        'Tareas sin cumplir que se movieron a otra fecha.',
        'Vienen de "Cumplir y reprogramar restantes" (cuentan en la fecha de la parada original) o de reprogramar una parada vencida (cuentan en la fecha en que se reprogramó).',
        'Paradas registradas en la app.',
      ),
      relacionadas: ['cum-k-vencidas'],
    },
    {
      id: 'cum-k-vencidas',
      grupo: 'explicar',
      seccion: 'Paradas programadas',
      texto: 'Vencidas',
      respuesta: explicacion(
        'Tareas sin cumplir de paradas cuyo fin programado ya pasó.',
        'Tareas no cumplidas de paradas que superaron su hora de fin sin cerrarse. El estado se calcula al consultar, en hora de Bogotá.',
        'Paradas registradas en la app.',
      ),
      relacionadas: ['cum-k-pospuestas', 'cum-vencidas'],
    },

    // ── ¿Qué significa…? · Gráfica semanal ─────────────────────────────────
    {
      id: 'cum-g-semanal',
      grupo: 'explicar',
      seccion: 'Gráfica semanal',
      texto: 'Gráfica "Cumplimiento semanal"',
      respuesta: explicacion(
        'Cumplimiento del plan por máquina, con la línea de meta del 90 %.',
        'Con filtro de semana hay una barra por máquina; con filtro de mes, una por semana ISO ("Sem N") y máquina. Cada barra = 100 × ejecutadas / programadas; siempre aparecen las 4 máquinas.',
        'Paradas registradas en la app.',
      ),
      relacionadas: ['cum-mas-bajo', 'cum-g-chips'],
    },
    {
      id: 'cum-g-chips',
      grupo: 'explicar',
      seccion: 'Gráfica semanal',
      texto: 'Chips "Tareas por tipo"',
      respuesta: explicacion(
        'Cuántas tareas programadas hay de cada tipo: preventiva, correctiva y predictiva.',
        'El tipo sale de la clase de orden ("ZFI1 · Preventiva"); si no, del tipo de tarea; si no, Preventiva. Emergencia cuenta como Correctiva.',
        'Paradas de la app y clases de orden de SAP.',
      ),
      relacionadas: ['cum-por-tipo'],
    },

    // ── ¿Qué significa…? · Órdenes de SAP ──────────────────────────────────
    {
      id: 'cum-s-ordenes',
      grupo: 'explicar',
      seccion: 'Órdenes de SAP',
      texto: 'Órdenes',
      respuesta: explicacion(
        'Órdenes de SAP con fecha programada en el periodo y la máquina elegidos.',
        'Se piden en tramos de máximo 31 días y se cuentan sin repetir (por número de orden). Incluye todos los tipos de orden.',
        'Histórico de órdenes de trabajo de SAP.',
      ),
      relacionadas: ['cum-s-ejecutadas', 'cum-s-cumplimiento'],
    },
    {
      id: 'cum-s-ejecutadas',
      grupo: 'explicar',
      seccion: 'Órdenes de SAP',
      texto: 'Ejecutadas',
      respuesta: explicacion(
        'Órdenes cerradas en SAP.',
        'Órdenes cuyo "Status del sistema" contiene CERR o CTEC (y no NEJE).',
        'Órdenes de trabajo de SAP.',
      ),
      relacionadas: ['cum-s-no-ejecutadas'],
    },
    {
      id: 'cum-s-no-ejecutadas',
      grupo: 'explicar',
      seccion: 'Órdenes de SAP',
      texto: 'No ejecutadas',
      respuesta: explicacion(
        'Órdenes marcadas en SAP como no ejecutadas.',
        'Órdenes cuyo "Status del sistema" contiene NEJE.',
        'Órdenes de trabajo de SAP.',
      ),
      relacionadas: ['cum-s-abiertas'],
    },
    {
      id: 'cum-s-abiertas',
      grupo: 'explicar',
      seccion: 'Órdenes de SAP',
      texto: 'Abiertas',
      respuesta: explicacion(
        'Órdenes que siguen abiertas o liberadas en SAP.',
        'Estado ABIE o LIB. en SAP. En el resumen de la app cuenta como abierta toda orden que no es Ejecutada ni No ejecutada.',
        'Órdenes de trabajo de SAP.',
      ),
      relacionadas: ['cum-s-ejecutadas'],
    },
    {
      id: 'cum-s-cumplimiento',
      grupo: 'explicar',
      seccion: 'Órdenes de SAP',
      texto: 'Cumplimiento SAP',
      respuesta: explicacion(
        'Porcentaje de las órdenes de SAP del periodo que se ejecutaron.',
        'Cumplimiento SAP = 100 × ejecutadas / órdenes del periodo (redondeado). La gráfica lo calcula igual por máquina (y por semana con filtro de mes).',
        'Órdenes de trabajo de SAP.',
      ),
      // REVISAR: el motor (fase 15) calcula otro cumplimiento SAP: solo preventivas y predictivas vencidas, con 14 días de gracia. La app usa todas las órdenes del periodo, sin gracia.
      relacionadas: ['cum-sap', 'cum-s-ordenes'],
    },
  ],
}
