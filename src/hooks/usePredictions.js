import { useCallback, useEffect, useState } from 'react'

import { fetchPredictions } from '../api/predictions.js'

/**
 * Matriz predictiva. `hasta` (YYYY-MM-DD) pide una reconstrucción al corte:
 * toda la matriz se recalcula con los datos disponibles hasta esa fecha.
 * Sin `hasta`, devuelve el resultado de la última ejecución del motor.
 */
export function usePredictions(hasta = null) {
  const [state, setState] = useState({ data: null, loading: true, error: null })
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let alive = true
    setState((s) => ({ ...s, loading: true }))
    fetchPredictions({ hasta })
      .then((data) => alive && setState({ data, loading: false, error: null }))
      .catch((err) => alive && setState({ data: null, loading: false, error: err }))
    return () => { alive = false }
  }, [hasta, nonce])

  const refresh = useCallback(() => setNonce((n) => n + 1), [])

  return { ...state, refresh }
}