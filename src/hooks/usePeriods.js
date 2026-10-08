import { useEffect, useState } from 'react'

import { fetchPeriods } from '../api/periods.js'

/**
 * Meses con paros registrados + límites reales de los datos.
 * Alimenta el dropdown de mes y los límites del calendario.
 */
export function usePeriods() {
  const [state, setState] = useState({ months: [], min: null, max: null })

  useEffect(() => {
    let alive = true
    fetchPeriods()
      .then((d) => {
        if (alive) setState({ months: d.months ?? [], min: d.min ?? null, max: d.max ?? null })
      })
      .catch(() => {})
    return () => { alive = false }
  }, [])

  return state
}