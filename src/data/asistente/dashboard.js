import { explicacion, lista, num, plural } from './helpers.js'

// El resumen /eda/summary solo existe dentro del Dashboard (no tiene caché): se usa lo publicado.
const contexto = ({ datos }) => datos.ctx ?? null
const seleccion = ({ datos }) => datos.sel ?? null
const periodo = ({ datos }) => (datos.periodo ? `en ${datos.periodo}` : 'en el periodo')
const SIN_PERIODO = 'No hay paros registrados en el periodo seleccionado.'

async function prediccion({ datos }) {
  if (datos.preview?.available) return datos.preview
  const { fetchPredictionPreview } = await import('../../api/predictions.js') // caché de 60 s del cliente
  return fetchPredictionPreview()
}

const mayor = (xs, campo) => xs.reduce((a, b) => (a === null || (b[campo] ?? -Infinity) > (a[campo] ?? -Infinity) ? b : a), null)

export default {
  vista: 'dashboard',
  titulo: 'Dashboard',
  secciones: ['Indicadores', 'Gráficas', 'Tabla MTBF', 'Panel lateral'],
  preguntas: [
    // ── Sobre esta vista ────────────────────────────────────────────────────
    {
      id: 'dash-mas-paros',
      grupo: 'vista',
      texto: '¿Cuál fue la máquina con más paros en el periodo?',
      respuesta: async (ctx) => {
        const maquinas = contexto(ctx)?.machines ?? []
        if (!maquinas.length) return SIN_PERIODO
        const top = mayor(maquinas, 'count')
        return `${top.machine} fue la máquina con más paros ${periodo(ctx)}: ${plural(top.count, 'registro')} y ${num(top.total_minutes)} minutos de paro.`
      },
      relacionadas: ['dash-mas-minutos', 'dash-g-paros-equipo', 'dash-falla-repite'],
    },
    {
      id: 'dash-mas-minutos',
      grupo: 'vista',
      texto: '¿Qué máquina acumuló más minutos de paro?',
      respuesta: async (ctx) => {
        const maquinas = contexto(ctx)?.machines ?? []
        if (!maquinas.length) return SIN_PERIODO
        const top = mayor(maquinas, 'total_minutes')
        return `${top.machine} acumuló más minutos de paro ${periodo(ctx)}: ${num(top.total_minutes)} min (${num(top.total_minutes / 60, 1)} h) en ${plural(top.count, 'registro')}.`
      },
      relacionadas: ['dash-mas-paros', 'dash-g-minutos-equipo'],
    },
    {
      id: 'dash-falla-repite',
      grupo: 'vista',
      texto: '¿Qué falla se repite más?',
      respuesta: async (ctx) => {
        const fallas = seleccion(ctx)?.top_failures ?? []
        if (!fallas.length) return SIN_PERIODO
        const top = mayor(fallas, 'count')
        return `La falla que más se repite ${periodo(ctx)} es "${top.failure_type}" en ${top.machine}: ${plural(top.count, 'registro')} y ${num(top.total_minutes)} minutos de paro.`
      },
      relacionadas: ['dash-g-top-fallas', 'dash-g-duracion'],
    },
    {
      id: 'dash-resumen',
      grupo: 'vista',
      texto: '¿Cuántos paros y minutos hubo en el periodo?',
      respuesta: async (ctx) => {
        const k = seleccion(ctx)?.kpis
        if (!k?.events_count) return SIN_PERIODO
        const delta = k.delta_vs_previous_pct == null ? '' : ` Frente al periodo anterior: ${k.delta_vs_previous_pct > 0 ? '+' : ''}${num(k.delta_vs_previous_pct, 1)} %.`
        return `${periodo(ctx).replace(/^en/, 'En')} hubo ${plural(k.events_count, 'registro de paro', 'registros de paro')} y ${num(k.stop_minutes)} minutos de paro (${num(k.stop_hours, 1)} h).${delta}`
      },
      relacionadas: ['dash-k-registros', 'dash-k-minutos'],
    },
    {
      id: 'dash-turno',
      grupo: 'vista',
      texto: '¿En qué turno hay más paros?',
      respuesta: async (ctx) => {
        const turnos = contexto(ctx)?.shifts ?? []
        if (!turnos.length) return SIN_PERIODO
        const porTurno = new Map()
        turnos.forEach((t) => porTurno.set(t.shift, (porTurno.get(t.shift) ?? 0) + t.count))
        const [turno, n] = [...porTurno.entries()].sort((a, b) => b[1] - a[1])[0]
        return `El turno ${turno} concentra más paros ${periodo(ctx)}: ${plural(n, 'registro')} entre todas las máquinas.`
      },
      relacionadas: ['dash-g-turno'],
    },
    {
      id: 'dash-mtbf-bajo',
      grupo: 'vista',
      texto: '¿Qué equipo tiene el MTBF más bajo?',
      respuesta: async (ctx) => {
        const filas = (contexto(ctx)?.mtbf ?? []).filter((r) => r.mtbf_hours != null)
        if (!filas.length) return SIN_PERIODO
        const bajo = filas.reduce((a, b) => (b.mtbf_hours < a.mtbf_hours ? b : a))
        return `${bajo.machine} tiene el MTBF más bajo ${periodo(ctx)}: ${num(bajo.mtbf_hours, 1)} h entre paros (${plural(bajo.count, 'paro')}).`
      },
      relacionadas: ['dash-t-mtbf', 'dash-k-mtbf'],
    },
    {
      id: 'dash-proxima',
      grupo: 'vista',
      texto: '¿Cuál es la próxima intervención?',
      respuesta: async () => {
        const { ahoraColombia, cargarProximaIntervencion, textoRelativo } = await import('../../hooks/useProximaIntervencion.js')
        const ahora = ahoraColombia()
        const { parada, semanaInicio, urgentesPendientes } = await cargarProximaIntervencion(ahora) // reutiliza la caché por semana
        const urgentes = urgentesPendientes ? ` Además hay ${plural(urgentesPendientes, 'tarea crítica o alta', 'tareas críticas o altas')} sin programar esta semana.` : ''
        if (!parada) return `No hay paradas programadas en las próximas dos semanas.${urgentes}`
        const maquinas = parada.maquinas?.length ? lista(parada.maquinas) : parada.maquina
        return {
          texto: `La próxima intervención es "${parada.titulo}" (${maquinas}): ${textoRelativo(parada.fecha, parada.horaInicio, ahora.fecha)}, hasta las ${parada.horaFin}.${urgentes}`,
          accion: { etiqueta: 'Ver en Mantenimiento', ruta: `/mantenimiento?semana=${semanaInicio}&parada=${parada.id}` },
        }
      },
      relacionadas: ['dash-c-planes'],
    },
    {
      id: 'dash-mayor-riesgo',
      grupo: 'vista',
      texto: '¿Qué máquina tiene mayor riesgo de falla?',
      respuesta: async (ctx) => {
        const p = await prediccion(ctx)
        if (!p?.available || !p.rows?.length) return 'El modelo predictivo aún no tiene resultados para mostrar.'
        const top = mayor(p.rows, 'probability')
        const criticas = p.rows.filter((r) => r.risk === 'critico').length
        const prob = top.probability != null ? `${num(top.probability)} % de probabilidad de falla` : 'sin probabilidad calculada'
        return {
          texto: `${top.machine} tiene el mayor riesgo: ${prob}${top.horizon ? ` (${top.horizon})` : ''}. Hay ${plural(criticas, 'máquina', 'máquinas')} en riesgo crítico.`,
          accion: { etiqueta: 'Ver en Predicciones', ruta: `/predicciones?maquina=${encodeURIComponent(top.machine)}` },
        }
      },
      relacionadas: ['dash-c-predicciones'],
    },

    // ── ¿Qué significa…? · Indicadores ─────────────────────────────────────
    {
      id: 'dash-k-registros',
      grupo: 'explicar',
      seccion: 'Indicadores',
      texto: 'Registros de paro',
      respuesta: explicacion(
        'Cantidad de registros de paro por falla de equipo en el periodo y las máquinas filtradas.',
        'Se cuenta cada fila del reporte (un registro por intervalo horario; no se fusionan en eventos). Solo cuenta el tipo de paro "P.EQ.LINEA". La variación = 100 × (registros − registros del periodo anterior de igual duración) / registros del periodo anterior.',
        'Reporte diario de paros (exportado de SAP).',
      ),
      relacionadas: ['dash-k-minutos', 'dash-resumen'],
    },
    {
      id: 'dash-k-minutos',
      grupo: 'explicar',
      seccion: 'Indicadores',
      texto: 'Minutos de paro',
      respuesta: explicacion(
        'Tiempo total que las máquinas filtradas estuvieron detenidas por fallas.',
        'Suma de "Minutos de paro" de los registros del periodo; las horas = minutos / 60.',
        'Reporte diario de paros.',
      ),
      relacionadas: ['dash-k-registros'],
    },
    {
      id: 'dash-k-equipos',
      grupo: 'explicar',
      seccion: 'Indicadores',
      texto: 'Equipos analizados',
      respuesta: explicacion(
        'Cuántas máquinas distintas tienen paros en el periodo según el filtro de máquinas.',
        'Número de máquinas diferentes entre los registros filtrados (0 si no hay registros).',
        'Reporte diario de paros.',
      ),
      relacionadas: ['dash-k-registros'],
    },
    {
      id: 'dash-k-mtbf',
      grupo: 'explicar',
      seccion: 'Indicadores',
      texto: 'MTBF medio (críticas)',
      respuesta: explicacion(
        'Tiempo medio entre paros de las máquinas críticas (Llenadora, Empacadora, Paletizadora y Envolvedora).',
        'Para cada máquina crítica con al menos un paro: MTBF = (días del periodo × 24) / número de registros. La tarjeta muestra el promedio simple de esas máquinas. Usa horas de calendario, no horas operadas, por eso no coincide con el MTBF de Historia clínica.',
        'Reporte diario de paros.',
      ),
      relacionadas: ['dash-t-mtbf', 'dash-mtbf-bajo'],
    },

    // ── ¿Qué significa…? · Gráficas ────────────────────────────────────────
    {
      id: 'dash-g-paros-equipo',
      grupo: 'explicar',
      seccion: 'Gráficas',
      texto: 'Cantidad de paros por equipo',
      respuesta: explicacion(
        'Registros de paro de cada máquina en el periodo, de mayor a menor.',
        'Conteo de registros por máquina. Esta gráfica muestra toda la línea, no sigue el filtro de máquinas.',
        'Reporte diario de paros.',
      ),
      relacionadas: ['dash-g-minutos-equipo', 'dash-mas-paros'],
    },
    {
      id: 'dash-g-minutos-equipo',
      grupo: 'explicar',
      seccion: 'Gráficas',
      texto: 'Minutos de paro por equipo',
      respuesta: explicacion(
        'Minutos totales de paro de cada máquina en el periodo.',
        'Suma de minutos de paro por máquina (toda la línea).',
        'Reporte diario de paros.',
      ),
      relacionadas: ['dash-g-paros-equipo', 'dash-mas-minutos'],
    },
    {
      id: 'dash-g-top-fallas',
      grupo: 'explicar',
      seccion: 'Gráficas',
      texto: 'Top de tipos de falla',
      respuesta: explicacion(
        'Los tipos de falla que más se repiten en las máquinas filtradas.',
        'El servidor toma, por máquina, los 10 tipos de falla ("Subclave de paro") con más registros; la gráfica ordena todo por cantidad y muestra los 15 primeros.',
        'Reporte diario de paros.',
      ),
      relacionadas: ['dash-falla-repite', 'dash-g-duracion'],
    },
    {
      id: 'dash-g-duracion',
      grupo: 'explicar',
      seccion: 'Gráficas',
      texto: 'Duración promedio por tipo de falla',
      respuesta: explicacion(
        'Cuánto dura en promedio un paro de cada tipo de falla.',
        'Promedio de "Minutos de paro" por máquina y tipo de falla.',
        'Reporte diario de paros.',
      ),
      relacionadas: ['dash-g-top-fallas'],
    },
    {
      id: 'dash-g-evolucion',
      grupo: 'explicar',
      seccion: 'Gráficas',
      texto: 'Evolución mensual o diaria de paros',
      respuesta: explicacion(
        'Cómo cambian los paros de cada máquina en el tiempo.',
        'Conteo de registros por mes y máquina. Si el periodo abarca menos de tres meses distintos, se muestra la serie diaria por máquina.',
        'Reporte diario de paros.',
      ),
      relacionadas: ['dash-k-registros'],
    },
    {
      id: 'dash-g-turno',
      grupo: 'explicar',
      seccion: 'Gráficas',
      texto: 'Distribución de paros por turno',
      respuesta: explicacion(
        'Registros de paro en cada turno (1, 2 y 3) por máquina.',
        'Conteo y minutos de registros agrupados por turno y máquina; solo se aceptan turnos 1 a 3. Muestra toda la línea.',
        'Reporte diario de paros.',
      ),
      relacionadas: ['dash-turno'],
    },
    {
      id: 'dash-g-eficiencia',
      grupo: 'explicar',
      seccion: 'Gráficas',
      texto: 'Minutos de paro vs puntos de eficiencia perdidos',
      respuesta: explicacion(
        'Relación entre la duración de cada paro y la eficiencia que se pierde.',
        'Un punto por registro: eje X = minutos de paro, eje Y = "Ptos. Efi. Perdid." del reporte. No hay un indicador de eficiencia calculado; es el valor de cada fila.',
        'Reporte diario de paros.',
      ),
      relacionadas: ['dash-k-minutos'],
    },

    // ── ¿Qué significa…? · Tabla MTBF ──────────────────────────────────────
    {
      id: 'dash-t-mtbf',
      grupo: 'explicar',
      seccion: 'Tabla MTBF',
      texto: 'MTBF preliminar por equipo',
      respuesta: explicacion(
        'Tiempo medio entre paros de cada máquina de la línea en el periodo.',
        'MTBF = (días del periodo × 24) / número de registros de la máquina. Es "preliminar" porque usa horas de calendario y registros sin fusionar.',
        'Reporte diario de paros.',
      ),
      relacionadas: ['dash-k-mtbf', 'dash-mtbf-bajo'],
    },

    // ── ¿Qué significa…? · Panel lateral ───────────────────────────────────
    {
      id: 'dash-c-predicciones',
      grupo: 'explicar',
      seccion: 'Panel lateral',
      texto: 'Card "Predicciones de falla"',
      respuesta: explicacion(
        'Vista previa del modelo predictivo: cuántas máquinas están en riesgo crítico y cuál tiene mayor probabilidad de falla.',
        '"Máquinas en riesgo crítico" cuenta las máquinas con nivel crítico (IPM ≥ 50, porque el nivel "alto" se muestra como crítico). "Mayor riesgo de falla" es la máquina con la probabilidad más alta. No depende del filtro de máquinas.',
        'Modelo predictivo (última ejecución).',
      ),
      relacionadas: ['dash-mayor-riesgo'],
    },
    {
      id: 'dash-c-planes',
      grupo: 'explicar',
      seccion: 'Panel lateral',
      texto: 'Card "Planes de mantenimiento"',
      respuesta: explicacion(
        'La próxima parada programada de la línea y las tareas urgentes pendientes.',
        'Próxima intervención = la primera parada que empieza ahora o después (esta semana o la siguiente), por fecha y hora. Urgentes = tareas Crítica o Alta del plan sugerido de esta semana que aún no están en el calendario.',
        'Paradas de la app y plan semanal del motor de planes.',
      ),
      relacionadas: ['dash-proxima'],
    },
  ],
}

