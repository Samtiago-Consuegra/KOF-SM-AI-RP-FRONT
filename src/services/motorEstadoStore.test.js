import { afterEach, expect, it, vi } from 'vitest'

import { getMotorEstado } from '../api/motor.js'
import { _reiniciar, esperarFin } from './motorEstadoStore.js'

vi.mock('../api/motor.js', () => ({ getMotorEstado: vi.fn() }))

afterEach(() => {
  _reiniciar()
  vi.useRealTimers()
})

it('comparte la petición, espera 2-4-8-10-10 s y se detiene cuando en_cola pasa a false', async () => {
  vi.useFakeTimers()
  let respuesta = { en_cola: true, run: { id: 7, status: 'en_proceso' } }
  getMotorEstado.mockImplementation(async () => respuesta)

  // Tres esperas simultáneas: una sola petición.
  const resueltas = []
  const esperas = [esperarFin(), esperarFin(), esperarFin()].map((p, i) => p.then(() => resueltas.push(i)))
  await vi.advanceTimersByTimeAsync(0)
  expect(getMotorEstado).toHaveBeenCalledTimes(1)

  // El intervalo crece 2 s → 4 s → 8 s → 10 s (tope) → 10 s; justo antes de cada umbral no hay petición.
  let llamadas = 1
  for (const intervalo of [2000, 4000, 8000, 10000, 10000]) {
    await vi.advanceTimersByTimeAsync(intervalo - 1)
    expect(getMotorEstado).toHaveBeenCalledTimes(llamadas)
    await vi.advanceTimersByTimeAsync(1)
    expect(getMotorEstado).toHaveBeenCalledTimes(++llamadas)
  }
  expect(resueltas).toEqual([])

  // en_cola pasa a false: las tres esperas terminan y el sondeo se detiene.
  respuesta = { en_cola: false, run: { id: 7, status: 'ok' } }
  await vi.advanceTimersByTimeAsync(10000)
  await Promise.all(esperas)
  expect(resueltas.sort()).toEqual([0, 1, 2])
  const total = getMotorEstado.mock.calls.length
  await vi.advanceTimersByTimeAsync(60000)
  expect(getMotorEstado).toHaveBeenCalledTimes(total)
})
