// @vitest-environment jsdom
import { expect, it, vi } from 'vitest'
import { createElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { renderHook } from '@testing-library/react'

import { getWeekList } from '../utils/weeks.js'
import { useMantenimientoWeek } from './useMantenimientoWeek.js'

vi.mock('../utils/weeks.js', async (importOriginal) => {
  const real = await importOriginal()
  return { ...real, getWeekList: vi.fn(real.getWeekList) }
})

it('calcula la lista de semanas una sola vez y week conserva la referencia entre renders', () => {
  const { result, rerender } = renderHook(() => useMantenimientoWeek(), { wrapper: ({ children }) => createElement(MemoryRouter, null, children) })
  const { week, weeks } = result.current

  rerender()
  rerender()
  rerender()

  expect(getWeekList).toHaveBeenCalledTimes(1)
  expect(getWeekList).toHaveBeenCalledWith(52, 1)
  expect(result.current.weeks).toBe(weeks)
  expect(result.current.week).toBe(week)
})
