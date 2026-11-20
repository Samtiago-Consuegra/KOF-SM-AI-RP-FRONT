import { explicacion, fechaCorta, lista, lunesDeHoy, num, plural } from './helpers.js'

// Lo que la vista ya tiene en pantalla; si falta, la caché por semana del servicio y, por último,
// la misma función que usa la página (sin cambiar la semana con la que se envían decisiones).
const servicio = () => import('../../services/mantenimientoService.js')

async function paradasDe({ datos }) {
  // Una lista vacía puede ser 'aún cargando': entonces se mira la caché o se consulta.
  if (datos.paradas?.length) return datos.paradas
  const s = await servicio()
  const inicio = datos.calInicio || datos.semanaInicio || lunesDeHoy()
  return s.leerCacheSemana(inicio)?.paradas ?? s.getParadasSemana({ startISO: inicio, fijarVista: false })
}

async function ordenesSapDe({ datos }) {
  if (datos.ordenesSap) return datos.ordenesSap
  const s = await servicio()
  return s.getOrdenesSapSemana(datos.calInicio || datos.semanaInicio || lunesDeHoy()) // ya usa la caché por semana
}

async function semanaActual({ datos }, campo, getter) {
  if (datos[campo]?.length) return datos[campo]
  const s = await servicio()
  const inicio = datos.semanaInicio || lunesDeHoy()
  return s.leerCacheSemana(inicio)?.[campo] ?? s[getter](inicio)
}

async function archivosDe({ datos }) {
  if (Array.isArray(datos.archivos) && datos.archivos.length) return datos.archivos
  const s = await servicio()
  return s.leerCacheArchivos() ?? s.getArchivosSemana()
}

const URGENTES = new Set(['Crítica', 'Alta'])
const condicion = (c) => (c === 'caliente' ? 'en caliente' : 'en frío')
const ejecucion = (e) => (e === 'contratista' ? 'con contratista' : 'con equipo propio')
const maquinasDe = (p) => (Array.isArray(p.maquinas) && p.maquinas.length ? lista(p.maquinas) : p.maquina || 'sin máquina')

export default {
  vista: 'mantenimiento',
  titulo: 'Planes de mantenimiento',
  secciones: ['Alertas', 'Semana', 'Archivos de la semana', 'Plan y tareas sugeridas', 'Cálculos del motor'],
  preguntas: [
    // ── Sobre esta vista ────────────────────────────────────────────────────
    {
      id: 'man-paradas',
      grupo: 'vista',
      texto: '¿Qué paradas hay esta semana?',
      respuesta: async (ctx) => {
        const paradas = await paradasDe(ctx)
        if (!paradas?.length) return 'No hay paradas programadas esta semana.'
        const detalle = paradas.slice(0, 5).map((p) =>
          `${p.titulo || maquinasDe(p)} (${maquinasDe(p)}) el ${fechaCorta(p.fecha)}, ${p.horaInicio}–${p.horaFin}, ${condicion(p.condicion)} y ${ejecucion(p.ejecucion)}`)
        const resto = paradas.length > 5 ? ` Y ${plural(paradas.length - 5, 'parada')} más en el calendario.` : ''
        return `Esta semana hay ${plural(paradas.length, 'parada programada', 'paradas programadas')}: ${lista(detalle)}.${resto}`
      },
      relacionadas: ['man-sap', 'man-condicion', 'man-sin-programar'],
    },
    {
      id: 'man-sin-programar',
      grupo: 'vista',
      texto: '¿Qué tareas críticas o altas están sin programar?',
      respuesta: async (ctx) => {
        const plan = await semanaActual(ctx, 'plan', 'getPlanSugerido')
        const pendientes = (plan || []).filter((t) => URGENTES.has(t._prioridadMotor) && !t.enCalendario)
        if (!pendientes.length) return 'No hay tareas de prioridad crítica o alta sin programar esta semana.'
        const detalle = pendientes.slice(0, 5).map((t) => `${t.tarea} (${t.maquina}, ${t._prioridadMotor.toLowerCase()})`)
        return `Hay ${plural(pendientes.length, 'tarea crítica o alta', 'tareas críticas o altas')} del plan sugerido que aún no están en una parada: ${lista(detalle)}.${pendientes.length > 5 ? ' Las demás están en la tabla "Plan sugerido de la semana".' : ''}`
      },
      relacionadas: ['man-prioridad', 'man-plan-sugerido', 'man-paradas'],
    },
    {
      id: 'man-sap',
      grupo: 'vista',
      texto: '¿Cuántas órdenes de SAP hay esta semana y en qué estado?',
      respuesta: async (ctx) => {
        const sap = await ordenesSapDe(ctx)
        const r = sap?.resumen
        if (!r?.total) return 'No hay órdenes de SAP programadas esta semana.'
        return `Esta semana hay ${plural(r.total, 'orden de SAP', 'órdenes de SAP')}: ${num(r.ejecutadas)} ejecutadas, ${num(r.noEjecutadas)} no ejecutadas y ${num(r.abiertas)} abiertas.`
      },
      relacionadas: ['man-estados-sap', 'man-indicadores-semana', 'man-paradas'],
    },
    {
      id: 'man-resumen',
      grupo: 'vista',
      texto: '¿Cómo viene la semana en resumen?',
      respuesta: async (ctx) => {
        const [paradas, sap, alertas] = await Promise.all([paradasDe(ctx), ordenesSapDe(ctx), semanaActual(ctx, 'alertas', 'getAlertasSemana')])
        const nParadas = paradas?.length ?? 0
        const nOrdenes = sap?.resumen?.total ?? 0
        const nAlertas = alertas?.length ?? 0
        if (!nParadas && !nOrdenes && !nAlertas) return 'No hay paradas, órdenes de SAP ni alertas registradas para esta semana.'
        return `Esta semana hay ${plural(nParadas, 'parada programada', 'paradas programadas')}, ${plural(nOrdenes, 'orden de SAP', 'órdenes de SAP')} y ${plural(nAlertas, 'alerta destacada', 'alertas destacadas')}.`
      },
      relacionadas: ['man-paradas', 'man-sap', 'man-alertas'],
    },
    {
      id: 'man-alertas',
      grupo: 'vista',
      texto: '¿Qué alertas hay esta semana?',
      respuesta: async (ctx) => {
        const alertas = await semanaActual(ctx, 'alertas', 'getAlertasSemana')
        if (!alertas?.length) return 'No hay alertas destacadas esta semana.'
        return `Hay ${plural(alertas.length, 'alerta destacada', 'alertas destacadas')}: ${lista(alertas.map((a) => `${a.tipo} en ${a.componente}${a.maquina ? ` (${a.maquina})` : ''}`))}.`
      },
      relacionadas: ['man-alertas-semana', 'man-alerta-ciclo', 'man-alerta-paros'],
    },
    {
      id: 'man-contratista',
      grupo: 'vista',
      texto: '¿Qué tareas sugeridas requieren contratista?',
      respuesta: async (ctx) => {
        const [plan, tareas] = await Promise.all([semanaActual(ctx, 'plan', 'getPlanSugerido'), semanaActual(ctx, 'tareas', 'getTareasSugeridas')])
        const con = [...(plan || []), ...(tareas || [])].filter((t) => t.conContratista)
        if (!con.length) return 'Ninguna tarea sugerida de esta semana requiere contratista.'
        return `${plural(con.length, 'tarea sugerida requiere', 'tareas sugeridas requieren')} contratista: ${lista(con.slice(0, 5).map((t) => `${t.tarea} (${t.maquina})`))}.`
      },
      relacionadas: ['man-ejecucion', 'man-tareas-sugeridas'],
    },
    {
      id: 'man-archivos',
      grupo: 'vista',
      texto: '¿Qué archivos faltan por cargar?',
      respuesta: async (ctx) => {
        const archivos = await archivosDe(ctx)
        if (!archivos?.length) return 'No hay información de archivos cargados.'
        const faltan = archivos.filter((a) => a.estado !== 'actual')
        if (!faltan.length) return 'Todos los tipos de archivo del motor tienen un archivo vigente cargado.'
        return `Falta cargar: ${lista(faltan.map((a) => a.tipo))}.`
      },
      accion: { etiqueta: 'Ver historial de Excel', ruta: '/historial' },
      relacionadas: ['man-archivos-semana'],
    },

    // ── ¿Qué significa…? · Alertas ─────────────────────────────────────────
    {
      id: 'man-alertas-semana',
      grupo: 'explicar',
      seccion: 'Alertas',
      texto: 'Alertas de la semana',
      respuesta: explicacion(
        'Avisos del motor de planes sobre componentes que conviene revisar esta semana.',
        'El motor evalúa varias reglas (ciclo, paros en aumento, síntomas, etc.) y marca como destacadas máximo 5 por semana: una por componente y máximo 2 del mismo tipo, ordenadas por la prioridad del componente.',
        'Motor de planes, con avisos y órdenes de SAP, el reporte diario, el consolidado de fallas mayores y los ACR.',
      ),
      relacionadas: ['man-alerta-ciclo', 'man-prioridad'],
    },
    {
      id: 'man-alerta-ciclo',
      grupo: 'explicar',
      seccion: 'Alertas',
      texto: 'Alerta "Ciclo"',
      respuesta: explicacion(
        'El componente se acerca al momento en que suele volver a fallar.',
        'Requiere al menos 3 avisos. Se dispara cuando los días desde el último aviso están entre 0,8 y 1,5 veces la mediana del intervalo entre avisos.',
        'Avisos de daño de SAP.',
      ),
      relacionadas: ['man-alertas-semana', 'man-alerta-sintomas'],
    },
    {
      id: 'man-alerta-paros',
      grupo: 'explicar',
      seccion: 'Alertas',
      texto: 'Alerta "Paros en aumento"',
      respuesta: explicacion(
        'Los minutos de paro del componente subieron frente a su comportamiento habitual.',
        'Minutos de las últimas 4 semanas ≥ 1,5 × el promedio de bloques de 4 semanas de las 26 semanas anteriores, y al menos 60 minutos.',
        'Reporte diario de paros.',
      ),
      relacionadas: ['man-alertas-semana'],
    },
    {
      id: 'man-alerta-sintomas',
      grupo: 'explicar',
      seccion: 'Alertas',
      texto: 'Alerta "Síntomas"',
      respuesta: explicacion(
        'Se repite el mismo síntoma en un sistema más de lo normal.',
        'Al menos 2 avisos con el mismo síntoma en un sistema en 8 semanas, y al menos el doble de la tasa normal de 8 semanas.',
        'Avisos de daño de SAP.',
      ),
      relacionadas: ['man-alertas-semana'],
    },
    {
      id: 'man-alerta-estacionalidad',
      grupo: 'explicar',
      seccion: 'Alertas',
      texto: 'Alerta "Estacionalidad"',
      respuesta: explicacion(
        'En esta misma época del año pasado el componente falló.',
        'Al menos 2 avisos de falla en las mismas 6 semanas del año anterior.',
        'Avisos de daño de SAP.',
      ),
      relacionadas: ['man-alertas-semana'],
    },
    {
      id: 'man-alerta-cumplimiento',
      grupo: 'explicar',
      seccion: 'Alertas',
      texto: 'Alerta "Cumplimiento"',
      respuesta: explicacion(
        'Riesgo de incumplir el plan de órdenes.',
        'Una orden predictiva vence en las próximas 3 semanas, o la máquina tiene 3 o más órdenes preventivas "No ejecutada" en 8 semanas.',
        'Órdenes de trabajo de SAP.',
      ),
      relacionadas: ['man-estados-sap'],
    },
    {
      id: 'man-alerta-brecha',
      grupo: 'explicar',
      seccion: 'Alertas',
      texto: 'Alerta "Brecha del plan"',
      respuesta: explicacion(
        'Un componente crítico no está bien cubierto por el plan preventivo.',
        'Componente crítico cuya acción recomendada es crear, acortar o cumplir su plan.',
        'Plan preventivo de SAP cruzado con la priorización del motor.',
      ),
      relacionadas: ['man-prioridad'],
    },
    {
      id: 'man-alerta-oportunidad',
      grupo: 'explicar',
      seccion: 'Alertas',
      texto: 'Alerta "Oportunidad"',
      respuesta: explicacion(
        'Una parada de la semana ya tiene tareas asignadas: es el momento de ejecutarlas.',
        'Se genera por cada parada con tareas asignadas en el plan semanal.',
        'Paradas registradas en la app y plan semanal del motor.',
      ),
      relacionadas: ['man-plan-sugerido'],
    },
    {
      id: 'man-alerta-repuesto',
      grupo: 'explicar',
      seccion: 'Alertas',
      texto: 'Alerta "Riesgo de repuesto"',
      respuesta: explicacion(
        'El componente tiene un repuesto crítico y hay trabajo planeado o una alerta activa.',
        'Componente marcado con repuesto crítico (por falta, demora o calidad del repuesto en fallas mayores o ACR) que tiene trabajo planeado o una alerta activa. No usa datos de inventario.',
        'Consolidado de fallas mayores y ACR.',
      ),
      relacionadas: ['man-alertas-semana'],
    },
    {
      id: 'man-alerta-racha',
      grupo: 'explicar',
      seccion: 'Alertas',
      texto: 'Alerta "Falla mayor en racha"',
      respuesta: explicacion(
        'El componente acumula fallas mayores seguidas.',
        'Al menos 2 fallas mayores (más de 60 min) en 30 días, la última dentro de los últimos 45 días.',
        'Consolidado de fallas mayores.',
      ),
      relacionadas: ['man-alertas-semana'],
    },
    {
      id: 'man-alerta-despues',
      grupo: 'explicar',
      seccion: 'Alertas',
      texto: 'Alerta "Después de mantenimiento mayor"',
      respuesta: explicacion(
        'Tras un mantenimiento mayor reciente, los paros aumentaron.',
        'Mantenimiento mayor en los últimos 60 días; los minutos de paro después son ≥ 1,5 × los de antes, con al menos 3 registros después.',
        'Órdenes de SAP (mantenimientos de 8 h o más) y reporte diario de paros.',
      ),
      relacionadas: ['man-alertas-semana'],
    },
    {
      id: 'man-alerta-acr',
      grupo: 'explicar',
      seccion: 'Alertas',
      texto: 'Alerta "Acción ACR sin cierre"',
      respuesta: explicacion(
        'Una acción de un análisis de causa raíz venció sin registrar su cierre.',
        'Acción cuya fecha de fin pasó dentro de los últimos 120 días y no tiene cierre registrado.',
        'Archivos de ACR cargados al motor.',
      ),
      relacionadas: ['man-alertas-semana'],
    },

    // ── ¿Qué significa…? · Semana ──────────────────────────────────────────
    {
      id: 'man-condicion',
      grupo: 'explicar',
      seccion: 'Semana',
      texto: 'Condición en frío o en caliente',
      respuesta: explicacion(
        'Indica si la parada se hace con la máquina fría (detenida para intervenir) o caliente (sin enfriar).',
        'La elige el usuario al programar la parada (por defecto, en frío). En una parada en caliente el motor solo asigna tareas de "Inspección" o "Inspección y ajuste"; las tareas que escribe el usuario no tienen esa restricción.',
        'Paradas registradas en la app y reglas del motor de planes.',
      ),
      // REVISAR: el motor marca la regla de paradas en caliente como "POR CONFIRMAR" con mantenimiento (fase20).
      relacionadas: ['man-ejecucion', 'man-paradas'],
    },
    {
      id: 'man-ejecucion',
      grupo: 'explicar',
      seccion: 'Semana',
      texto: 'Ejecución: equipo propio o contratista',
      respuesta: explicacion(
        'Quién ejecuta los trabajos de la parada: el equipo de mantenimiento de la planta o un contratista.',
        'En la parada lo elige el usuario. En las tareas sugeridas, el motor marca "con contratista" cuando el texto de la tarea o del componente menciona altura, amoníaco, alta tensión, izaje o espacio confinado; esas tareas no consumen la capacidad interna (horas de la parada × 2 técnicos).',
        'Paradas de la app y motor de planes.',
      ),
      relacionadas: ['man-condicion', 'man-contratista'],
    },
    {
      id: 'man-estados-sap',
      grupo: 'explicar',
      seccion: 'Semana',
      texto: 'Estados de las órdenes de SAP',
      respuesta: explicacion(
        'Situación de cada orden de SAP programada en la semana: Ejecutada, No ejecutada o Abierta.',
        'Se lee del campo "Status del sistema" de SAP, en este orden: si contiene NEJE es No ejecutada; si contiene CERR o CTEC es Ejecutada; si contiene ABIE o LIB. es Abierta. En el resumen de la app, todo lo que no es Ejecutada ni No ejecutada cuenta como abierta.',
        'Histórico de órdenes de trabajo de SAP.',
      ),
      relacionadas: ['man-sap', 'man-indicadores-semana'],
    },
    {
      id: 'man-indicadores-semana',
      grupo: 'explicar',
      seccion: 'Semana',
      texto: 'Indicadores de la semana',
      respuesta: explicacion(
        'Los conteos sobre el calendario: órdenes, ejecutadas, no ejecutadas y abiertas.',
        'Se cuentan las órdenes de SAP con fecha programada dentro de la semana mostrada, agrupadas por su estado.',
        'Órdenes de trabajo de SAP (motor de planes).',
      ),
      relacionadas: ['man-estados-sap', 'man-sap'],
    },

    // ── ¿Qué significa…? · Archivos de la semana ───────────────────────────
    {
      id: 'man-archivos-semana',
      grupo: 'explicar',
      seccion: 'Archivos de la semana',
      texto: 'Archivos de la semana',
      respuesta: explicacion(
        'Estado de los seis tipos de Excel que usa el motor: avisos, órdenes, plan preventivo, consolidado de fallas mayores, ACR y ACR revisado.',
        'Cada tipo muestra "Actualizado" con la fecha de carga si existe un archivo vigente (el último subido de ese tipo); si no hay ninguno, aparece "Sin actualizar esta semana". Para ACR se cuenta cuántos hay cargados.',
        'Archivos subidos al motor de planes.',
      ),
      // REVISAR: el texto dice "esta semana", pero el código solo comprueba que exista un archivo vigente, sin mirar la fecha.
      relacionadas: ['man-archivos'],
    },

    // ── ¿Qué significa…? · Plan y tareas sugeridas ─────────────────────────
    {
      id: 'man-plan-sugerido',
      grupo: 'explicar',
      seccion: 'Plan y tareas sugeridas',
      texto: 'Plan sugerido de la semana',
      respuesta: explicacion(
        'Las recomendaciones del motor para esta semana, por componente.',
        'Son las tareas con origen "Recomendación del motor", sin las pospuestas por el usuario ni las de verificar en SAP, ordenadas por prioridad. A cada una se le sugiere la primera parada que detiene su máquina, dura más que la tarea y tiene capacidad.',
        'Motor de planes (plan semanal).',
      ),
      relacionadas: ['man-tareas-sugeridas', 'man-prioridad', 'man-porque'],
    },
    {
      id: 'man-tareas-sugeridas',
      grupo: 'explicar',
      seccion: 'Plan y tareas sugeridas',
      texto: 'Tareas sugeridas',
      respuesta: explicacion(
        'Las órdenes del plan preventivo de SAP que vencen esta semana.',
        'Son las tareas con origen "Plan SAP", agrupadas en una fila por orden (si la orden tiene varias operaciones se juntan). Se excluyen las pospuestas y las de verificar en SAP.',
        'Plan preventivo y órdenes de SAP, a través del motor de planes.',
      ),
      relacionadas: ['man-plan-sugerido', 'man-origen-sap'],
    },
    {
      id: 'man-prioridad',
      grupo: 'explicar',
      seccion: 'Plan y tareas sugeridas',
      texto: 'Prioridad',
      respuesta: explicacion(
        'Qué tan urgente es atender el componente.',
        'IPM del componente = promedio de dos puntajes: A (reporte diario: 50 % minutos + 25 % eventos + 15 % MTTR mediano + 10 % tendencia) y B (SAP: 40 % costo correctivo + 35 % avisos + 25 % severidad de la brecha); ×0,85 si solo hay una fuente. Por posición: Crítica el 10 % superior, Alta el 20 % siguiente, Media el 30 % siguiente y Baja el resto. La tabla muestra tres niveles: "Crítica" aparece como "Alta".',
        'Motor de planes, con reporte diario y datos de SAP.',
      ),
      relacionadas: ['man-porque', 'man-sin-programar'],
    },
    {
      id: 'man-porque',
      grupo: 'explicar',
      seccion: 'Plan y tareas sugeridas',
      texto: '¿Por qué se sugiere una tarea?',
      respuesta: explicacion(
        'La justificación que acompaña a cada sugerencia.',
        'Es el campo "Motivo" del motor: para órdenes de SAP, "Orden SAP del plan vigente" (o que cubre un componente priorizado); para recomendaciones, la justificación con los puntajes de reporte diario y SAP; para tareas manuales, "Tarea registrada por el usuario en la parada".',
        'Motor de planes.',
      ),
      relacionadas: ['man-prioridad', 'man-origen-motor'],
    },
    {
      id: 'man-origen-sap',
      grupo: 'explicar',
      seccion: 'Plan y tareas sugeridas',
      texto: 'Origen "Plan SAP"',
      respuesta: explicacion(
        'La tarea viene de una orden del plan preventivo de SAP.',
        'El motor la toma de las órdenes del plan que vencen en la semana; puede adelantar órdenes abiertas hasta un 20 % de su intervalo (máximo 7 días).',
        'Plan preventivo y órdenes de SAP.',
      ),
      relacionadas: ['man-origen-motor', 'man-origen-usuario'],
    },
    {
      id: 'man-origen-motor',
      grupo: 'explicar',
      seccion: 'Plan y tareas sugeridas',
      texto: 'Origen "Recomendación del motor"',
      respuesta: explicacion(
        'La tarea la propone el motor según la prioridad del componente.',
        'Solo pasa al programador si su canal es "Parada programada" y su prioridad es Crítica o Alta.',
        'Motor de planes (reporte diario y SAP).',
      ),
      relacionadas: ['man-origen-sap', 'man-prioridad'],
    },
    {
      id: 'man-origen-usuario',
      grupo: 'explicar',
      seccion: 'Plan y tareas sugeridas',
      texto: 'Origen "Registrada por el usuario"',
      respuesta: explicacion(
        'Tarea escrita a mano por el usuario al programar una parada.',
        'No se recalcula: se guarda con la parada y no aparece en las tablas de sugerencias.',
        'Paradas registradas en la app.',
      ),
      relacionadas: ['man-origen-sap'],
    },

    // ── ¿Qué significa…? · Cálculos del motor ──────────────────────────────
    {
      id: 'man-por-verificar',
      grupo: 'explicar',
      seccion: 'Cálculos del motor',
      texto: 'Órdenes por verificar en SAP',
      respuesta: explicacion(
        'Órdenes preventivas o predictivas de la semana anterior que siguen abiertas y no se enviaron a una parada.',
        'El motor las lista pero no las reprograma, porque lo más probable es que se hicieran y falte cerrarlas en SAP. La app no las muestra en las tablas de sugerencias.',
        'Órdenes de trabajo de SAP (motor de planes).',
      ),
      relacionadas: ['man-estados-sap', 'man-fuera-parada'],
    },
    {
      id: 'man-fuera-parada',
      grupo: 'explicar',
      seccion: 'Cálculos del motor',
      texto: 'Fuera de parada',
      respuesta: explicacion(
        'Recomendaciones que no necesitan una parada programada.',
        'Recomendaciones de prioridad Crítica o Alta cuyo canal es "Rutina del operador" (frecuencia menor a una semana) o "Acción de gestión". También existen las tareas "sin parada": las que no cupieron o requieren una parada dedicada.',
        'Motor de planes.',
      ),
      relacionadas: ['man-por-verificar', 'man-plan-sugerido'],
    },
  ],
}
