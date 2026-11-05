import { MAQUINAS, JERARQUIA } from './historiaClinica.js'

export { MAQUINAS }


export const ALERTAS_MOCK = [
  { id: 'a-1', tipo: 'Ciclo', icon: 'RefreshCcw', color: 'tertiary', maquina: 'Llenadora', componente: 'Válvula de llenado', mensaje: 'Lleva sin avisos entre 0,5 y 0,8 de su intervalo habitual entre fallas.', disparado: 'Lleva 0,7 de su intervalo habitual sin avisos', accion: 'Ver en Historia clínica', accionRuta: '/historia-clinica' },
  { id: 'a-2', tipo: 'Paros en aumento', icon: 'TrendingUp', color: 'primary-500', maquina: 'Empacadora', componente: 'Cabezal sellador', mensaje: 'Los minutos de paro de las últimas 4 semanas son >= 1,5 veces el promedio.', disparado: 'Minutos de paro últimos 4 sem.: 1,7x el promedio', accion: 'Ver en Historia clínica', accionRuta: '/historia-clinica' },
  { id: 'a-3', tipo: 'Síntomas', icon: 'Stethoscope', color: 'primary-700', maquina: 'Paletizadora', componente: 'Brazo robótico', mensaje: 'El mismo síntoma se repite el doble de lo normal en las últimas 8 semanas.', disparado: 'Síntoma "vibración" repetido 2,0x vs histórico', accion: 'Ver en Historia clínica', accionRuta: '/historia-clinica' },
  { id: 'a-4', tipo: 'Estacionalidad', icon: 'CalendarRange', color: 'ink-700', maquina: 'Envolvedora', componente: 'Sellador', mensaje: 'En las mismas 6 semanas del año pasado hubo 2 o más avisos.', disparado: '2 avisos en las mismas semanas año anterior', accion: 'Ver en Historia clínica', accionRuta: '/historia-clinica' },
  { id: 'a-5', tipo: 'Cumplimiento', icon: 'ClipboardX', color: 'primary-600', maquina: 'Llenadora', componente: 'Sistema hidráulico', mensaje: 'Una tarea predictiva vence pronto o hay tareas preventivas acumuladas sin ejecutar.', disparado: 'Tareas preventivas acumuladas sin ejecutar: 2', accion: 'Ver tareas sugeridas', accionRuta: '/mantenimiento', accionTab: 'tareas' },
  { id: 'a-6', tipo: 'Brecha del plan', icon: 'ShieldAlert', color: 'ink-900', maquina: 'Paletizadora', componente: 'Unidad hidráulica', mensaje: 'Un componente crítico tiene un plan preventivo que no está a la altura de su comportamiento de fallas.', disparado: 'Plan preventivo insuficiente frente a frecuencia de fallas', accion: 'Ver plan', accionRuta: '/mantenimiento', accionTab: 'plan' },
  { id: 'a-7', tipo: 'Oportunidad', icon: 'Lightbulb', color: 'tertiary-700', maquina: 'Empacadora', componente: 'Transportador de botellas', mensaje: 'Hay tareas que se pueden agrupar en una parada de la semana.', disparado: '3 tareas candidatas para agrupar en parada', accion: 'Ver tareas sugeridas', accionRuta: '/mantenimiento', accionTab: 'tareas' },
  { id: 'a-8', tipo: 'Ciclo', icon: 'RefreshCcw', color: 'tertiary', maquina: 'Envolvedora', componente: 'Rodillo de film', mensaje: 'Lleva sin avisos entre 0,5 y 0,8 de su intervalo habitual entre fallas.', disparado: 'Lleva 0,6 de su intervalo habitual sin avisos', accion: 'Ver en Historia clínica', accionRuta: '/historia-clinica' },
]

export const ARCHIVOS_SEMANA_MOCK = [
  { id: 'f-1', tipo: 'Avisos de daño', icon: 'AlertTriangle', nombre: 'avisos_semana_45.xlsx', estado: 'actual', actualizado: '2026-11-03T08:15:00' },
  { id: 'f-2', tipo: 'Órdenes de trabajo', icon: 'ClipboardList', nombre: 'ordenes_trabajo_45.xlsx', estado: 'actual', actualizado: '2026-11-03T09:20:00' },
  { id: 'f-3', tipo: 'Plan preventivo', icon: 'CalendarCheck', nombre: 'plan_preventivo_45.xlsx', estado: 'sin_actualizar' },
]

export function buildParadasSemana({ startISO }) {
  const d1 = new Date(startISO)
  const d2 = new Date(startISO); d2.setDate(d2.getDate() + 1)
  const d3 = new Date(startISO); d3.setDate(d3.getDate() + 2)
  const d4 = new Date(startISO); d4.setDate(d4.getDate() + 3)
  const d5 = new Date(startISO); d5.setDate(d5.getDate() + 4)
  const iso = (x) => x.toISOString().slice(0, 10)
  return [
    { id: 'p-1', fecha: iso(d1), maquina: 'Llenadora', tipo: 'Preventiva', titulo: 'Lubricación y revisión general', horaInicio: '06:00', horaFin: '10:00', tareas: ['Lubricación puntos críticos', 'Revisión de correas', 'Inspección de fugas', 'Ajuste de tensiones', 'Limpieza zona'] },
    { id: 'p-2', fecha: iso(d1), maquina: 'Empacadora', tipo: 'Correctiva', titulo: 'Reemplazo sellos cabezal', horaInicio: '11:00', horaFin: '14:00', tareas: ['Retiro cabezal', 'Cambio sellos', 'Pruebas', 'Ajustes'] },
    { id: 'p-3', fecha: iso(d2), maquina: 'Paletizadora', tipo: 'Predictiva o sugerida por el sistema', titulo: 'Revisión gripper y brazo', horaInicio: '07:00', horaFin: '09:00', tareas: ['Inspección gripper', 'Revisión neumática', 'Calibración', 'Pruebas'] },
    { id: 'p-4', fecha: iso(d3), maquina: 'Envolvedora', tipo: 'Parada de producción (limpieza, cambio de formato)', titulo: 'Cambio de formato', horaInicio: '05:00', horaFin: '07:00', tareas: ['Cambio bobina', 'Ajuste guías', 'Limpieza'] },
    { id: 'p-5', fecha: iso(d5), maquina: 'Llenadora', tipo: 'Preventiva', titulo: 'Inspección hidráulica', horaInicio: '13:00', horaFin: '16:00', tareas: ['Revisión mangueras', 'Cambio filtros', 'Presión', 'Sellos'] },
  ]
}

export const PLAN_SUGERIDO_MOCK = [
  { id: 'ps-1', prioridad: 'Alta', maquina: 'Llenadora', sistema: 'Sistema hidráulico', componente: 'Bomba hidráulica', componenteId: 'bomba-hidraulica', tarea: 'Reemplazo preventivo de bomba', claseOrden: 'ZFI1', parada: { dia: 'Mar 3 nov', fecha: null, horaInicio: '', horaFin: '' }, enCalendario: false },
  { id: 'ps-2', prioridad: 'Alta', maquina: 'Empacadora', sistema: 'Sistema de sellado', componente: 'Cabezal sellador', componenteId: 'cabezal-sellador', tarea: 'Cambio de resistencias térmicas', claseOrden: 'ZFI1', parada: { dia: 'Lun 2 nov', fecha: null, horaInicio: '', horaFin: '' }, enCalendario: false },
  { id: 'ps-3', prioridad: 'Media', maquina: 'Paletizadora', sistema: 'Robótica', componente: 'Gripper', componenteId: 'gripper', tarea: 'Lubricación y calibración gripper', claseOrden: 'ZFI3', parada: { dia: 'Mié 4 nov', fecha: null, horaInicio: '', horaFin: '' }, enCalendario: false },
  { id: 'ps-4', prioridad: 'Media', maquina: 'Envolvedora', sistema: 'Corte y sellado', componente: 'Cuchilla', componenteId: 'cuchilla', tarea: 'Afilado / reemplazo cuchilla', claseOrden: 'ZFI3', parada: { dia: 'Jue 5 nov', fecha: null, horaInicio: '', horaFin: '' }, enCalendario: false },
  { id: 'ps-5', prioridad: 'Baja', maquina: 'Llenadora', sistema: 'Transmisión', componente: 'Cardán', componenteId: 'cardan', tarea: 'Inspección de cardán', claseOrden: 'ZPM1', parada: { dia: 'Vie 6 nov', fecha: null, horaInicio: '', horaFin: '' }, enCalendario: false },
  { id: 'ps-6', prioridad: 'Media', maquina: 'Empacadora', sistema: 'Transporte', componente: 'Transportador de botellas', componenteId: 'transportador', tarea: 'Alineación transportador', claseOrden: 'ZFI3', parada: { dia: 'Mar 3 nov', fecha: null, horaInicio: '', horaFin: '' }, enCalendario: false },
  { id: 'ps-7', prioridad: 'Alta', maquina: 'Paletizadora', sistema: 'Control', componente: 'Variador', componenteId: 'variador', tarea: 'Revisión térmica variador', claseOrden: 'ZFI1', parada: { dia: 'Lun 2 nov', fecha: null, horaInicio: '', horaFin: '' }, enCalendario: false },
  { id: 'ps-8', prioridad: 'Baja', maquina: 'Envolvedora', sistema: 'Sistema eléctrico', componente: 'Tablero eléctrico', componenteId: 'tablero', tarea: 'Inspección tablero', claseOrden: 'ZPM1', parada: { dia: 'Vie 6 nov', fecha: null, horaInicio: '', horaFin: '' }, enCalendario: false },
]

export const TAREAS_SUGERIDAS_MOCK = [
  { id: 'ts-1', prioridad: 'Alta', tarea: 'Revisión fugas hidráulicas', componente: 'Sellos hidráulicos', componenteId: 'sellos-hidraulicos', maquina: 'Llenadora', sistema: 'Sistema hidráulico', paradaSugerida: { existe: true, id: 'p-1', fecha: null, horaInicio: '06:00', horaFin: '10:00', dia: 'Lun 2 nov', maquina: 'Llenadora' } },
  { id: 'ts-2', prioridad: 'Alta', tarea: 'Cambio rodamientos motor reductor', componente: 'Motor reductor', componenteId: 'motor-reductor', maquina: 'Llenadora', sistema: 'Transmisión', paradaSugerida: { existe: false, id: null, dia: 'Mié 4 nov', maquina: 'Llenadora' } },
  { id: 'ts-3', prioridad: 'Media', tarea: 'Limpieza y ajuste guillotina', componente: 'Guillotina', componenteId: 'guillotina', maquina: 'Empacadora', sistema: 'Corte y empaque', paradaSugerida: { existe: true, id: 'p-2', fecha: null, horaInicio: '11:00', horaFin: '14:00', dia: 'Lun 2 nov', maquina: 'Empacadora' } },
  { id: 'ts-4', prioridad: 'Media', tarea: 'Verificación encoder', componente: 'Encoder', componenteId: 'encoder', maquina: 'Paletizadora', sistema: 'Control', paradaSugerida: { existe: false, id: null, dia: 'Vie 6 nov', maquina: 'Paletizadora' } },
  { id: 'ts-5', prioridad: 'Baja', tarea: 'Inspección guías film', componente: 'Guías de film', componenteId: 'guias-film', maquina: 'Envolvedora', sistema: 'Sistema de film', paradaSugerida: { existe: true, id: 'p-4', fecha: null, horaInicio: '05:00', horaFin: '07:00', dia: 'Mié 4 nov', maquina: 'Envolvedora' } },
  { id: 'ts-6', prioridad: 'Alta', tarea: 'Revisión plc comunicaciones', componente: 'PLC', componenteId: 'plc', maquina: 'Paletizadora', sistema: 'Control', paradaSugerida: { existe: false, id: null, dia: 'Jue 5 nov', maquina: 'Paletizadora' } },
  { id: 'ts-7', prioridad: 'Media', tarea: 'Ajuste tensores film', componente: 'Rodillo de film', componenteId: 'rodillo-film', maquina: 'Envolvedora', sistema: 'Sistema de film', paradaSugerida: { existe: true, id: null, dia: 'Mar 3 nov', maquina: 'Envolvedora' } },
  { id: 'ts-8', prioridad: 'Baja', tarea: 'Revisión pernos alivio', componente: 'Perno block sniff/alivio', componenteId: 'pernos-alivio', maquina: 'Llenadora', sistema: 'Sistema de llenado', paradaSugerida: { existe: false, id: null, dia: 'Vie 6 nov', maquina: 'Llenadora' } },
]

export const ASISTENTE_SUGERENCIAS = [
  '¿Qué paradas hay esta semana?',
  '¿Qué componente falla más?',
  '¿Qué tareas están pendientes?',
]

export function respuestaAsistenteSimulada(mensaje) {
  const m = (mensaje || '').toLowerCase()
  if (m.includes('parada')) return 'Esta semana hay 5 paradas programadas: Llenadora, Empacadora, Paletizadora y Envolvedora con distintas tareas.'
  if (m.includes('componente') && m.includes('falla')) return 'Componentes con mayor frecuencia: Cabezal sellador (Empacadora), Válvula de llenado (Llenadora) y Gripper (Paletizadora).'
  if (m.includes('tarea')) return 'Hay 8 tareas sugeridas esta semana. Varias tienen parada sugerida inexistente y requieren crearla.'
  return 'Te ayudo con paradas, tareas, plan sugerido y confiabilidad de las 4 máquinas críticas.'
}
