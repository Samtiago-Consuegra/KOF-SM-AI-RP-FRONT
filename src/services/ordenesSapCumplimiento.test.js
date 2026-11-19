import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../api/motor.js', () => ({ getOrdenesSap: vi.fn() }))

const api = await import('../api/motor.js')
const { getOrdenesSapPeriodo, resumenOrdenes, tramos, vistaDesdeParams, VISTAS } = await import('./ordenesSapCumplimiento.js')

const orden = (n, estado, fecha = '2026-10-27') => ({
  orden: String(n), maquina: 'Llenadora', fecha_programada: fecha, tipo_orden: 'Preventiva', estado, texto: `OT ${n}`,
})

describe('Cumplimiento · vista Órdenes de SAP', () => {
  beforeEach(() => api.getOrdenesSap.mockReset())

  it('resume la semana 44, divide rangos largos sin duplicar, lee la vista de la URL y usa caché', async () => {
    // Semana 44 (26 oct – 1 nov 2026): 38 órdenes, 3 ejecutadas, 35 abiertas.
    const semana44 = Array.from({ length: 38 }, (_, i) => orden(1000 + i, i < 3 ? 'Ejecutada' : 'Abierta'))
    api.getOrdenesSap.mockResolvedValue({ ordenes: semana44 })
    const r44 = await getOrdenesSapPeriodo({ desde: '2026-10-26', hasta: '2026-11-01', maquina: 'todas' })
    expect(resumenOrdenes(r44.ordenes)).toEqual({ total: 38, ejecutadas: 3, noEjecutadas: 0, abiertas: 35, cumplimiento: 8 })

    // Volver a la vista con el mismo periodo y máquina no repite la petición.
    await getOrdenesSapPeriodo({ desde: '2026-10-26', hasta: '2026-11-01', maquina: 'todas' })
    expect(api.getOrdenesSap).toHaveBeenCalledTimes(1)

    // Más de 31 días: tramos de máximo 31 días y unión sin duplicados.
    api.getOrdenesSap.mockReset()
    api.getOrdenesSap.mockImplementation(async (p) => {
      const desde = p?.desde
      return { ordenes: [orden(`T-${desde}`, 'Ejecutada', desde), orden('REPETIDA', 'No ejecutada', '2026-10-01')] }
    })
    const largo = await getOrdenesSapPeriodo({ desde: '2026-09-01', hasta: '2026-11-01', maquina: 'Llenadora' })
    expect(tramos('2026-09-01', '2026-11-01')).toEqual([
      { desde: '2026-09-01', hasta: '2026-10-01' },
      { desde: '2026-10-02', hasta: '2026-11-01' },
    ])
    expect(api.getOrdenesSap).toHaveBeenCalledTimes(2)
    expect(api.getOrdenesSap).toHaveBeenCalledWith({ desde: '2026-10-02', hasta: '2026-11-01', maquina: 'Llenadora' })
    expect(largo.ordenes.map((o) => o.orden).sort()).toEqual(['REPETIDA', 'T-2026-09-01', 'T-2026-10-02'])

    // Vista por defecto: "Paradas programadas" sin ?vista.
    expect(vistaDesdeParams(new URLSearchParams(''))).toBe(VISTAS.PARADAS)
    expect(vistaDesdeParams(new URLSearchParams('vista=sap'))).toBe(VISTAS.SAP)
  })
})
