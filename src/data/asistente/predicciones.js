import { explicacion, fechaCorta, lista, num, plural } from './helpers.js'

const NIVEL = { critico: 'crítico', medio: 'medio', bajo: 'bajo' }
const SIN_MODELO = 'El modelo predictivo aún no tiene resultados para mostrar.'

// Filas que la vista ya tiene (con el filtro aplicado); si no, la vista previa en caché del cliente.
async function filasDe({ datos }) {
  if (Array.isArray(datos.filas)) return { filas: datos.filas, meta: datos.meta ?? null }
  const { fetchPredictionPreview } = await import('../../api/predictions.js')
  const p = await fetchPredictionPreview()
  return { filas: p.available ? p.rows : [], meta: p.meta ?? null }
}

const ipmDe = (r) => r.ipmCurrent ?? r.ipm
const pronostico = (r) => {
  if (r.probability != null) return `${num(r.probability)} % de probabilidad de falla${r.horizon ? ` (${r.horizon})` : ''}`
  if (r.expectedFailuresWeek != null) return `~${num(r.expectedFailuresWeek, 1)} fallas esperadas por semana`
  return 'sin pronóstico disponible'
}

export default {
  vista: 'predicciones',
  titulo: 'Predicciones de falla',
  secciones: ['Indicadores de riesgo', 'Matriz predictiva'],
  preguntas: [
    // ── Sobre esta vista ────────────────────────────────────────────────────
    {
      id: 'pred-mayor-riesgo',
      grupo: 'vista',
      texto: '¿Qué máquina tiene mayor riesgo?',
      respuesta: async (ctx) => {
        const { filas } = await filasDe(ctx)
        if (!filas.length) return SIN_MODELO
        const top = filas.reduce((a, b) => ((ipmDe(b) ?? -1) > (ipmDe(a) ?? -1) ? b : a))
        return {
          texto: `${top.machine} tiene el mayor riesgo: IPM ${num(ipmDe(top), 1)}, nivel ${NIVEL[top.risk] ?? top.risk} y ${pronostico(top)}.`,
          accion: { etiqueta: 'Ver en Historia clínica', ruta: `/historia-clinica?maquina=${encodeURIComponent(top.machine)}` },
        }
      },
      relacionadas: ['pred-ipm', 'pred-niveles', 'pred-causa'],
    },
    {
      id: 'pred-criticas',
      grupo: 'vista',
      texto: '¿Cuántas máquinas están en riesgo crítico?',
      respuesta: async (ctx) => {
        const { filas } = await filasDe(ctx)
        if (!filas.length) return SIN_MODELO
        const criticas = filas.filter((r) => r.risk === 'critico')
        if (!criticas.length) return `Ninguna de las ${plural(filas.length, 'máquina', 'máquinas')} mostradas está en riesgo crítico.`
        return `${plural(criticas.length, 'máquina está', 'máquinas están')} en riesgo crítico: ${lista(criticas.map((r) => `${r.machine} (IPM ${num(ipmDe(r), 1)})`))}.`
      },
      relacionadas: ['pred-niveles', 'pred-k-niveles'],
    },
    {
      id: 'pred-causa',
      grupo: 'vista',
      texto: '¿Cuál es la causa principal del riesgo de cada máquina?',
      respuesta: async (ctx) => {
        const { filas } = await filasDe(ctx)
        if (!filas.length) return SIN_MODELO
        const con = filas.filter((r) => r.topCause)
        if (!con.length) return 'El modelo no reporta una causa principal para las máquinas mostradas.'
        return `Causa principal por máquina: ${lista(con.map((r) => `${r.machine}: "${r.topCause}"`))}.`
      },
      relacionadas: ['pred-x-causa'],
    },
    {
      id: 'pred-probabilidad',
      grupo: 'vista',
      texto: '¿Cuál es la probabilidad de falla de cada máquina?',
      respuesta: async (ctx) => {
        const { filas } = await filasDe(ctx)
        if (!filas.length) return SIN_MODELO
        return `${lista(filas.map((r) => `${r.machine}: ${pronostico(r)}`))}.`
      },
      relacionadas: ['pred-x-probabilidad'],
    },
    {
      id: 'pred-empeora',
      grupo: 'vista',
      texto: '¿Qué máquina empeoró más su IPM en el periodo?',
      respuesta: async (ctx) => {
        const { filas } = await filasDe(ctx)
        const conTendencia = filas.filter((r) => (r.trendPctCurrent ?? r.trendPct) != null)
        if (!conTendencia.length) return 'No hay tendencia del IPM para las máquinas mostradas.'
        const pct = (r) => r.trendPctCurrent ?? r.trendPct
        const peor = conTendencia.reduce((a, b) => (pct(b) > pct(a) ? b : a))
        if (pct(peor) <= 0) return 'Ninguna máquina empeoró: el IPM bajó o se mantuvo en todas.'
        return `${peor.machine} es la que más empeoró: su IPM subió ${num(pct(peor))} % en el periodo.`
      },
      relacionadas: ['pred-x-tendencia'],
    },
    {
      id: 'pred-paletizadora',
      grupo: 'vista',
      texto: '¿Cuántas fallas se esperan por semana en la Paletizadora?',
      respuesta: async (ctx) => {
        const { filas } = await filasDe(ctx)
        const r = filas.find((f) => f.expectedFailuresWeek != null)
        if (!r) return 'No hay pronóstico semanal de fallas para las máquinas mostradas.'
        return `Para ${r.machine} se esperan ~${num(r.expectedFailuresWeek, 1)} fallas por semana (promedio de las últimas 12 semanas).`
      },
      relacionadas: ['pred-x-probabilidad'],
    },
    {
      id: 'pred-actualizado',
      grupo: 'vista',
      texto: '¿Con datos hasta qué fecha se calculó el modelo?',
      respuesta: async (ctx) => {
        const { meta } = await filasDe(ctx)
        if (!meta?.datos_hasta && !meta?.generado) return SIN_MODELO
        const hasta = meta.datos_hasta ? `con datos hasta el ${fechaCorta(meta.datos_hasta)}` : ''
        const generado = meta.generado ? ` y se ejecutó el ${fechaCorta(meta.generado)}` : ''
        return `El modelo se calculó ${hasta}${generado}.`
      },
      relacionadas: ['pred-x-ultimos'],
    },

    // ── ¿Qué significa…? · Indicadores de riesgo ───────────────────────────
    {
      id: 'pred-k-niveles',
      grupo: 'explicar',
      seccion: 'Indicadores de riesgo',
      texto: 'Tarjetas Total, Riesgo crítico, medio y bajo',
      respuesta: explicacion(
        'Cuántas máquinas tiene el modelo y cuántas hay en cada nivel de riesgo.',
        'Se cuentan las filas de la matriz por su nivel (crítico, medio o bajo), que sale del IPM.',
        'Modelo predictivo (última ejecución o recalculado al periodo elegido).',
      ),
      relacionadas: ['pred-niveles'],
    },
    {
      id: 'pred-niveles',
      grupo: 'explicar',
      seccion: 'Indicadores de riesgo',
      texto: 'Niveles de riesgo: crítico, medio y bajo',
      respuesta: explicacion(
        'Semáforo de prioridad de cada máquina según su IPM.',
        'El motor usa cuatro niveles: Crítico (IPM ≥ 75), Alto (≥ 50), Medio (≥ 25) y Bajo (< 25). La app muestra tres: "Alto" se muestra como Crítico, así que crítico = IPM ≥ 50.',
        'Modelo predictivo (IPM de las últimas 12 semanas).',
      ),
      relacionadas: ['pred-ipm', 'pred-criticas'],
    },

    // ── ¿Qué significa…? · Matriz predictiva ───────────────────────────────
    {
      id: 'pred-x-matriz',
      grupo: 'explicar',
      seccion: 'Matriz predictiva',
      texto: 'Matriz predictiva de equipos',
      respuesta: explicacion(
        'Tabla con el riesgo de cada máquina crítica: nivel, probabilidad, tendencia, fecha de los datos e IPM.',
        'Las filas se ordenan por IPM de mayor a menor y siguen los filtros de máquina y nivel. Si el periodo termina antes del último dato, el servidor recalcula toda la matriz con datos hasta esa fecha.',
        'Modelo predictivo, alimentado con el reporte diario de paros.',
      ),
      relacionadas: ['pred-ipm', 'pred-niveles'],
    },
    {
      id: 'pred-ipm',
      grupo: 'explicar',
      seccion: 'Matriz predictiva',
      texto: 'IPM (Índice de Prioridad de Mantenimiento)',
      respuesta: explicacion(
        'Valor de 0 a 100 que ordena qué máquina atender primero; a mayor IPM, mayor prioridad.',
        'Con las últimas 12 semanas: Frecuencia (turnos con falla / turnos operados), Tiempo de paro (minutos / turnos operados), Recurrencia (fallas cuya misma causa se repite en 3 días operativos) y Criticidad (Llenadora 5; las demás 4). Cada criterio se divide por el máximo de las 4 máquinas × 100. IPM = 0,35·Tiempo + 0,25·Criticidad + 0,20·Frecuencia + 0,20·Recurrencia. Es relativo entre máquinas.',
        'Reporte diario de paros (desde agosto de 2024).',
      ),
      // REVISAR: el motor marca los pesos y la escala de criticidad como "PROPUESTA, pendiente de validar con la planta".
      relacionadas: ['pred-niveles', 'pred-x-tendencia'],
    },
    {
      id: 'pred-x-probabilidad',
      grupo: 'explicar',
      seccion: 'Matriz predictiva',
      texto: 'Probabilidad de falla y su horizonte',
      respuesta: explicacion(
        'Qué tan probable es que la máquina falle en el horizonte indicado.',
        'Depende de la máquina: Llenadora y Empacadora usan un modelo Random Forest para el próximo turno operativo; Envolvedora usa Weibull sobre el tiempo entre fallas, P = 1 − S(t+7)/S(t), para los próximos 7 días operativos (necesita al menos 10 intervalos); Paletizadora no tiene probabilidad: se muestran las fallas esperadas por semana (promedio de las últimas 12 semanas).',
        'Modelo predictivo, con el reporte diario de paros.',
      ),
      relacionadas: ['pred-probabilidad', 'pred-paletizadora'],
    },
    {
      id: 'pred-x-tendencia',
      grupo: 'explicar',
      seccion: 'Matriz predictiva',
      texto: 'Tendencia (sparkline)',
      respuesta: explicacion(
        'Cómo ha evolucionado el IPM de la máquina.',
        'Es la serie del IPM (un corte por semana, últimos 12 puntos; diaria si se recalculó a una fecha) recortada al periodo elegido. El porcentaje = 100 × (último − primero) / primero: rojo si sube más de 15 %, ámbar si sube menos y verde si baja.',
        'Modelo predictivo.',
      ),
      relacionadas: ['pred-empeora', 'pred-ipm'],
    },
    {
      id: 'pred-x-causa',
      grupo: 'explicar',
      seccion: 'Matriz predictiva',
      texto: 'Causa principal',
      respuesta: explicacion(
        'La causa de falla que más minutos de paro aporta a la máquina.',
        'Es la primera de las 3 "Subclave de paro" con más minutos en la ventana de 12 semanas del IPM. Aparece en el Excel descargado de la matriz.',
        'Reporte diario de paros.',
      ),
      relacionadas: ['pred-causa'],
    },
    {
      id: 'pred-x-ultimos',
      grupo: 'explicar',
      seccion: 'Matriz predictiva',
      texto: 'Últimos datos',
      respuesta: explicacion(
        'Fecha del último dato con el que se calculó el modelo.',
        'Es la fecha de corte de los datos de la ejecución; al pasar el cursor se ve cuándo se ejecutó el motor.',
        'Modelo predictivo.',
      ),
      relacionadas: ['pred-actualizado'],
    },
  ],
}
