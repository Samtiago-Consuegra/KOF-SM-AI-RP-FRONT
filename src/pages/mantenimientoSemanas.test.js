// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { createElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

import * as api from '../api/motor.js'
import Mantenimiento from './Mantenimiento.jsx'
import { MonthCalendar, hoyLocalISO } from '../components/ui/Calendar.jsx'
import { semanaISO } from '../services/mantenimientoService.js'
import { getWeekList } from '../utils/weeks.js'
import { monthKey } from '../utils/period.js'
import { addDays, fromISODate, toISODate } from '../utils/format.js'

vi.mock('../api/motor.js', async (importOriginal) => {
  const real = await importOriginal()
  const mocks = Object.fromEntries(Object.keys(real).map((k) => [k, vi.fn(async () => null)]))
  return {
    ...mocks,
    getMotorEstado: vi.fn(async () => ({ run: null, en_cola: false, pendientes: 0 })),
    getArchivosMotor: vi.fn(async () => ({ vigentes: {}, acr: [] })),
    getAlertas: vi.fn(async () => ({ alertas: [] })),
    getPlanSemanal: vi.fn(async (semana) => ({ semana, versiones: { fusion: { paradas: [], tareas_sugeridas: [] } } })),
    listarParadas: vi.fn(async () => []),
    getOrdenesSap: vi.fn(async ({ desde }) => ({
      ordenes: [
        { orden: '4001', maquina: 'Llenadora', fecha_programada: desde, tipo_orden: 'Preventiva', estado: 'Ejecutada', texto: 'Lubricar cadena de transporte' },
        { orden: '4002', maquina: 'Empacadora', fecha_programada: desde, tipo_orden: 'Correctiva', estado: 'No ejecutada', texto: 'Cambiar banda' },
      ],
      resumen: { total: 2 },
    })),
  }
})
vi.mock('../hooks/useMotorEstado.js', () => ({ useMotorEstado: () => {} }))

afterEach(cleanup)

it('navegar el calendario no vuelve a pedir la página; una semana pasada pide paradas y órdenes SAP sin plan-semanal', async () => {
  const weeks = getWeekList(52, 1)
  const actual = weeks.find((w) => w.isCurrent)
  const anterior = weeks[weeks.indexOf(actual) + 1]

  render(createElement(MemoryRouter, null, createElement(Mantenimiento)))

  await waitFor(() => {
    expect(api.getAlertas).toHaveBeenCalled()
    expect(api.getArchivosMotor).toHaveBeenCalled()
    expect(api.getPlanSemanal).toHaveBeenCalled()
  })
  const alertas = api.getAlertas.mock.calls.length
  const archivos = api.getArchivosMotor.mock.calls.length
  const planes = api.getPlanSemanal.mock.calls.length

  fireEvent.click(screen.getByRole('button', { name: 'Semana anterior' }))

  await screen.findAllByText('Lubricar cadena de transporte') // vista de escritorio y móvil
  expect(screen.getByText('Semana pasada: paradas registradas y órdenes de trabajo de SAP')).toBeTruthy()
  expect(api.listarParadas).toHaveBeenCalledWith({ desde: anterior.start, hasta: anterior.end })
  expect(api.getOrdenesSap).toHaveBeenCalledWith({ desde: anterior.start, hasta: anterior.end })
  // Alertas, archivos y plan (sugerencias) no se vuelven a pedir; plan-semanal nunca para la pasada.
  expect(api.getAlertas).toHaveBeenCalledTimes(alertas)
  expect(api.getArchivosMotor).toHaveBeenCalledTimes(archivos)
  expect(api.getPlanSemanal).toHaveBeenCalledTimes(planes)
  expect(api.getPlanSemanal.mock.calls.every(([s]) => s === semanaISO(actual.start))).toBe(true)
  expect(api.getAlertas.mock.calls.every(([s]) => s === semanaISO(actual.start))).toBe(true)

  // En la semana pasada no se puede programar.
  const programar = screen.getByRole('button', { name: /Programar parada/ })
  expect(programar.getAttribute('aria-disabled')).toBe('true')
  expect(programar.getAttribute('title')).toBe('No se puede programar en semanas pasadas')

  // Volver a hoy y a la semana pasada sale de la caché: ninguna petición nueva.
  const paradasPedidas = api.listarParadas.mock.calls.length
  fireEvent.click(screen.getByRole('button', { name: 'Ir a la semana actual' }))
  fireEvent.click(screen.getByRole('button', { name: 'Semana anterior' }))
  expect(screen.getAllByText('Lubricar cadena de transporte').length).toBeGreaterThan(0)
  expect(api.getOrdenesSap).toHaveBeenCalledTimes(1)
  expect(api.listarParadas).toHaveBeenCalledTimes(paradasPedidas)
  expect(api.getAlertas).toHaveBeenCalledTimes(alertas)
})

it('Calendar con minDate desactiva los días anteriores a hoy', () => {
  const hoy = hoyLocalISO()
  const ayer = toISODate(addDays(fromISODate(hoy), -1))

  // Mes de ayer: ayer (y todo lo anterior) desactivado.
  const { container, unmount } = render(createElement(MonthCalendar, {
    month: monthKey(fromISODate(ayer)), minDate: hoy, onChange: vi.fn(), onMonthChange: vi.fn(),
  }))
  const dias = [...container.querySelectorAll('[data-iso]')]
  expect(container.querySelector(`[data-iso="${ayer}"]`).getAttribute('aria-disabled')).toBe('true')
  dias.filter((b) => b.dataset.iso < hoy).forEach((b) => expect(b.getAttribute('aria-disabled')).toBe('true'))
  unmount()

  // Mes de hoy: hoy y los siguientes se pueden elegir; un clic en un día pasado no hace nada.
  const onChange = vi.fn()
  const { container: c2 } = render(createElement(MonthCalendar, {
    month: monthKey(fromISODate(hoy)), minDate: hoy, single: true, onChange, onMonthChange: vi.fn(),
  }))
  expect(c2.querySelector(`[data-iso="${hoy}"]`).getAttribute('aria-disabled')).toBeNull()
  const pasado = [...c2.querySelectorAll('[data-iso]')].find((b) => b.dataset.iso < hoy)
  if (pasado) { fireEvent.click(pasado); expect(onChange).not.toHaveBeenCalled() }
  fireEvent.click(c2.querySelector(`[data-iso="${hoy}"]`))
  expect(onChange).toHaveBeenCalledWith({ from: hoy, to: hoy })
})
