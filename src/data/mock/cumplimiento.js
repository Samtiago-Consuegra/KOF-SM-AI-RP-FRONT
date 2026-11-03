// Datos mock coherentes para Cumplimiento
// Paradas, tareas y relaciones consistentes

export const MAQUINAS_CRITICAS = ['Llenadora', 'Empacadora', 'Paletizadora', 'Envolvedora']

export const PARADAS = [
  {
    id: 'P-001',
    maquina: 'Llenadora',
    componente: 'Sistema de llenado',
    ordenSap: 'SAP-9001',
    estado: 'Vencida',
    inicio: '2026-11-03T06:00:00',
    finProg: '2026-11-03T14:00:00',
    finReal: null,
    tareas: [
      { id: 'T-001', nombre: 'Inspección de válvulas', componente: 'Válvulas', completada: false },
      { id: 'T-002', nombre: 'Cambio de juntas', componente: 'Juntas', completada: false },
      { id: 'T-003', nombre: 'Calibración de caudal', componente: 'Sensores', completada: false },
      { id: 'T-004', nombre: 'Prueba de estanqueidad', componente: 'Conexiones', completada: false }
    ]
  },
  {
    id: 'P-002',
    maquina: 'Empacadora',
    componente: 'Cabezal sellador',
    ordenSap: 'SAP-9002',
    estado: 'En ejecución',
    inicio: '2026-11-05T08:00:00',
    finProg: '2026-11-05T16:00:00',
    finReal: null,
    tareas: [
      { id: 'T-010', nombre: 'Revisión de resistencias', componente: 'Resistencias', completada: true },
      { id: 'T-011', nombre: 'Ajuste de presión', componente: 'Neumática', completada: true },
      { id: 'T-012', nombre: 'Limpieza de cabezal', componente: 'Cabezal', completada: false },
      { id: 'T-013', nombre: 'Prueba de sellado', componente: 'Sellador', completada: false }
    ]
  },
  {
    id: 'P-003',
    maquina: 'Paletizadora',
    componente: 'Brazo robótico',
    ordenSap: 'SAP-9003',
    estado: 'Pendiente',
    inicio: '2026-11-07T07:00:00',
    finProg: '2026-11-07T15:00:00',
    finReal: null,
    tareas: [
      { id: 'T-020', nombre: 'Lubricación de ejes', componente: 'Ejes', completada: false },
      { id: 'T-021', nombre: 'Revisión de baleros', componente: 'Rodamientos', completada: false },
      { id: 'T-022', nombre: 'Verificación de sensores', componente: 'Sensores', completada: false }
    ]
  },
  {
    id: 'P-004',
    maquina: 'Envolvedora',
    componente: 'Sistema film',
    ordenSap: 'SAP-9004',
    estado: 'Vencida',
    inicio: '2026-10-28T06:00:00',
    finProg: '2026-10-28T12:00:00',
    finReal: null,
    tareas: [
      { id: 'T-030', nombre: 'Cambio de rodillos', componente: 'Rodillos', completada: false },
      { id: 'T-031', nombre: 'Ajuste de tensión', componente: 'Tensores', completada: false },
      { id: 'T-032', nombre: 'Inspección de guía film', componente: 'Guía', completada: true },
      { id: 'T-033', nombre: 'Prueba de corte', componente: 'Cuchilla', completada: false },
      { id: 'T-034', nombre: 'Limpieza general', componente: 'General', completada: false }
    ]
  },
  {
    id: 'P-005',
    maquina: 'Llenadora',
    componente: 'Bombas',
    ordenSap: 'SAP-9005',
    estado: 'Pendiente',
    inicio: '2026-10-30T09:00:00',
    finProg: '2026-10-30T17:00:00',
    finReal: null,
    tareas: [
      { id: 'T-040', nombre: 'Revisión de bombas', componente: 'Bombas', completada: false },
      { id: 'T-041', nombre: 'Cambio de sellos', componente: 'Sellos', completada: false }
    ]
  },
  {
    id: 'P-006',
    maquina: 'Empacadora',
    componente: 'Transportador',
    ordenSap: 'SAP-9006',
    estado: 'En ejecución',
    inicio: '2026-11-01T07:00:00',
    finProg: '2026-11-01T13:00:00',
    finReal: null,
    tareas: [
      { id: 'T-050', nombre: 'Alineación de banda', componente: 'Banda', completada: true },
      { id: 'T-051', nombre: 'Revisión de rodillos', componente: 'Rodillos', completada: true },
      { id: 'T-052', nombre: 'Tensado de cadena', componente: 'Cadena', completada: true },
      { id: 'T-053', nombre: 'Lubricación', componente: 'Rodamientos', completada: false }
    ]
  },
  {
    id: 'P-007',
    maquina: 'Paletizadora',
    componente: 'Sistema eléctrico',
    ordenSap: 'SAP-9007',
    estado: 'Vencida',
    inicio: '2026-10-27T10:00:00',
    finProg: '2026-10-27T18:00:00',
    finReal: null,
    tareas: [
      { id: 'T-060', nombre: 'Revisión de contactores', componente: 'Contactores', completada: false },
      { id: 'T-061', nombre: 'Medición de aislamiento', componente: 'Cableado', completada: false },
      { id: 'T-062', nombre: 'Apriete de bornes', componente: 'Bornes', completada: false },
      { id: 'T-063', nombre: 'Prueba funcional', componente: 'Tablero', completada: false }
    ]
  },
  {
    id: 'P-008',
    maquina: 'Envolvedora',
    componente: 'Cuchilla corte',
    ordenSap: 'SAP-9008',
    estado: 'Pendiente',
    inicio: '2026-11-06T08:00:00',
    finProg: '2026-11-06T14:00:00',
    finReal: null,
    tareas: [
      { id: 'T-070', nombre: 'Cambio de cuchilla', componente: 'Cuchilla', completada: false },
      { id: 'T-071', nombre: 'Ajuste de guía', componente: 'Guía', completada: false },
      { id: 'T-072', nombre: 'Prueba de corte', componente: 'Cuchilla', completada: false }
    ]
  }
]

// Tareas reprogramadas (coherentes)
export const TAREAS_REPROGRAMADAS = [
  { tareaId: 'T-001', paradaId: 'P-001', reprogramadaA: 'P-005' },
  { tareaId: 'T-030', paradaId: 'P-004', reprogramadaA: 'P-007' }
]

export function getParadaById(id) {
  return PARADAS.find(p => p.id === id) || null
}
