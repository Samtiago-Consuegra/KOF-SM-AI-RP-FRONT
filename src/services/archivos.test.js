import { expect, it, vi } from 'vitest'

import { ARCHIVOS, getArchivosSemana } from './mantenimientoService.js'

const f = (id, tipo, nombre, subido_en) => ({ id, tipo, nombre_archivo: nombre, subido_en, subido_por: 'planner@kof.com' })

vi.mock('../api/motor.js', () => ({
  getArchivosMotor: vi.fn(async () => ({
    vigentes: {
      avisos: f(1, 'avisos', 'HISTORICO_AVISOS.xlsx', '2026-11-10T08:00:00'),
      ordenes: f(2, 'ordenes', 'Ordenes.xlsx', '2026-11-09T08:00:00'),
      plan: f(3, 'plan', 'Plan.xlsx', '2026-11-08T08:00:00'),
      consolidado: null,
      acr_revisado: f(4, 'acr_revisado', 'ACR_revisado.xlsx', '2026-11-07T08:00:00'),
      equivalencias: null,
    },
    acr: [
      f(9, 'acr', '11-11-2026_Llenadora.xlsx', '2026-11-11T08:00:00'),
      f(8, 'acr', '05-11-2026_Empacadora.xlsx', '2026-11-05T08:00:00'),
      f(7, 'acr', '01-11-2026_Paletizadora.xlsx', '2026-11-01T08:00:00'),
    ],
  })),
}))

it('ARCHIVOS tiene los 6 tipos y getArchivosSemana los devuelve con el conteo de ACR', async () => {
  expect(ARCHIVOS.map((a) => a.clave)).toEqual(['avisos', 'ordenes', 'plan', 'consolidado', 'acr', 'acr_revisado'])
  for (const a of ARCHIVOS) {
    expect(a.tipo).toBeTruthy()
    expect(a.desc).toBeTruthy()
    expect(a.Icon).toBeTruthy()
  }

  const archivos = await getArchivosSemana()
  expect(archivos.map((a) => a.clave)).toEqual(ARCHIVOS.map((a) => a.clave))

  const acr = archivos.find((a) => a.clave === 'acr')
  expect(acr).toMatchObject({ total: 3, nombre: '11-11-2026_Llenadora.xlsx', estado: 'actual' })
  expect(archivos.find((a) => a.clave === 'consolidado').estado).toBe('sin_actualizar')
  expect(archivos.find((a) => a.clave === 'avisos').nombre).toBe('HISTORICO_AVISOS.xlsx')
})
