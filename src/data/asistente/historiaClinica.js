import { explicacion, lista, num, plural } from './helpers.js'

const servicio = () => import('../../services/historiaClinicaService.js')
const maquinaDe = ({ datos }) => datos.maquina || 'Llenadora'

async function componentesDe(ctx) {
  const { getComponentesMotor } = await servicio()
  const res = await getComponentesMotor() // memorizado en el servicio
  return res?.porMaquina?.[maquinaDe(ctx)] ?? null
}

async function indicadoresDe(ctx) {
  if (ctx.datos.indicadores) return ctx.datos.indicadores
  const { getIndicadoresGeneral } = await servicio()
  return getIndicadoresGeneral(maquinaDe(ctx), ctx.datos.filtros ?? {})
}

async function fichaDe(ctx) {
  if (ctx.datos.ficha) return ctx.datos.ficha
  const { getFicha } = await servicio()
  return getFicha(maquinaDe(ctx), ctx.datos.filtros ?? {})
}

const SIN_MOTOR = 'El motor aún no tiene la historia clínica de esta máquina.'
const SIN_FALLAS = (ctx) => `No hay fallas registradas de ${maquinaDe(ctx)} en el periodo seleccionado.`

export default {
  vista: 'historiaClinica',
  titulo: 'Historia clínica',
  secciones: ['Ficha del equipo', 'Indicadores', 'Línea de tiempo', 'Componentes de la máquina', 'Antecedentes'],
  preguntas: [
    // ── Sobre esta vista ────────────────────────────────────────────────────
    {
      id: 'hc-componente',
      grupo: 'vista',
      texto: '¿Qué componente falla más en esta máquina?',
      respuesta: async (ctx) => {
        const comps = await componentesDe(ctx)
        if (!comps) return SIN_MOTOR
        const con = comps.filter((c) => c.eventos > 0)
        if (!con.length) return `${maquinaDe(ctx)} no tiene fallas registradas por componente.`
        const top = con.reduce((a, b) => (b.eventos > a.eventos ? b : a))
        return `En ${maquinaDe(ctx)}, el componente que más falla es ${top.nombre} (${top.sistema}): ${plural(top.eventos, 'evento')} y ${num(top.minutosParo)} minutos de paro en toda la historia. Tendencia: ${top.tendencia}.`
      },
      relacionadas: ['hc-c-eventos', 'hc-c-tendencia', 'hc-antecedentes'],
    },
    {
      id: 'hc-mttr-mtbf',
      grupo: 'vista',
      texto: '¿Cuál es el MTTR y el MTBF de la máquina?',
      respuesta: async (ctx) => {
        const ind = await indicadoresDe(ctx)
        if (!ind) return SIN_MOTOR
        if (!ind.fallas) return SIN_FALLAS(ctx)
        const linea = ind.promedioLinea ?? {}
        return `${maquinaDe(ctx)} en el periodo: MTTR ${num(ind.mttr, 1)} min y MTBF ${num(ind.mtbf, 1)} h, con ${plural(ind.fallas, 'falla')}. Promedio de la línea: MTTR ${num(linea.mttr, 1)} min y MTBF ${num(linea.mtbf, 1)} h.`
      },
      relacionadas: ['hc-i-mttr', 'hc-i-mtbf'],
    },
    {
      id: 'hc-antecedentes',
      grupo: 'vista',
      texto: '¿Tiene ACR o fallas mayores?',
      respuesta: async (ctx) => {
        const comps = await componentesDe(ctx)
        if (!comps) return SIN_MOTOR
        const { getAntecedentesComponente } = await servicio()
        // Los antecedentes vienen de un solo archivo memorizado: estas búsquedas no repiten peticiones.
        const ants = await Promise.all(comps.map(async (c) => ({ c, a: await getAntecedentesComponente(maquinaDe(ctx), c.id) })))
        const conFallas = ants.filter(({ a }) => a?.fallasMayores?.n > 0)
        const conAcr = ants.filter(({ a }) => a?.acr?.length > 0)
        if (!conFallas.length && !conAcr.length) return `${maquinaDe(ctx)} no tiene fallas mayores ni ACR registrados.`
        const fallas = conFallas.reduce((s, { a }) => s + a.fallasMayores.n, 0)
        const acr = conAcr.reduce((s, { a }) => s + a.acr.length, 0)
        return `${maquinaDe(ctx)} tiene ${plural(fallas, 'falla mayor', 'fallas mayores')} y ${plural(acr, 'ACR')}. Componentes con antecedentes: ${lista([...new Set([...conFallas, ...conAcr].map(({ c }) => c.nombre))].slice(0, 6))}. Ábrelos en "Componentes de la máquina" para ver el detalle.`
      },
      relacionadas: ['hc-a-fallas-mayores', 'hc-a-acr'],
    },
    {
      id: 'hc-disponibilidad',
      grupo: 'vista',
      texto: '¿Cuál es la disponibilidad de la máquina?',
      respuesta: async (ctx) => {
        const ind = await indicadoresDe(ctx)
        if (!ind) return SIN_MOTOR
        if (ind.disponibilidad == null) return SIN_FALLAS(ctx)
        return `La disponibilidad de ${maquinaDe(ctx)} en el periodo es ${num(ind.disponibilidad, 1)} % (promedio de la línea: ${num(ind.promedioLinea?.disponibilidad, 1)} %), con ${num(ind.minutosParo)} minutos de paro.`
      },
      relacionadas: ['hc-i-disponibilidad', 'hc-i-minutos'],
    },
    {
      id: 'hc-empeoran',
      grupo: 'vista',
      texto: '¿Qué componentes están empeorando?',
      respuesta: async (ctx) => {
        const comps = await componentesDe(ctx)
        if (!comps) return SIN_MOTOR
        const peor = comps.filter((c) => c.tendencia === 'Empeora')
        if (!peor.length) return `Ningún componente de ${maquinaDe(ctx)} tiene tendencia "Empeora".`
        return `${plural(peor.length, 'componente empeora', 'componentes empeoran')} en ${maquinaDe(ctx)}: ${lista(peor.slice(0, 6).map((c) => c.nombre))}.`
      },
      relacionadas: ['hc-c-tendencia'],
    },
    {
      id: 'hc-ficha',
      grupo: 'vista',
      texto: '¿Cuál es la falla predominante y la criticidad?',
      respuesta: async (ctx) => {
        const f = await fichaDe(ctx)
        if (!f) return SIN_MOTOR
        const puesto = f.criticidad === 'mas_danada' ? 'es la máquina con más fallas de la línea' : `ocupa el puesto ${f.criticidad} de 4 en fallas`
        const principal = f.componentePrincipal ? ` El componente con más paros es ${f.componentePrincipal.nombre} (${plural(f.componentePrincipal.paros, 'paro')}).` : ''
        return `La falla predominante de ${maquinaDe(ctx)} es "${f.fallaPredominante}" y ${puesto}.${principal}`
      },
      relacionadas: ['hc-f-predominante', 'hc-f-criticidad'],
    },
    {
      id: 'hc-sin-ejecutar',
      grupo: 'vista',
      texto: '¿Cuántas órdenes sin ejecutar y planes vigentes tiene?',
      respuesta: async (ctx) => {
        const f = await fichaDe(ctx)
        if (!f) return SIN_MOTOR
        return `${maquinaDe(ctx)} tiene ${plural(f.ordenesSinEjecutar ?? 0, 'orden sin ejecutar', 'órdenes sin ejecutar')} en el periodo y ${plural(f.planesPreventivosVigentes ?? 0, 'plan preventivo vigente', 'planes preventivos vigentes')}.`
      },
      relacionadas: ['hc-f-ordenes'],
    },

    // ── ¿Qué significa…? · Ficha del equipo ────────────────────────────────
    {
      id: 'hc-f-predominante',
      grupo: 'explicar',
      seccion: 'Ficha del equipo',
      texto: 'Falla predominante',
      respuesta: explicacion(
        'La forma de falla (Desgaste, Aleatoria o En racha) que más minutos de paro explica en la máquina.',
        'Entre los componentes con datos suficientes para Weibull, se suman los minutos de paro por forma de falla y gana la de más minutos. Si ninguno tiene datos suficientes: "Pocos datos".',
        'Motor de planes (historia clínica), con el reporte diario de paros.',
      ),
      relacionadas: ['hc-c-forma', 'hc-ficha'],
    },
    {
      id: 'hc-f-componente',
      grupo: 'explicar',
      seccion: 'Ficha del equipo',
      texto: 'Componente principal',
      respuesta: explicacion(
        'El componente con más eventos de falla de la máquina en el periodo.',
        'Se cuentan los eventos de falla por componente y se toma el mayor.',
        'Reporte diario de paros.',
      ),
      relacionadas: ['hc-componente'],
    },
    {
      id: 'hc-f-planes',
      grupo: 'explicar',
      seccion: 'Ficha del equipo',
      texto: 'Planes preventivos vigentes',
      respuesta: explicacion(
        'Cuántos planes preventivos de SAP tiene la máquina.',
        'Número de planes de la máquina en la salida de cumplimiento del motor.',
        'Plan preventivo de SAP (motor de planes).',
      ),
      relacionadas: ['hc-f-ordenes'],
    },
    {
      id: 'hc-f-ordenes',
      grupo: 'explicar',
      seccion: 'Ficha del equipo',
      texto: 'Órdenes sin ejecutar',
      respuesta: explicacion(
        'Órdenes de SAP de la máquina marcadas como no ejecutadas en el periodo.',
        'Se cuentan las órdenes pendientes del motor con estado "No ejecutada" y fecha programada dentro del periodo.',
        'Órdenes de trabajo de SAP (motor de planes).',
      ),
      relacionadas: ['hc-sin-ejecutar'],
    },
    {
      id: 'hc-f-criticidad',
      grupo: 'explicar',
      seccion: 'Ficha del equipo',
      texto: 'Criticidad',
      respuesta: explicacion(
        'El puesto de la máquina entre las 4 críticas según su número de fallas.',
        'Se ordenan las 4 máquinas por fallas del periodo; si es la primera y tiene fallas se marca como la más dañada, si no, "Puesto N de 4 en fallas".',
        'Reporte diario de paros.',
      ),
      relacionadas: ['hc-ficha'],
    },

    // ── ¿Qué significa…? · Indicadores ─────────────────────────────────────
    {
      id: 'hc-i-fallas',
      grupo: 'explicar',
      seccion: 'Indicadores',
      texto: 'Fallas (eventos)',
      respuesta: explicacion(
        'Número de eventos de falla de la máquina en el periodo.',
        'Los registros del mismo componente con menos de 1 hora entre sí se fusionan en un solo evento.',
        'Reporte diario de paros.',
      ),
      relacionadas: ['hc-i-minutos', 'hc-i-mtbf'],
    },
    {
      id: 'hc-i-minutos',
      grupo: 'explicar',
      seccion: 'Indicadores',
      texto: 'Minutos de paro',
      respuesta: explicacion(
        'Tiempo total detenido por fallas en el periodo.',
        'Suma de los minutos de los eventos de falla.',
        'Reporte diario de paros.',
      ),
      relacionadas: ['hc-i-fallas'],
    },
    {
      id: 'hc-i-mtbf',
      grupo: 'explicar',
      seccion: 'Indicadores',
      texto: 'MTBF',
      respuesta: explicacion(
        'Tiempo medio entre fallas: cuántas horas opera la máquina, en promedio, entre una falla y otra.',
        'MTBF (h) = días operados × 24 / fallas. Días operados = fechas con al menos un evento de falla en cualquiera de las 4 máquinas. En los componentes se muestra el MTBF mediano, que no se calcula con menos de 5 eventos.',
        'Reporte diario de paros.',
      ),
      relacionadas: ['hc-i-mttr', 'hc-mttr-mtbf'],
    },
    {
      id: 'hc-i-mttr',
      grupo: 'explicar',
      seccion: 'Indicadores',
      texto: 'MTTR (media y mediana)',
      respuesta: explicacion(
        'Tiempo medio de reparación: cuánto dura un paro por falla.',
        'En los indicadores de la máquina es la media: MTTR (min) = minutos de paro / fallas del periodo. En los componentes se muestra la mediana de toda la historia, que no se deja llevar por paros atípicos (más largos que Q3 + 1,5 × IQR).',
        'Reporte diario de paros.',
      ),
      relacionadas: ['hc-i-mtbf', 'hc-mttr-mtbf'],
    },
    {
      id: 'hc-i-disponibilidad',
      grupo: 'explicar',
      seccion: 'Indicadores',
      texto: 'Disponibilidad',
      respuesta: explicacion(
        'Porcentaje del tiempo operado en que la máquina no estuvo detenida por fallas.',
        'Disponibilidad = 1 − minutos de paro / (días operados × 1440), en %.',
        'Reporte diario de paros.',
      ),
      relacionadas: ['hc-disponibilidad'],
    },
    {
      id: 'hc-i-cumplimiento',
      grupo: 'explicar',
      seccion: 'Indicadores',
      texto: 'Cumplimiento plan',
      respuesta: explicacion(
        'Cumplimiento de las órdenes preventivas de SAP de la máquina.',
        'Con la serie semanal de cumplimiento SAP del motor, sumando las semanas del periodo: 100 × ejecutadas / órdenes preventivas y predictivas vencidas (con 14 días de gracia). Solo existe a nivel de máquina.',
        'Órdenes de trabajo de SAP (motor de planes).',
      ),
      relacionadas: ['hc-f-ordenes'],
    },
    {
      id: 'hc-i-paros-mes',
      grupo: 'explicar',
      seccion: 'Indicadores',
      texto: 'Paros por mes',
      respuesta: explicacion(
        'Paros de la máquina en los últimos 12 meses, con los mantenimientos preventivos ejecutados.',
        'Últimos 12 meses contados desde la última falla registrada (no desde hoy), recortados al periodo elegido; cada mes lista hasta 5 preventivos ejecutados.',
        'Reporte diario de paros y órdenes de SAP.',
      ),
      relacionadas: ['hc-i-fallas'],
    },

    // ── ¿Qué significa…? · Línea de tiempo ─────────────────────────────────
    {
      id: 'hc-t-tipos',
      grupo: 'explicar',
      seccion: 'Línea de tiempo',
      texto: 'Tipos de evento: Falla, Preventivo, Correctivo y Aviso',
      respuesta: explicacion(
        'Cada evento de la historia de la máquina, en orden de fecha.',
        'FALLA: eventos del reporte diario (registros a menos de 1 h se fusionan). PREVENTIVO: órdenes de SAP preventivas o predictivas. CORRECTIVO: órdenes correctivas o de emergencia (sin mejoras ni proyectos). AVISO: avisos de SAP del alcance.',
        'Reporte diario de paros, órdenes y avisos de SAP.',
      ),
      relacionadas: ['hc-i-fallas'],
    },

    // ── ¿Qué significa…? · Componentes de la máquina ───────────────────────
    {
      id: 'hc-c-eventos',
      grupo: 'explicar',
      seccion: 'Componentes de la máquina',
      texto: 'Eventos y minutos del componente',
      respuesta: explicacion(
        'Fallas y minutos de paro de cada componente en toda la historia (no en el periodo elegido).',
        'Eventos de falla fusionados por componente y suma de sus minutos; la lista se ordena por minutos de paro.',
        'Motor de planes (historia clínica), con el reporte diario.',
      ),
      relacionadas: ['hc-c-tendencia', 'hc-c-confianza'],
    },
    {
      id: 'hc-c-tendencia',
      grupo: 'explicar',
      seccion: 'Componentes de la máquina',
      texto: 'Tendencia',
      respuesta: explicacion(
        'Si el componente está empeorando, mejorando o estable.',
        'Compara los minutos de paro de los últimos 6 meses con los 6 anteriores: razón > 1,2 "Empeora", < 0,8 "Mejora", si no "Estable". Si antes había 0 minutos es "Empeora"; con menos de 5 eventos en esos 12 meses, "Pocos datos".',
        'Reporte diario de paros.',
      ),
      relacionadas: ['hc-empeoran', 'hc-c-pocos'],
    },
    {
      id: 'hc-c-forma',
      grupo: 'explicar',
      seccion: 'Componentes de la máquina',
      texto: 'Forma de falla (Weibull)',
      respuesta: explicacion(
        'Cómo falla el componente según la distribución de Weibull del tiempo entre fallas.',
        'Con al menos 10 intervalos (fallas del mismo turno cuentan como una): β > 1,2 "Desgaste" (preventivo por tiempo); 0,8 ≤ β ≤ 1,2 "Aleatoria" (inspección o monitoreo); β < 0,8 "En racha" (revisar la calidad de la reparación). Con menos datos: "Pocos datos".',
        'Reporte diario de paros (motor de planes).',
      ),
      relacionadas: ['hc-f-predominante', 'hc-c-pocos'],
    },
    {
      id: 'hc-c-confianza',
      grupo: 'explicar',
      seccion: 'Componentes de la máquina',
      texto: 'Confianza',
      respuesta: explicacion(
        'Qué tanto respaldan los datos los indicadores del componente.',
        'Alta con 10 o más eventos, Media con 5 a 9 y Baja con menos de 5.',
        'Motor de planes (historia clínica).',
      ),
      relacionadas: ['hc-c-pocos'],
    },
    {
      id: 'hc-c-pocos',
      grupo: 'explicar',
      seccion: 'Componentes de la máquina',
      texto: '"Pocos datos"',
      respuesta: explicacion(
        'El indicador no se calcula porque no hay eventos suficientes.',
        'Weibull necesita al menos 10 intervalos; el MTBF y la tendencia, al menos 5 eventos. En la tarjeta del componente aparece si no tiene datos suficientes o no hay MTBF.',
        'Motor de planes (historia clínica).',
      ),
      relacionadas: ['hc-c-confianza', 'hc-c-forma'],
    },

    // ── ¿Qué significa…? · Antecedentes ────────────────────────────────────
    {
      id: 'hc-a-fallas-mayores',
      grupo: 'explicar',
      seccion: 'Antecedentes',
      texto: 'Fallas mayores',
      respuesta: explicacion(
        'Fallas largas del componente, con su causa y el motivo del alto tiempo.',
        'Fallas de más de 60 minutos registradas en el consolidado de fallas mayores.',
        'Consolidado de fallas mayores (Excel cargado al motor).',
      ),
      relacionadas: ['hc-a-acr', 'hc-antecedentes'],
    },
    {
      id: 'hc-a-acr',
      grupo: 'explicar',
      seccion: 'Antecedentes',
      texto: 'ACR (análisis de causa raíz)',
      respuesta: explicacion(
        'Análisis de causa raíz de fallas de más de 180 minutos, con sus acciones.',
        'Cada acción queda "Cerrada" si su estado indica que se finalizó o fue inmediata (terminó a más tardar 2 días después del evento); "En plazo" si su fecha de fin aún no llega; si no, "Fecha cumplida sin cierre registrado".',
        'Archivos de ACR cargados al motor.',
      ),
      relacionadas: ['hc-a-fallas-mayores'],
    },
    {
      id: 'hc-a-repuesto',
      grupo: 'explicar',
      seccion: 'Antecedentes',
      texto: 'Repuesto crítico',
      respuesta: explicacion(
        'El componente tiene antecedentes de problemas con su repuesto.',
        'Hay evidencia si el consolidado cita falta, demora o calidad del repuesto, o un ACR habla de repuesto no original, agotado, importado o de mala calidad. Nivel Alto si aparece en el consolidado y en un ACR, o en 3 o más fallas mayores; si no, Medio. No usa inventario.',
        'Consolidado de fallas mayores y ACR.',
      ),
      relacionadas: ['hc-a-acr'],
    },
    {
      id: 'hc-a-prepost',
      grupo: 'explicar',
      seccion: 'Antecedentes',
      texto: 'Antes y después de mantenimientos mayores',
      respuesta: explicacion(
        'Si un mantenimiento mayor redujo o aumentó los paros.',
        'Para preventivos ejecutados de planes con 8 h o más por orden, compara los minutos de paro de los 30 días antes con los 30 días después. Cambio = 100 × (después − antes) / antes. Requiere 30 días de reporte diario a cada lado.',
        'Órdenes de SAP y reporte diario de paros.',
      ),
      relacionadas: ['hc-a-fallas-mayores'],
    },
  ],
}

