import { useCallback, useEffect, useState } from 'react'

import { fetchPeriods } from '../api/periods.js'

/**
 * Meses con paros registrados + límites reales de los datos.
 * Alimenta el dropdown de mes y los límites del calendario.
 */
export function usePeriods() {
  const [state, setState] = useState({ months: [], min: null, max: null, loading: true })
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let alive = true
    setState((s) => ({ ...s, loading: true }))
    fetchPeriods()
      .then((d) => {
        if (alive) {
          setState({
            months: d.months ?? [],
            min: d.min ?? null,
            max: d.max ?? null,
            loading: false,
          })
        }
      })
      .catch(() => {
        if (alive) setState((s) => ({ ...s, loading: false }))
      })
    return () => { alive = false }
  }, [nonce])

  const refresh = useCallback(() => setNonce((n) => n + 1), [])

  return { ...state, refresh }
}
