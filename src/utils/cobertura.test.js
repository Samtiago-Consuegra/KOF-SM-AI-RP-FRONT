import { describe, expect, it } from 'vitest'
import { evaluarCobertura, fmtFechaCobertura } from './cobertura.js'

const fuente = { primer_dato: '2025-01-10', ultimo_dato: '2026-09-22' }

describe('evaluarCobertura', () => {
  it('completo: periodo dentro de los datos', () => {
    const r = evaluarCobertura(fuente, '2026-03-01', '2026-03-31')
    expect(r.estado).toBe('completo')
    expect(r.sinDatosDesde).toBeNull()
  })

  it('parcial: periodo que cruza ultimoDato', () => {
    const r = evaluarCobertura(fuente, '2026-09-01', '2026-09-30')
    expect(r).toMatchObject({ estado: 'parcial', ultimoDato: '2026-09-22', sinDatosDesde: '2026-09-23' })
  })

  it('sin_datos: periodo posterior a ultimoDato, sinDatosDesde = día siguiente', () => {
    const r = evaluarCobertura(fuente, '2026-10-01', '2026-10-31')
    expect(r).toMatchObject({ estado: 'sin_datos', sinDatosDesde: '2026-09-23', sinDatosHasta: '2026-10-31' })
    expect(fmtFechaCobertura(r.sinDatosDesde)).toBe('23 sep 2026')
  })

  it('sin_datos: periodo anterior a primerDato', () => {
    const r = evaluarCobertura(fuente, '2024-12-01', '2024-12-31')
    expect(r).toMatchObject({ estado: 'sin_datos', primerDato: '2025-01-10' })
  })

  it('fuente sin datos', () => {
    const r = evaluarCobertura({ primer_dato: null, ultimo_dato: null }, '2026-01-01', '2026-01-31')
    expect(r).toMatchObject({ estado: 'sin_datos', primerDato: null, ultimoDato: null })
    expect(evaluarCobertura(undefined, '2026-01-01', '2026-01-31').estado).toBe('sin_datos')
  })
})
