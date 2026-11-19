import { describe, expect, it, vi } from 'vitest'

vi.mock('../api/motor.js', () => ({}))

const { cumplimientoSapPorMaquina } = await import('./ordenesSapCumplimiento.js')
const { avisaCoberturaParcial, evaluarCobertura } = await import('../utils/cobertura.js')

const ot = (n, maquina, fecha, estado) => ({ id: `OT-${n}`, orden: String(n), maquina, fecha, estado, tipo: 'Preventiva' })

describe('gráfica de órdenes SAP por máquina', () => {
  it('filtro semana: una fila por máquina con % ejecutadas/órdenes y conteos del tooltip', () => {
    const ordenes = [
      ot(1, 'Llenadora', '2026-11-16', 'Ejecutada'),
      ot(2, 'LLENADORA', '2026-11-17', 'Ejecutada'),
      ot(3, 'Llenadora', '2026-11-18', 'No ejecutada'),
      ot(4, 'Empacadora', '2026-11-19', 'Abierta'),
    ]
    const filas = cumplimientoSapPorMaquina(ordenes, { porSemana: false })
    expect(filas).toEqual([
      { semana: null, maquina: 'Empacadora', cumplimiento: 0, ordenes: 1, ejecutadas: 0, noEjecutadas: 0, abiertas: 1 },
      { semana: null, maquina: 'Llenadora', cumplimiento: 67, ordenes: 3, ejecutadas: 2, noEjecutadas: 1, abiertas: 0 },
    ])
  })

  it('filtro mes: una fila por semana ISO y máquina, ordenadas por fecha', () => {
    const ordenes = [
      ot(1, 'Paletizadora', '2026-11-16', 'Ejecutada'), // Sem 47
      ot(2, 'Paletizadora', '2026-11-22', 'Abierta'), // Sem 47 (domingo)
      ot(3, 'Paletizadora', '2026-11-02', 'Ejecutada'), // Sem 45
      ot(4, 'Envolvedora', '2026-11-03', 'No ejecutada'), // Sem 45
      ot(5, 'Envolvedora', null, 'Ejecutada'), // sin fecha: no cae en ninguna semana
    ]
    const filas = cumplimientoSapPorMaquina(ordenes, { porSemana: true })
    expect(filas).toEqual([
      { semana: 'Sem 45', maquina: 'Envolvedora', cumplimiento: 0, ordenes: 1, ejecutadas: 0, noEjecutadas: 1, abiertas: 0 },
      { semana: 'Sem 45', maquina: 'Paletizadora', cumplimiento: 100, ordenes: 1, ejecutadas: 1, noEjecutadas: 0, abiertas: 0 },
      { semana: 'Sem 47', maquina: 'Paletizadora', cumplimiento: 50, ordenes: 2, ejecutadas: 1, noEjecutadas: 0, abiertas: 1 },
    ])
  })
})

describe('aviso de cobertura parcial', () => {
  const fuente = { primer_dato: '2026-01-01', ultimo_dato: '2026-11-18' }

  it('la fuente "paradas" nunca produce aviso parcial; las demás sí', () => {
    const ev = evaluarCobertura(fuente, '2026-11-16', '2026-11-22')
    expect(ev.estado).toBe('parcial')
    expect(avisaCoberturaParcial('paradas', ev)).toBe(false)
    for (const f of ['reporte_diario', 'fallas_historia', 'eventos_historia', 'ordenes_sap', 'avisos', 'cumplimiento_sap', 'predicciones']) {
      expect(avisaCoberturaParcial(f, ev)).toBe(true)
    }
    expect(avisaCoberturaParcial('ordenes_sap', evaluarCobertura(fuente, '2026-11-02', '2026-11-08'))).toBe(false)
  })
})
