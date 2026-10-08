import { apiGet } from './client.js'

// Igual que el catálogo de máquinas: cambia solo al subir un Excel nuevo,
// así que se resuelve una vez y se comparte entre las pantallas.
let pending = null

export function fetchPeriods() {
  if (!pending) {
    pending = apiGet('/eda/periodos').catch((err) => {
      pending = null
      throw err
    })
  }
  return pending
}

export function invalidatePeriods() {
  pending = null
}

/**
 * "2026-08" -> "Agosto de 2026". El backend ya devuelve los meses ordenados
 * con paros registrados, así que la lista no necesita filtros ni paginación.
 */
export function monthOptions(months) {
  return months.map((key) => {
    const [y, m] = key.split('-').map(Number)
    const s = new Date(y, m - 1, 1).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
    return { value: key, label: s.charAt(0).toUpperCase() + s.slice(1) }
  })
}