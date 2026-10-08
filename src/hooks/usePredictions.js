import { useCallback, useEffect, useState } from 'react'

import { fetchPredictions } from '../api/predictions.js'

/** Matriz predictiva del último cálculo del motor. Se recarga tras una subida. */
export function usePredictions() {
  const [state, setState] = useState({ data: null, loading: true, error: null })
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let alive = true
    fetchPredictions()
      .then((data) => alive && setState({ data, loading: false, error: null }))
      .catch((err) => alive && setState({ data: null, loading: false, error: err }))
    return () => { alive = false }
  }, [nonce])

  const refresh = useCallback(() => setNonce((n) => n + 1), [])

  return { ...state, refresh }
}