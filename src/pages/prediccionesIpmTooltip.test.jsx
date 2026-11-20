// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../hooks/useMachines.js', () => ({ useMachines: () => ({ machines: [] }) }))
vi.mock('../hooks/usePeriods.js', () => ({ usePeriods: () => ({ months: [], min: null, max: null, loading: false, refresh() {} }) }))
vi.mock('../hooks/usePredictions.js', () => ({ usePredictions: () => ({ data: { available: true, rows: [], meta: {} }, loading: false, error: null, refresh() {} }) }))
vi.mock('../context/ToastContext.jsx', () => ({ useToast: () => ({ success() {}, error() {}, info() {} }) }))

import Predicciones from './Predicciones.jsx'

globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} }
window.matchMedia ??= () => ({ matches: true, addEventListener() {}, removeEventListener() {} })

afterEach(cleanup)

const TEXTO = 'Índice de Prioridad de Mantenimiento: valor que clasifica la prioridad de atención del equipo con base en la frecuencia de fallas, el tiempo de paro, la recurrencia y la criticidad. A mayor valor, mayor prioridad'

describe('Predicciones · tooltip del encabezado IPM', () => {
  it('renderiza InfoTip junto a "IPM" y muestra el texto completo al enfocarlo', () => {
    render(<MemoryRouter><Predicciones /></MemoryRouter>)

    const th = screen.getAllByRole('columnheader').find((el) => el.textContent.trim() === 'IPM')
    expect(th).toBeTruthy()
    const icono = within(th).getByLabelText('¿Qué es el IPM?')

    fireEvent.focus(icono)
    const tip = screen.getByRole('tooltip')
    expect(tip.textContent).toContain(TEXTO)
  })
})
