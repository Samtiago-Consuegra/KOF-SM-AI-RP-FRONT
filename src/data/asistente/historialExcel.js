import { explicacion, fechaCorta, lista, num, plural } from './helpers.js'

const REPORTE = 'reporte_diario'

// Archivos vigentes por tipo: la misma consulta (y caché) que usa Mantenimiento.
async function vigentes() {
  const s = await import('../../services/mantenimientoService.js')
  return s.leerCacheArchivos() ?? s.getArchivosSemana()
}

// Historial sin filtros: lo que la vista ya cargó si no tiene filtros; si no, la primera página.
async function historial({ datos }, params = {}) {
  if (datos.sinFiltros && datos.items && !Object.keys(params).length) return datos
  const { getHistorialArchivos } = await import('../../api/motor.js')
  const res = await getHistorialArchivos({ pagina: 1, por_pagina: 1, ...params })
  return { items: res?.items ?? [], conteo: res?.conteo_por_tipo ?? null, total: res?.total ?? 0 }
}

const autor = (it) => it.subido_por_nombre || it.subido_por || 'un usuario sin nombre registrado'

export default {
  vista: 'historialExcel',
  titulo: 'Historial de Excel',
  secciones: ['Tipos de archivo', 'Estados', 'Tabla'],
  preguntas: [
    // ── Sobre esta vista ────────────────────────────────────────────────────
    {
      id: 'hx-actualizado',
      grupo: 'vista',
      texto: '¿Cuándo se actualizó cada tipo de archivo?',
      respuesta: async (ctx) => {
        const [archivos, reporte] = await Promise.all([vigentes(), historial(ctx, { tipo: REPORTE })])
        const partes = (archivos ?? []).map((a) => `${a.tipo}: ${a.actualizado ? fechaCorta(a.actualizado) : 'sin cargar'}`)
        const ultimoReporte = reporte.items?.[0]
        partes.push(`Reporte diario: ${ultimoReporte ? fechaCorta(ultimoReporte.subido_en) : 'sin cargar'}`)
        if (!archivos?.length && !ultimoReporte) return 'Todavía no se ha cargado ningún archivo.'
        return `Última carga por tipo: ${lista(partes)}.`
      },
      relacionadas: ['hx-en-uso', 'hx-e-en-uso'],
    },
    {
      id: 'hx-en-uso',
      grupo: 'vista',
      texto: '¿Qué archivos están en uso?',
      respuesta: async () => {
        const archivos = await vigentes()
        const enUso = (archivos ?? []).filter((a) => a.estado === 'actual')
        if (!enUso.length) return 'No hay archivos en uso: el motor aún no tiene archivos cargados.'
        return `Archivos en uso: ${lista(enUso.map((a) => (a.clave === 'acr' ? `ACR (${plural(a.total ?? 0, 'archivo')})` : `${a.tipo}: "${a.nombre}"`)))}.`
      },
      relacionadas: ['hx-e-en-uso', 'hx-e-reemplazado'],
    },
    {
      id: 'hx-sin-cargar',
      grupo: 'vista',
      texto: '¿Qué tipo de archivo no se ha cargado nunca?',
      respuesta: async () => {
        const archivos = await vigentes()
        if (!archivos?.length) return 'No pude saber qué archivos hay cargados.'
        const faltan = archivos.filter((a) => a.estado !== 'actual')
        if (!faltan.length) return 'Todos los tipos de archivo del motor tienen al menos un archivo cargado.'
        return `Sin ningún archivo cargado: ${lista(faltan.map((a) => a.tipo))}.`
      },
      relacionadas: ['hx-actualizado'],
    },
    {
      id: 'hx-conteo',
      grupo: 'vista',
      texto: '¿Cuántos archivos hay de cada tipo?',
      respuesta: async (ctx) => {
        const { conteo, total } = await historial(ctx)
        if (!total) return 'Todavía no se ha cargado ningún archivo.'
        const partes = Object.entries(conteo ?? {}).filter(([, n]) => n > 0).map(([tipo, n]) => `${tipo.replace(/_/g, ' ')} ${num(n)}`)
        return `Hay ${plural(total, 'archivo cargado', 'archivos cargados')}${partes.length ? `: ${lista(partes)}` : ''}.`
      },
      relacionadas: ['hx-t-reporte'],
    },
    {
      id: 'hx-ultimo',
      grupo: 'vista',
      texto: '¿Cuál fue el último archivo cargado y quién lo subió?',
      respuesta: async (ctx) => {
        const { items } = await historial(ctx, { tipo: undefined })
        const it = items?.[0]
        if (!it) return 'Todavía no se ha cargado ningún archivo.'
        return `El último archivo fue "${it.nombre_archivo}" (${String(it.tipo).replace(/_/g, ' ')}), subido el ${fechaCorta(it.subido_en)} por ${autor(it)}.`
      },
      relacionadas: ['hx-x-subido'],
    },
    {
      id: 'hx-acr',
      grupo: 'vista',
      texto: '¿Cuántos ACR hay cargados?',
      respuesta: async () => {
        const acr = (await vigentes())?.find((a) => a.clave === 'acr')
        if (!acr?.total) return 'No hay ACR cargados.'
        return `Hay ${plural(acr.total, 'ACR cargado', 'ACR cargados')}; el más reciente se subió el ${fechaCorta(acr.actualizado)}.`
      },
      relacionadas: ['hx-t-acr'],
    },

    // ── ¿Qué significa…? · Tipos de archivo ────────────────────────────────
    {
      id: 'hx-t-reporte',
      grupo: 'explicar',
      seccion: 'Tipos de archivo',
      texto: 'Reporte diario',
      respuesta: explicacion(
        'Excel diario de paros de la línea, exportado de SAP. Alimenta el Dashboard, las predicciones y la historia clínica.',
        'Se toma la hoja "BD SAP" (o la primera), solo los paros "P.EQ.LINEA", y se descartan filas incompletas o repetidas. Cada carga suma registros; no reemplaza las anteriores.',
        'Excel exportado de SAP que sube el usuario desde la app.',
      ),
      relacionadas: ['hx-e-procesado'],
    },
    {
      id: 'hx-t-avisos',
      grupo: 'explicar',
      seccion: 'Tipos de archivo',
      texto: 'Avisos de daño',
      respuesta: explicacion(
        'Histórico de avisos de daño de SAP (archivos HISTORICO_AVISOS).',
        'El motor lo usa para las alertas de ciclo, síntomas y estacionalidad, y para el puntaje SAP de prioridad. Se recomienda cargarlo cada semana.',
        'Exportación de SAP subida al motor de planes.',
      ),
      relacionadas: ['hx-t-ordenes'],
    },
    {
      id: 'hx-t-ordenes',
      grupo: 'explicar',
      seccion: 'Tipos de archivo',
      texto: 'Órdenes de trabajo',
      respuesta: explicacion(
        'Histórico de órdenes de trabajo de SAP (archivos HISTORICO_OT), desde 2024.',
        'El motor calcula con él el cumplimiento SAP, los estados de las órdenes y los eventos preventivos y correctivos. Se recomienda cargarlo cada semana.',
        'Exportación de SAP subida al motor de planes.',
      ),
      relacionadas: ['hx-t-plan'],
    },
    {
      id: 'hx-t-plan',
      grupo: 'explicar',
      seccion: 'Tipos de archivo',
      texto: 'Plan preventivo',
      respuesta: explicacion(
        'Plan preventivo vigente de SAP (archivos PM_SAP).',
        'Define qué órdenes vencen cada semana y la frecuencia de cada plan. Se carga cuando el plan cambia.',
        'Exportación de SAP subida al motor de planes.',
      ),
      relacionadas: ['hx-t-ordenes'],
    },
    {
      id: 'hx-t-consolidado',
      grupo: 'explicar',
      seccion: 'Tipos de archivo',
      texto: 'Consolidado de fallas mayores',
      respuesta: explicacion(
        'Registro de fallas de más de 60 minutos con su causa y el motivo del alto tiempo.',
        'Alimenta los antecedentes de fallas mayores, el repuesto crítico y la alerta de falla mayor en racha.',
        'Archivo de la planta subido al motor de planes.',
      ),
      relacionadas: ['hx-t-acr'],
    },
    {
      id: 'hx-t-acr',
      grupo: 'explicar',
      seccion: 'Tipos de archivo',
      texto: 'ACR y ACR revisado',
      respuesta: explicacion(
        'ACR: un Excel por análisis de causa raíz (el nombre empieza con la fecha DD-MM-AAAA_). ACR revisado: el consolidado de ACR revisado.',
        'Cada ACR se guarda por nombre: subir otro con el mismo nombre reemplaza al anterior. Alimentan los antecedentes y la alerta de acciones sin cierre.',
        'Archivos de la planta subidos al motor de planes.',
      ),
      relacionadas: ['hx-acr'],
    },

    // ── ¿Qué significa…? · Estados ─────────────────────────────────────────
    {
      id: 'hx-e-en-uso',
      grupo: 'explicar',
      seccion: 'Estados',
      texto: '"En uso"',
      respuesta: explicacion(
        'Es el archivo que el motor está usando para ese tipo.',
        'Es el último archivo subido de su tipo (en ACR, el último de cada nombre).',
        'Historial de archivos del motor.',
      ),
      relacionadas: ['hx-e-reemplazado'],
    },
    {
      id: 'hx-e-reemplazado',
      grupo: 'explicar',
      seccion: 'Estados',
      texto: '"Reemplazado"',
      respuesta: explicacion(
        'Un archivo que ya no usa el motor.',
        'Se subió después otro archivo del mismo tipo (o un ACR con el mismo nombre), que pasó a estar en uso.',
        'Historial de archivos del motor.',
      ),
      relacionadas: ['hx-e-en-uso'],
    },
    {
      id: 'hx-e-procesado',
      grupo: 'explicar',
      seccion: 'Estados',
      texto: '"Procesado"',
      respuesta: explicacion(
        'Un reporte diario cuyos registros ya se guardaron en la base de datos.',
        'Los reportes diarios no se reemplazan: cada carga suma registros. El detalle muestra los insertados, los duplicados (ya existían) y el rango de fechas.',
        'Carga del reporte diario.',
      ),
      relacionadas: ['hx-t-reporte'],
    },

    // ── ¿Qué significa…? · Tabla ───────────────────────────────────────────
    {
      id: 'hx-x-subido',
      grupo: 'explicar',
      seccion: 'Tabla',
      texto: '"Subido por" y fecha de carga',
      respuesta: explicacion(
        'Quién subió el archivo y cuándo.',
        'Es el usuario con sesión iniciada al momento de la carga y la fecha y hora en que se recibió.',
        'Historial de archivos del motor.',
      ),
      relacionadas: ['hx-ultimo'],
    },
  ],
}
