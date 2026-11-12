import { describe, it, expect, vi, beforeEach } from 'vitest'
import planSemanal from './__fixtures__/plan_semanal.json'
import alertas from './__fixtures__/alertas.json'

// Salidas reales del motor (semana 2026-W46, con paradas y decisiones de ejemplo).
vi.mock('../api/motor.js', () => ({
  getPlanSemanal: vi.fn(async () => planSemanal),
  getAlertas: vi.fn(async () => alertas),
  getMotorEstado: vi.fn(async () => ({ en_cola: false })),
  listarParadas: vi.fn(async () => [
    {
      id_parada: 'PAR-2026-11-11-01', titulo: 'Cambio de formato 600 ml', modalidad: 'Frío', fecha: '2026-11-11',
      inicio: '05:00', fin: '08:00', maquinas: ['Llenadora', 'Empacadora'],
      tareas_manuales: [{ Maquina: 'Llenadora', Sistema: 'Sistema de Conjunto de llenado', Id_componente: 'LLE-001', Componente: 'Válvula de llenado', Tipo_tarea: 'Preventiva', Tarea: 'Revisar empaques de moneda en 10 válvulas' }],
    },
    { id_parada: 'PAR-2026-11-14-01', titulo: 'Limpieza fin de semana', modalidad: 'Frío', fecha: '2026-11-14', inicio: '06:00', fin: '14:00', maquinas: ['Toda la línea'], tareas_manuales: [] },
  ]),
  getArchivosMotor: vi.fn(async () => ({ vigentes: { avisos: { id: 1, nombre_archivo: 'a.xlsx', subido_en: '2026-11-08T10:00:00' } } })),
}))

const svc = await import('./mantenimientoService.js')
const LUNES = '2026-11-09'

describe('mantenimientoService con salidas reales del motor', () => {
  beforeEach(async () => { await svc.getParadasSemana({ startISO: LUNES }) })

  it('el carrusel recibe como máximo las 5 alertas destacadas', async () => {
    const a = await svc.getAlertasSemana(LUNES)
    expect(a.length).toBeLessThanOrEqual(5)
    expect(a.length).toBe(alertas.alertas.filter((x) => x.Mostrar).length)
    a.forEach((x) => expect(x.mensaje).toBeTruthy())
  })

  it('el plan sugerido no trae tareas manuales ni órdenes por verificar', async () => {
    const plan = await svc.getPlanSugerido(LUNES)
    expect(plan.length).toBeGreaterThan(0)
    const tareasUsuario = new Set(planSemanal.versiones.fusion.tareas_sugeridas
      .filter((t) => t.Origen === 'Registrada por el usuario').map((t) => t.Id_tarea))
    plan.forEach((p) => {
      expect(tareasUsuario.has(p.id)).toBe(false)
      expect(['Alta', 'Media', 'Baja']).toContain(p.prioridad)
      expect(p.claseOrden).toMatch(/^ZF/)
    })
  })

  it('las tareas sugeridas son órdenes SAP agrupadas y sin las "por verificar"', async () => {
    const tareas = await svc.getTareasSugeridas(LUNES)
    const verificar = new Set(planSemanal.versiones.fusion.tareas_sugeridas
      .filter((t) => String(t.Estado).startsWith('Verificar')).map((t) => t.Id_tarea))
    tareas.forEach((t) => {
      expect(t.id.startsWith('OT-')).toBe(true)
      t.idsMotor.forEach((id) => expect(verificar.has(id)).toBe(false))
    })
  })

  it('una parada solo trae sus tareas manuales y las que el usuario envió', async () => {
    const paradas = await svc.getParadasSemana({ startISO: LUNES })
    const cambio = paradas.find((p) => p.id === 'PAR-2026-11-11-01')
    expect(cambio.tareasDetalle.map((t) => t.descripcion)).toContain('Revisar empaques de moneda en 10 válvulas')
    const enviadas = planSemanal.versiones.fusion.tareas_sugeridas
      .filter((t) => t.Id_parada === 'PAR-2026-11-14-01' && t.Estado === 'Enviada a la parada' && t.Origen !== 'Registrada por el usuario')
    const limpieza = paradas.find((p) => p.id === 'PAR-2026-11-14-01')
    expect(limpieza.tareasDetalle.length).toBe(enviadas.length)
    expect(limpieza.maquinas).toEqual(['Llenadora', 'Empacadora', 'Paletizadora', 'Envolvedora'])
  })
})
