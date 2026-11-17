// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import ProximaIntervencionCard from '../components/dashboard/ProximaIntervencionCard.jsx'

vi.mock('../hooks/useProximaIntervencion.js', async (importOriginal) => ({
  ...(await importOriginal()),
  useProximaIntervencion: () => ({
    loading: true, calculando: false, sinDatosMotor: false, mensaje: null,
    parada: null, urgentesPendientes: 0, semanaInicio: null, hoy: '2026-11-17',
  }),
}))

afterEach(cleanup)

it('"Planes de mantenimiento" muestra "Toda la Línea 4" como subtítulo de texto, separado del título', () => {
  render(<MemoryRouter><ProximaIntervencionCard /></MemoryRouter>)

  const titulo = screen.getByRole('heading', { name: 'Planes de mantenimiento' })
  const subtitulo = screen.getByText('Toda la Línea 4')

  expect(titulo.contains(subtitulo)).toBe(false)
  expect(subtitulo.tagName).toBe('P')
  expect(subtitulo.className).toContain('text-xs')
  expect(subtitulo.className).toContain('whitespace-nowrap')
  expect(subtitulo.className).not.toMatch(/rounded|bg-|border/)
  // Mismo contenedor de texto que el título: queda alineado con él, no con el icono.
  expect(subtitulo.parentElement).toBe(titulo.parentElement)
})
