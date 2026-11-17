import { beforeEach, expect, it, vi } from 'vitest'

import { getParadasSemana, getPlanSugerido } from '../services/mantenimientoService.js'
import { cargarProximaIntervencion, contarUrgentes, textoRelativo } from './useProximaIntervencion.js'

vi.mock('../services/mantenimientoService.js', () => ({
  getParadasSemana: vi.fn(),
  getPlanSugerido: vi.fn(),
  leerCacheSemana: vi.fn(() => null),
  leerEstadoPlan: vi.fn(() => null),
  suscribirEstadoPlan: vi.fn(() => () => {}),
  semanaISO: vi.fn(() => '2026-W47'),
}))

// Miércoles 18 nov 2026, 10:00 (hora de Colombia). Semana: lun 16 – dom 22.
const AHORA = { fecha: '2026-11-18', hora: '10:00' }
const parada = (id, fecha, horaInicio) => ({ id, fecha, horaInicio, horaFin: '18:00', tareasDetalle: [] })

beforeEach(() => {
  vi.mocked(getParadasSemana).mockReset()
  vi.mocked(getPlanSugerido).mockReset().mockResolvedValue([])
})

it('elige la parada más cercana posterior a ahora e ignora las ya pasadas', async () => {
  vi.mocked(getParadasSemana).mockResolvedValue([
    parada('jue', '2026-11-19', '06:00'),
    parada('ayer', '2026-11-17', '14:00'),
    parada('hoy-tarde', '2026-11-18', '14:00'),
    parada('hoy-temprano', '2026-11-18', '06:00'),
  ])

  const res = await cargarProximaIntervencion(AHORA)

  expect(res.parada.id).toBe('hoy-tarde')
  expect(res.semanaInicio).toBe('2026-11-16')
  expect(getParadasSemana).toHaveBeenCalledTimes(1)
  expect(getParadasSemana).toHaveBeenCalledWith({ startISO: '2026-11-16' })
})

it('si la semana actual no tiene paradas futuras, toma la de la semana siguiente', async () => {
  vi.mocked(getParadasSemana).mockImplementation(async ({ startISO }) => (startISO === '2026-11-16'
    ? [parada('lunes', '2026-11-16', '06:00')]
    : [parada('mar-sig', '2026-11-24', '08:00'), parada('lun-sig', '2026-11-23', '14:00')]))

  const res = await cargarProximaIntervencion(AHORA)

  expect(getParadasSemana).toHaveBeenLastCalledWith({ startISO: '2026-11-23' })
  expect(res.parada.id).toBe('lun-sig')
  expect(res.semanaInicio).toBe('2026-11-23')
})

it('cuenta solo las tareas Crítica o Alta que no están en el calendario', async () => {
  const plan = [
    { _prioridadMotor: 'Crítica', enCalendario: false },
    { _prioridadMotor: 'Alta', enCalendario: false },
    { _prioridadMotor: 'Alta', enCalendario: true },
    { _prioridadMotor: 'Media', enCalendario: false },
    { _prioridadMotor: 'Baja', enCalendario: false },
  ]
  expect(contarUrgentes(plan)).toBe(2)

  vi.mocked(getParadasSemana).mockResolvedValue([])
  vi.mocked(getPlanSugerido).mockResolvedValue(plan)
  expect((await cargarProximaIntervencion(AHORA)).urgentesPendientes).toBe(2)
})

it('el texto relativo devuelve Hoy, Mañana o el día con fecha', () => {
  expect(textoRelativo('2026-11-17', '06:00', '2026-11-17')).toBe('Hoy, 06:00')
  expect(textoRelativo('2026-11-18', '14:00', '2026-11-17')).toBe('Mañana, 14:00')
  expect(textoRelativo('2026-11-19', '06:00', '2026-11-17')).toBe('Jue 19 nov, 06:00')
})
