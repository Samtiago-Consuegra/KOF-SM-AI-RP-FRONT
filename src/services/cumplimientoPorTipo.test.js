import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../api/motor.js', () => ({ getCumplimientoGrafica: vi.fn() }))

import * as api from '../api/motor.js'
import { getCumplimientoSemanal } from './cumplimientoService.js'

const rango = { from: '2026-11-09', to: '2026-11-15', type: 'week' }
const fila = { maquina: 'Llenadora', etiqueta: null, programadas: 5, ejecutadas: 3, vencidas: 0, pospuestas: 0, cumplimiento_pct: 60 }

describe('getCumplimientoSemanal · porTipo', () => {
  beforeEach(() => vi.clearAllMocks())

  it('entrega porTipo con los valores de por_tipo', async () => {
    api.getCumplimientoGrafica.mockResolvedValue({ filas: [fila], por_tipo: { Preventiva: 2, Correctiva: 2, Predictiva: 1 } })
    const res = await getCumplimientoSemanal({ rango })
    expect(res.porTipo).toEqual({ Preventiva: 2, Correctiva: 2, Predictiva: 1 })
    expect(res[0]).toMatchObject({ maquina: 'Llenadora', programadas: 5, cumplimiento: 60 })
  })

  it('pone todos en 0 si por_tipo no viene', async () => {
    api.getCumplimientoGrafica.mockResolvedValue({ filas: [fila] })
    const res = await getCumplimientoSemanal({ rango })
    expect(res.porTipo).toEqual({ Preventiva: 0, Correctiva: 0, Predictiva: 0 })
  })
})
