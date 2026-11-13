import { afterEach, beforeEach, expect, it, vi } from 'vitest'

const registro = vi.hoisted(() => ({ textos: [], heads: [], guardado: null }))

vi.mock('jspdf', () => {
  class FakePdf {
    constructor() {
      this.internal = { pageSize: { getWidth: () => 595, getHeight: () => 842 }, getNumberOfPages: () => 1 }
      // Métodos encadenables de jsPDF que no interesan a la prueba.
      for (const m of ['setFont', 'setFontSize', 'setTextColor', 'setDrawColor', 'setFillColor', 'setLineWidth', 'line', 'roundedRect', 'addPage', 'setPage', 'addImage']) {
        this[m] = () => this
      }
    }
    text(t) { registro.textos.push([].concat(t).join(' ')); return this }
    splitTextToSize(t) { return [t] }
    save(nombre) { registro.guardado = nombre }
  }
  return { default: FakePdf }
})

vi.mock('jspdf-autotable', () => ({
  default: vi.fn((doc, opts) => {
    registro.heads.push(opts.head[0].join('|'))
    doc.lastAutoTable = { finalY: (opts.startY ?? 0) + 40 }
  }),
}))

import { exportAntecedentesComponentePdf } from './exportHistoriaPdf.js'

const componente = { nombre: 'Válvula de llenado', maquina: 'Llenadora', sistema: 'Sistema de llenado', id: 'LLE-001' }
const indicadores = [{ label: 'Eventos', value: '12' }, { label: 'MTBF mediano', value: 'Pocos datos' }]
const base = {
  fallasMayores: { n: 1, minutos: 95, lista: [{ fecha: '2026-10-02', minutos: 95, causaFalla: 'Desgaste', causaAltoTiempo: 'Repuesto', detalle: 'Fuga' }] },
  acr: [],
  repuestoCritico: { nivel: 'Alto', motivo: 'Sin stock en planta' },
  prePost: [],
}

beforeEach(() => {
  registro.textos = []; registro.heads = []; registro.guardado = null
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 10, 12, 10, 30))
})
afterEach(() => vi.useRealTimers())

it('nombra el archivo Antecedentes_<Maquina>_<Componente>_<fecha> e incluye ACR solo cuando existen', async () => {
  // Con ACR: aparece la sección y la tabla de acciones.
  const conAcr = {
    ...base,
    acr: [{
      fecha: '2026-09-15', falla: 'Fuga en válvula', duracionMin: 180, causaRaiz: 'Junta fuera de especificación', nota: '', archivo: '15-09-2026_Llenadora.xlsx',
      acciones: [
        { actividad: 'Cambiar proveedor de juntas', responsable: 'Mantenimiento', fechaFin: '2026-10-01', estado: 'Fecha cumplida sin cierre registrado', vencida: true },
        { actividad: 'Capacitar al turno', responsable: 'Producción', fechaFin: '2026-12-01', estado: 'En plazo', vencida: false },
      ],
    }],
  }
  const nombre = await exportAntecedentesComponentePdf(componente, indicadores, conAcr)
  expect(nombre).toBe('Antecedentes_Llenadora_Valvula_de_llenado_2026-11-12.pdf')
  expect(registro.guardado).toBe(nombre)
  expect(registro.textos.some((t) => t.includes('Análisis de causa raíz (ACR)'))).toBe(true)
  expect(registro.heads).toContain('Actividad|Responsable|Fecha fin|Estado')
  expect(registro.textos.some((t) => t.includes('Antecedentes · Válvula de llenado'))).toBe(true)

  // Sin ACR: ni título ni tabla de acciones; el resto de secciones sigue.
  registro.textos = []; registro.heads = []
  await exportAntecedentesComponentePdf(componente, indicadores, base)
  expect(registro.textos.some((t) => t.includes('ACR'))).toBe(false)
  expect(registro.heads).not.toContain('Actividad|Responsable|Fecha fin|Estado')
  expect(registro.heads).toContain('Fecha|Minutos|Causa de falla|Causa de alto tiempo|Detalle')
  expect(registro.heads).toContain('Nivel|Motivo')
})
