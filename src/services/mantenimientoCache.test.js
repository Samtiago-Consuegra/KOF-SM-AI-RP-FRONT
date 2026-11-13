import { expect, it, vi } from 'vitest'

import * as api from '../api/motor.js'
import { getParadasSemana, invalidar, leerCacheArchivos, leerCacheSemana } from './mantenimientoService.js'

vi.mock('../api/motor.js', () => ({
  listarParadas: vi.fn(async () => [{
    id_parada: 'PAR-2026-11-10-01', titulo: 'Parada Llenadora', modalidad: 'Frío', fecha: '2026-11-10',
    inicio: '06:00', fin: '14:00', maquinas: ['Llenadora'],
    tareas_manuales: [{ Maquina: 'Llenadora', Sistema: 'Llenado', Componente: 'Válvula', Tipo_tarea: 'Preventiva', Tarea: 'Cambiar juntas' }],
  }]),
  getPlanSemanal: vi.fn(async () => ({ semana: '2026-W46', versiones: { fusion: { paradas: [], tareas_sugeridas: [] } } })),
  getMotorEstado: vi.fn(async () => ({ en_cola: false })),
}))

it('guarda las paradas de la semana en caché, las lee sin peticiones y invalidar() la vacía', async () => {
  const start = '2026-11-09'
  expect(leerCacheSemana(start)).toBeNull()

  const paradas = await getParadasSemana({ startISO: start })
  expect(paradas).toHaveLength(1)
  const llamadasLista = api.listarParadas.mock.calls.length
  const llamadasPlan = api.getPlanSemanal.mock.calls.length

  const cache = leerCacheSemana(start)
  expect(cache.paradas).toEqual(paradas)
  expect(typeof cache.guardadoEn).toBe('number')
  // Cualquier día de la misma semana ISO apunta a la misma entrada.
  expect(leerCacheSemana('2026-11-12').paradas).toEqual(paradas)
  expect(api.listarParadas).toHaveBeenCalledTimes(llamadasLista)
  expect(api.getPlanSemanal).toHaveBeenCalledTimes(llamadasPlan)

  invalidar()
  expect(leerCacheSemana(start)).toBeNull()
  expect(leerCacheArchivos()).toBeNull()
})
