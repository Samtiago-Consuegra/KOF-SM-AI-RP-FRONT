// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react'

vi.mock('../services/ordenesSapCumplimiento.js', async (importOriginal) => ({
  ...(await importOriginal()),
  getOrdenesSapPeriodo: vi.fn(),
  cumplimientoSapPorMaquina: () => [{ maquina: 'Llenadora', cumplimiento: 50, ordenes: 2, ejecutadas: 1, noEjecutadas: 1, abiertas: 0 }],
  desgloseTipos: () => ({ Preventiva: 1, Correctiva: 1, Predictiva: 0 }),
  resumenOrdenes: () => ({}),
}))
vi.mock('../components/cumplimiento/ResumenSapCards.jsx', () => ({ default: () => null }))
vi.mock('../components/cumplimiento/OrdenesSapTable.jsx', () => ({ default: () => null }))
vi.mock('../components/mantenimiento/DetalleOrdenSapModal.jsx', () => ({ default: () => null }))

import { getOrdenesSapPeriodo } from '../services/ordenesSapCumplimiento.js'
import VistaOrdenesSap from '../components/cumplimiento/VistaOrdenesSap.jsx'

globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} }
window.matchMedia ??= () => ({ matches: true, addEventListener() {}, removeEventListener() {} })

afterEach(cleanup)

describe('Órdenes de SAP · ampliar gráfica', () => {
  it('muestra el botón de ampliar y abre el modal sin peticiones nuevas', async () => {
    getOrdenesSapPeriodo.mockResolvedValue({ ordenes: [{ id: 1 }] })
    render(<VistaOrdenesSap desde="2026-11-09" hasta="2026-11-15" maquina="todas" etiqueta="9 – 15 nov 2026" />)

    const boton = await screen.findByRole('button', { name: 'Ver en grande' })
    expect(getOrdenesSapPeriodo).toHaveBeenCalledTimes(1)

    fireEvent.click(boton)
    const modal = await screen.findByRole('dialog', { name: 'Cumplimiento de órdenes SAP' })
    expect(within(modal).getByText('9 – 15 nov 2026 · Todas las máquinas')).toBeTruthy()
    expect(within(modal).getByRole('list', { name: 'Órdenes por tipo' })).toBeTruthy()
    expect(getOrdenesSapPeriodo).toHaveBeenCalledTimes(1)
  })
})
