// Datos simulados de Historia Clínica.
// Todos los cálculos (ficha, indicadores, gráfica, línea de tiempo, componentes y PDF)
// se derivan de la MISMA fuente: la lista de eventos por máquina. Cambiar cualquier
// generador aquí se refleja de forma coherente en toda la pestaña.

export const MAQUINAS = ['Llenadora', 'Empacadora', 'Paletizadora', 'Envolvedora']
export const SUFIJO_LINEA = 'L4'

// Jerarquía máquina → sistemas → componentes. El backend debe replicar esta forma.
export const JERARQUIA = {
  Llenadora: [
    {
      id: 'sistema-llenado', nombre: 'Sistema de llenado',
      componentes: [
        { id: 'valvula-llenado', nombre: 'Válvula de llenado' },
        { id: 'pernos-alivio', nombre: 'Perno block sniff/alivio' },
        { id: 'conexiones-rapidas', nombre: 'Conexiones rápidas' },
      ],
    },
    {
      id: 'transmision', nombre: 'Transmisión',
      componentes: [
        { id: 'cardan', nombre: 'Cardán' },
        { id: 'motor-reductor', nombre: 'Motor reductor' },
      ],
    },
    {
      id: 'hidraulico', nombre: 'Sistema hidráulico',
      componentes: [
        { id: 'bomba-hidraulica', nombre: 'Bomba hidráulica' },
        { id: 'sellos-hidraulicos', nombre: 'Sellos hidráulicos' },
      ],
    },
    {
      id: 'electrico', nombre: 'Sistema eléctrico',
      componentes: [
        { id: 'sensores-nivel', nombre: 'Sensores de nivel' },
        { id: 'rele-control', nombre: 'Relé de control' },
      ],
    },
  ],
  Empacadora: [
    {
      id: 'sellado', nombre: 'Sistema de sellado',
      componentes: [
        { id: 'cabezal-sellador', nombre: 'Cabezal sellador' },
        { id: 'resistencias', nombre: 'Resistencias térmicas' },
      ],
    },
    {
      id: 'transporte', nombre: 'Transporte',
      componentes: [
        { id: 'transportador', nombre: 'Transportador de botellas' },
        { id: 'neumatica', nombre: 'Neumática' },
      ],
    },
    {
      id: 'corte-empaque', nombre: 'Corte y empaque',
      componentes: [
        { id: 'guillotina', nombre: 'Guillotina' },
        { id: 'apilador', nombre: 'Apilador' },
      ],
    },
  ],
  Paletizadora: [
    {
      id: 'robotica', nombre: 'Robótica',
      componentes: [
        { id: 'brazo-robotico', nombre: 'Brazo robótico' },
        { id: 'gripper', nombre: 'Gripper' },
      ],
    },
    {
      id: 'control', nombre: 'Control',
      componentes: [
        { id: 'encoder', nombre: 'Encoder' },
        { id: 'variador', nombre: 'Variador' },
        { id: 'plc', nombre: 'PLC' },
      ],
    },
    {
      id: 'hidraulica', nombre: 'Hidráulica',
      componentes: [
        { id: 'unidad-hidraulica', nombre: 'Unidad hidráulica' },
        { id: 'baleros', nombre: 'Baleros' },
      ],
    },
  ],
  Envolvedora: [
    {
      id: 'film', nombre: 'Sistema de film',
      componentes: [
        { id: 'rodillo-film', nombre: 'Rodillo de film' },
        { id: 'guias-film', nombre: 'Guías de film' },
      ],
    },
    {
      id: 'corte', nombre: 'Corte y sellado',
      componentes: [
        { id: 'cuchilla', nombre: 'Cuchilla' },
        { id: 'sellador', nombre: 'Sellador' },
      ],
    },
    {
      id: 'electrica', nombre: 'Sistema eléctrico',
      componentes: [
        { id: 'variador-envolvedora', nombre: 'Variador' },
        { id: 'tablero', nombre: 'Tablero eléctrico' },
      ],
    },
  ],
}

// Valores fijos por máquina (no derivables de eventos: cumplimiento de plan
// y órdenes administrativas vienen de SAP).
export const PLANES = {
  Llenadora: { fallaPredominante: 'Por desgaste', planesPreventivosVigentes: 5, ordenesSinEjecutar: 2, cumplimientoPlan: 92 },
  Empacadora: { fallaPredominante: 'Aleatoria', planesPreventivosVigentes: 4, ordenesSinEjecutar: 1, cumplimientoPlan: 94 },
  Paletizadora: { fallaPredominante: 'En racha', planesPreventivosVigentes: 6, ordenesSinEjecutar: 0, cumplimientoPlan: 90 },
  Envolvedora: { fallaPredominante: 'Por desgaste', planesPreventivosVigentes: 3, ordenesSinEjecutar: 1, cumplimientoPlan: 95 },
}

const OBS_CORRECTIVO = [
  'Tiempo de la orden marcado como atípico por cierre tardío',
  'Reparación de campo completada en la misma ruta',
  'Ajuste mecánico tras la ronda de inspección',
]

function componentesDe(maquina) {
  const out = []
  ;(JERARQUIA[maquina] ?? []).forEach((sis) => {
    sis.componentes.forEach((c) => out.push({ ...c, sistemaId: sis.id, sistemaNombre: sis.nombre }))
  })
  return out
}

export function componentesDeMaquina(maquina) {
  return componentesDe(maquina)
}

const clamp30 = (n) => 2 + (n % 28)

/* Genera los eventos de una máquina determinísticamente a partir de la jerarquía:
   2–3 fallas por mes + 1 preventivo/correctivo/aviso rotando, en los últimos
   12 meses respecto al mes actual.
   // DATOS DE PRUEBA: eliminar este generador cuando se conecte el backend. */
function generarEventos(maquina) {
  const comps = componentesDe(maquina)
  const idxMaquina = MAQUINAS.indexOf(maquina)
  const hoy = new Date()
  const eventos = []
  let n = 0
  for (let i = 11; i >= 0; i--) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
    const y = d.getFullYear()
    const m = d.getMonth()

    // Fallas del mes: 2 o 3 según el mes, así las barras de la gráfica tienen volumen
    const fallasMes = 2 + (i % 2)
    for (let f = 0; f < fallasMes; f++) {
      const compF = comps[(i * 2 + f + idxMaquina) % comps.length]
      const minF = 35 + ((i * 37 + f * 23 + idxMaquina * 11 + 5) % 126)
      const diaF = clamp30(i * 7 + 2 + f * 8 + idxMaquina)
      const fechaF = `${y}-${String(m + 1).padStart(2, '0')}-${String(diaF).padStart(2, '0')}`
      n += 1
      eventos.push({
        id: `${maquina.slice(0, 2).toUpperCase()}-F${n}`,
        fecha: fechaF,
        tipo: 'FALLA',
        orden: null,
        sistemaId: compF.sistemaId,
        sistemaNombre: compF.sistemaNombre,
        componenteId: compF.id,
        componenteNombre: compF.nombre,
        titulo: `Falla en ${compF.nombre}`,
        detalle: `Turno ${(n % 3) + 1} · ${minF} min de paro · Registrado en el Excel diario`,
        minutosParo: minF,
      })
    }

    // Segundo tipo de evento del mes: PREVENTIVO / CORRECTIVO / AVISO rotando
    const comp2 = comps[(i * 2 + 1 + idxMaquina) % comps.length]
    const tipo = ['PREVENTIVO', 'CORRECTIVO', 'AVISO'][i % 3]
    const orden = `ZFI${idxMaquina * 10 + 20 + i}`
    const dia2 = clamp30(i * 9 + 20 + idxMaquina)
    const fecha2 = `${y}-${String(m + 1).padStart(2, '0')}-${String(dia2).padStart(2, '0')}`
    n += 1
    let ev2
    if (tipo === 'PREVENTIVO') {
      const dur = 60 + ((i * 17 + idxMaquina * 7) % 180)
      const tareas = ['Cambio de sellos', 'Inspección general', 'Lubricación', 'Alineación', 'Revisión general']
      ev2 = {
        id: `${maquina.slice(0, 2).toUpperCase()}-P${n}`,
        fecha: fecha2,
        tipo: 'PREVENTIVO',
        orden,
        sistemaId: comp2.sistemaId,
        sistemaNombre: comp2.sistemaNombre,
        componenteId: comp2.id,
        componenteNombre: comp2.nombre,
        titulo: `${tareas[i % tareas.length]} · ${comp2.nombre}`,
        detalle: `Orden ${orden} · Ejecutado en la parada programada · Duración real ${dur} min`,
        minutosParo: null,
        duracionReal: dur,
        ejecutado: true,
      }
    } else if (tipo === 'CORRECTIVO') {
      ev2 = {
        id: `${maquina.slice(0, 2).toUpperCase()}-C${n}`,
        fecha: fecha2,
        tipo: 'CORRECTIVO',
        orden,
        sistemaId: comp2.sistemaId,
        sistemaNombre: comp2.sistemaNombre,
        componenteId: comp2.id,
        componenteNombre: comp2.nombre,
        titulo: `Reparación de ${comp2.nombre}`,
        detalle: `Orden ${orden} · ${OBS_CORRECTIVO[i % OBS_CORRECTIVO.length]}`,
        minutosParo: null,
      }
    } else {
      ev2 = {
        id: `${maquina.slice(0, 2).toUpperCase()}-A${n}`,
        fecha: fecha2,
        tipo: 'AVISO',
        orden,
        sistemaId: comp2.sistemaId,
        sistemaNombre: comp2.sistemaNombre,
        componenteId: comp2.id,
        componenteNombre: comp2.nombre,
        titulo: `Ruido anormal en ${comp2.nombre}`,
        detalle: `Aviso ${orden} · Vinculado a la orden ${orden}`,
        minutosParo: null,
      }
    }
    eventos.push(ev2)
  }
  return eventos.sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
}

const filmes = (nombre) => new Date(nombre)

export function getEventos(maquina, filtros = {}) {
  let list = generarEventos(maquina)
  if (filtros.tipo && filtros.tipo !== 'Todo') {
    const map = { Fallas: 'FALLA', Avisos: 'AVISO', Órdenes: 'CORRECTIVO', Preventivos: 'PREVENTIVO' }
    list = list.filter((e) => e.tipo === map[filtros.tipo])
  }
  if (filtros.sistema) list = list.filter((e) => e.sistemaId === filtros.sistema)
  if (filtros.componente) list = list.filter((e) => e.componenteId === filtros.componente)
  if (filtros.desde) list = list.filter((e) => e.fecha >= filtros.desde)
  if (filtros.hasta) list = list.filter((e) => e.fecha <= filtros.hasta)
  return list
}

// Etiquetas de los últimos N meses (contando el actual hacia atrás): "Nov 25"
export function etiquetasMeses(n = 12) {
  const hoy = new Date()
  const out = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
    const s = d.toLocaleDateString('es-CO', { month: 'short', year: '2-digit' })
    out.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: s.charAt(0).toUpperCase() + s.slice(1) })
  }
  return out
}

export function getParosPorMes(maquina, filtros = {}) {
  const eventos = getEventos(maquina, filtros)
  const desde = filtros.desde ? filtros.desde.slice(0, 7) : null
  const hasta = filtros.hasta ? filtros.hasta.slice(0, 7) : null
  let meses = etiquetasMeses(12)
  if (desde && hasta) {
    const idxDesde = meses.findIndex((m) => m.key === desde)
    const idxHasta = meses.findIndex((m) => m.key === hasta)
    if (idxDesde !== -1 && idxDesde <= idxHasta) meses = etiquetasMeses(12).slice(idxDesde, idxHasta + 1)
    else meses = etiquetasMeses(Math.max(Math.round((new Date(filtros.hasta) - new Date(filtros.desde)) / (30 * 864e5)), 1))
  }
  return meses.map(({ key, label }) => {
    const delMes = eventos.filter((e) => e.fecha.slice(0, 7) === key)
    const paros = delMes.filter((e) => e.tipo === 'FALLA')
    return {
      key,
      mes: label,
      paros: paros.length,
      minutosParo: paros.reduce((s, e) => s + (e.minutosParo || 0), 0),
      mantenimientos: delMes
        .filter((e) => e.tipo === 'PREVENTIVO')
        .map((e) => ({ orden: e.orden, tarea: e.titulo, fecha: e.fecha.slice(8, 10) + '/' + key.slice(5, 7) })),
    }
  })
}

export function getIndicadores(maquina, filtros = {}) {
  const eventos = getEventos(maquina, filtros)
  const fallas = eventos.filter((e) => e.tipo === 'FALLA')
  const minutosParo = fallas.reduce((s, e) => s + (e.minutosParo || 0), 0)
  const dias = filtros.desde && filtros.hasta
    ? Math.max(Math.round((filmes(filtros.hasta) - filmes(filtros.desde)) / 864e5) + 1, 1)
    : 365
  const horasPeriodo = dias * 24
  const mtbf = fallas.length ? Math.round(horasPeriodo / fallas.length) : 0
  const mttr = fallas.length ? Math.round(minutosParo / fallas.length) : 0
  const porMin = dias * 24 * 60
  const disponibilidad = Math.max(50, Math.round((1 - minutosParo / porMin) * 1000) / 10)
  return {
    fallas: fallas.length,
    minutosParo,
    mtbf,
    mttr,
    disponibilidad,
    cumplimientoPlan: PLANES[maquina].cumplimientoPlan,
    promedioLinea: null, // lo calcula el servicio comparando las 4 máquinas
  }
}

// Nivel de criticidad derivado del conteo de fallas por componente
function nivelPorFallas(fallas, max) {
  if (!max) return 'Sin nivel'
  if (fallas === max) return 'Crítico'
  if (fallas >= Math.max(1, Math.round(max * 0.6))) return 'Alto'
  if (fallas >= Math.max(1, Math.round(max * 0.3))) return 'Medio'
  return 'Sin nivel'
}

export function getComponentesResumen(maquina, filtros = {}) {
  const eventos = getEventos(maquina, filtros)
  const comps = componentesDe(maquina)
  const dias = filtros.desde && filtros.hasta
    ? Math.max(Math.round((filmes(filtros.hasta) - filmes(filtros.desde)) / 864e5) + 1, 1)
    : 365
  const horasPeriodo = dias * 24
  const filas = comps.map((c) => {
    const fallasComp = eventos.filter((e) => e.tipo === 'FALLA' && e.componenteId === c.id)
    const min = fallasComp.reduce((s, e) => s + (e.minutosParo || 0), 0)
    return {
      id: c.id,
      sistemaId: c.sistemaId,
      sistemaNombre: c.sistemaNombre,
      nombre: c.nombre,
      fallas: fallasComp.length,
      mtbf: fallasComp.length ? Math.round(horasPeriodo / fallasComp.length) : null,
      ultimoEvento: fallasComp.length ? fallasComp[0].fecha : null,
      minutos: min,
    }
  })
  const max = Math.max(...filas.map((f) => f.fallas), 0)
  return filas
    .filter((f) => f.fallas > 0)
    .map((f) => ({ ...f, nivel: nivelPorFallas(f.fallas, max) }))
}
