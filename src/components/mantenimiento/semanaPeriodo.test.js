import { describe, expect, it, vi } from 'vitest'

import { semanaPeriodo } from './semanaPeriodo.js'
import { getPlanSugerido, getTareasSugeridas } from '../../services/mantenimientoService.js'

const tarea = (extra) => ({
  Maquina: 'Llenadora', Sistema: 'Llenado', Componente: 'Válvula de llenado', Id_componente: 'LLE-001',
  Prioridad: 'Alta', Estado: 'Sugerida', Id_parada: null, Clase_orden: 'PM02 · Preventivo', ...extra,
})

vi.mock('../../api/motor.js', () => ({
  getPlanSemanal: vi.fn(async () => ({
    semana: '2026-W46',
    versiones: {
      fusion: {
        paradas: [],
        tareas_sugeridas: [
          tarea({ Id_tarea: 'REC-LLE-001', Origen: 'Recomendación del motor', Tarea: 'Cambiar juntas',
            Motivo: '8 eventos y 365 min de paro. Ninguna tarea del plan lo cubre.' }),
          tarea({ Id_tarea: 'SAP-1', Orden: 4001, Origen: 'Plan SAP', Tarea: 'Lubricar', Motivo: 'Vence esta semana en el plan SAP.' }),
          tarea({ Id_tarea: 'SAP-2', Orden: 4001, Origen: 'Plan SAP', Tarea: 'Ajustar', Motivo: 'Operación 20 de la misma orden.' }),
        ],
      },
    },
  })),
  getMotorEstado: vi.fn(async () => ({ en_cola: false })),
}))

describe('semanaPeriodo', () => {
  it('semana dentro del mismo mes', () => {
    expect(semanaPeriodo({ weekNum: 46, start: '2026-11-09', end: '2026-11-15' })).toBe('Semana 46 · 9 – 15 nov 2026')
  })
  it('semana que cruza de mes', () => {
    expect(semanaPeriodo({ weekNum: 44, start: '2026-10-26', end: '2026-11-01' })).toBe('Semana 44 · 26 oct – 1 nov 2026')
  })
  it('semana que cruza de año', () => {
    expect(semanaPeriodo({ weekNum: 1, start: '2025-12-29', end: '2026-01-04' })).toBe('Semana 1 · 29 dic 2025 – 4 ene 2026')
  })
})

it('el adaptador entrega origen y motivo del motor', async () => {
  const [plan] = await getPlanSugerido('2026-11-09')
  expect(plan).toMatchObject({
    id: 'REC-LLE-001',
    origen: 'Recomendación del motor',
    motivo: '8 eventos y 365 min de paro. Ninguna tarea del plan lo cubre.',
  })

  const [orden] = await getTareasSugeridas('2026-11-09')
  expect(orden).toMatchObject({
    id: 'OT-4001',
    origen: 'Plan SAP',
    motivo: 'Vence esta semana en el plan SAP.\n\nOperación 20 de la misma orden.',
  })
})
