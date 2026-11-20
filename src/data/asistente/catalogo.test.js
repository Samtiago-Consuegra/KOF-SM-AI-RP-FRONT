import { describe, expect, it, vi } from 'vitest'
import { getParadasSemana } from '../../services/mantenimientoService.js'
import { responder } from './helpers.js'
import { VISTAS_CATALOGO } from './index.js'
import dashboard from './dashboard.js'
import predicciones from './predicciones.js'
import mantenimiento from './mantenimiento.js'
import cumplimiento from './cumplimiento.js'
import historiaClinica from './historiaClinica.js'
import historialExcel from './historialExcel.js'

// Servicio vacío: sin caché de la semana y sin paradas.
vi.mock('../../services/mantenimientoService.js', () => ({
  leerCacheSemana: vi.fn(() => null),
  getParadasSemana: vi.fn(async () => []),
}))

const CATALOGOS = [dashboard, predicciones, mantenimiento, cumplimiento, historiaClinica, historialExcel]

describe('catálogo del asistente', () => {
  it('hay un catálogo por cada vista que carga el asistente', () => {
    expect(CATALOGOS.map((c) => c.vista).sort()).toEqual([...VISTAS_CATALOGO].sort())
  })

  it.each(CATALOGOS.map((c) => [c.vista, c]))('%s: 6 a 8 preguntas con datos y al menos una explicación por sección', (_, c) => {
    const vista = c.preguntas.filter((p) => p.grupo === 'vista')
    expect(vista.length).toBeGreaterThanOrEqual(6)
    expect(vista.length).toBeLessThanOrEqual(8)
    vista.forEach((p) => expect(typeof p.respuesta).toBe('function'))

    const explicar = c.preguntas.filter((p) => p.grupo === 'explicar')
    c.secciones.forEach((s) => expect(explicar.some((p) => p.seccion === s), `sección sin explicación: ${s}`).toBe(true))
    explicar.forEach((p) => {
      expect(c.secciones).toContain(p.seccion)
      expect(p.respuesta).toEqual({ queEs: expect.any(String), comoSeCalcula: expect.any(String), origen: expect.any(String) })
    })
  })

  it('todos los ids son únicos', () => {
    const ids = CATALOGOS.flatMap((c) => c.preguntas.map((p) => p.id))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('las relacionadas apuntan a preguntas existentes de la misma vista', () => {
    CATALOGOS.forEach((c) => {
      const ids = new Set(c.preguntas.map((p) => p.id))
      c.preguntas.forEach((p) => p.relacionadas.forEach((r) => expect(ids.has(r), `${p.id} → ${r}`).toBe(true)))
    })
  })

  it('una respuesta con datos dice "sin datos" cuando el servicio responde vacío', async () => {
    const pregunta = mantenimiento.preguntas.find((p) => p.id === 'man-paradas')
    const { contenido } = await responder(pregunta, { datos: {} })
    expect(contenido).toBe('No hay paradas programadas esta semana.')
    // No cambia la semana con la que la vista envía decisiones.
    expect(getParadasSemana).toHaveBeenCalledWith(expect.objectContaining({ fijarVista: false }))
  })
})
