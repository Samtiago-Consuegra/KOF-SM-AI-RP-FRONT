import { describe, it, expect, vi, beforeEach } from 'vitest'
import planSemanal from './__fixtures__/plan_semanal.json'

// Paradas del backend SIN el campo ejecucion (back anterior): el adaptador debe asumir "propio".
vi.mock('../api/motor.js', () => ({
  getPlanSemanal: vi.fn(async () => planSemanal),
  getMotorEstado: vi.fn(async () => ({ en_cola: false })),
  listarParadas: vi.fn(async () => [
    { id_parada: 'PAR-2026-11-12-01', titulo: 'Cambio de rodillos', modalidad: 'Caliente', fecha: '2026-11-12',
      inicio: '14:00', fin: '16:00', maquinas: ['Paletizadora'], tareas_manuales: [] },
  ]),
  crearParada: vi.fn(async () => ({ id_parada: 'PAR-NUEVA-01' })),
  enviarDecision: vi.fn(async () => ({ ok: true })),
}))

const api = await import('../api/motor.js')
const svc = await import('./mantenimientoService.js')
const LUNES = '2026-11-09'
const ITEM = 'REC-PAL-046' // sugerida en PAR-2026-11-12-01, 14:00–16:00, Caliente, Con_contratista false

async function cargarSemana() {
  await svc.getParadasSemana({ startISO: LUNES })
  return svc.getPlanSugerido(LUNES)
}

describe('Ejecución y día elegido al enviar paradas', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('el adaptador entrega "propio" cuando el backend no trae el campo', async () => {
    const paradas = await svc.getParadasSemana({ startISO: LUNES })
    expect(paradas[0].ejecucion).toBe('propio')
    const plan = await svc.getPlanSugerido(LUNES)
    const item = plan.find((p) => p.id === ITEM)
    expect(item.parada).toMatchObject({ fecha: '2026-11-12', condicion: 'caliente', ejecucion: 'propio' })
    expect(item.conContratista).toBe(false)
  })

  it('si cambia el día crea una parada nueva con la fecha elegida (no la de hoy) y envía la tarea a ella', async () => {
    await cargarSemana()
    const hoy = new Date().toISOString().slice(0, 10)
    await svc.enviarPlanACalendario(ITEM, { fecha: '2026-11-13', horaInicio: '14:00', horaFin: '16:00', condicion: 'caliente', ejecucion: 'propio' })
    expect(api.crearParada).toHaveBeenCalledTimes(1)
    const cuerpo = api.crearParada.mock.calls[0][0]
    expect(cuerpo).toMatchObject({ Fecha: '2026-11-13', Inicio: '14:00', Fin: '16:00', Modalidad: 'Caliente', Ejecucion: 'propio' })
    expect(cuerpo.Fecha).not.toBe(hoy)
    expect(api.enviarDecision).toHaveBeenCalledWith(expect.objectContaining({ Id_tarea: ITEM, Id_parada: 'PAR-NUEVA-01' }))
  })

  it('si no cambia nada envía la tarea a la parada sugerida sin crear otra', async () => {
    await cargarSemana()
    await svc.enviarPlanACalendario(ITEM, { fecha: '2026-11-12', horaInicio: '14:00', horaFin: '16:00', condicion: 'caliente', ejecucion: 'propio' })
    expect(api.crearParada).not.toHaveBeenCalled()
    expect(api.enviarDecision).toHaveBeenCalledWith(expect.objectContaining({ Id_tarea: ITEM, Id_parada: 'PAR-2026-11-12-01' }))
  })

  it('programarParada envía Ejecucion "contratista" cuando se elige', async () => {
    await cargarSemana()
    await svc.programarParada({
      titulo: 'Cambio de banda', fecha: '2026-11-10', horaInicio: '08:00', horaFin: '10:00', condicion: 'frio',
      ejecucion: 'contratista', maquinas: ['Envolvedora'],
      tareasDetalle: [{ maquina: 'Envolvedora', sistema: '', componente: 'Banda', tipo: 'Correctiva', descripcion: 'Cambiar banda' }],
    })
    expect(api.crearParada).toHaveBeenCalledWith(expect.objectContaining({ Ejecucion: 'contratista', Fecha: '2026-11-10' }))
  })
})
