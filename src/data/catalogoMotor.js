// Catálogo máquina → sistema → componente que entrega el motor (GET /motor/catalogo).
// Tiene la MISMA forma que la jerarquía de ejemplo ({ [Maquina]: [{ id, nombre, componentes: [{ id, nombre }] }] })
// para que los formularios no cambien. Mientras el motor no responde se usa la jerarquía de ejemplo.
import { JERARQUIA as JERARQUIA_EJEMPLO } from './mock/historiaClinica.js'
import { getCatalogo } from '../api/motor.js'

export const JERARQUIA = { ...JERARQUIA_EJEMPLO }

let cargado = null

/** Carga el catálogo real una sola vez y reemplaza el contenido de JERARQUIA (mismo objeto). */
export function cargarCatalogo() {
  if (cargado) return cargado
  cargado = getCatalogo()
    .then((res) => {
      const maquinas = Array.isArray(res?.maquinas) ? res.maquinas : []
      if (!maquinas.length) return JERARQUIA
      Object.keys(JERARQUIA).forEach((k) => delete JERARQUIA[k])
      maquinas.forEach((m) => {
        JERARQUIA[m.Maquina] = (m.Sistemas || []).map((s) => ({
          id: s.Sistema,
          nombre: s.Sistema,
          componentes: (s.Componentes || []).map((c) => ({ id: c.Id_componente, nombre: c.Componente })),
        }))
      })
      return JERARQUIA
    })
    .catch(() => {
      cargado = null
      return JERARQUIA
    })
  return cargado
}
