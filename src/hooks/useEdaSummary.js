import { useCallback, useEffect, useState } from 'react'
import { apiGet } from '../api/client.js'
import { normalizeSummary, rangeParams } from '../api/edaAdapter.js'
import { ALL_GROUP } from '../api/machines.js'

const ENDPOINT = '/eda/summary'

/**
 * El dashboard muestra dos cosas a la vez:
 *   - `ctx`: toda la línea, sin importar el filtro de máquinas. Alimenta las gráficas
 *     de contexto (paros por equipo, minutos, turno, dispersión y MTBF).
 *   - `sel`: la selección del filtro. Alimenta los KPIs y las tres gráficas de enfoque
 *     (top de fallas, duración promedio y evolución).
 * Cuando el filtro es "todas" ambas coinciden y se hace una sola petición.
 */
export function useEdaSummary(range, machineFilter) {
  const [state, setState] = useState({ ctx: null, sel: null, loading: true, error: null })
  const [nonce, setNonce] = useState(0)

  const { start, end } = range
  const shared = machineFilter === ALL_GROUP

  useEffect(() => {
    const controller = new AbortController()
    let alive = true
    const opts = { signal: controller.signal }
    const params = rangeParams(range)

    setState((s) => ({ ...s, loading: true, error: null }))

    const ctx = apiGet(ENDPOINT, params, opts).then(normalizeSummary)
    const sel = shared ? ctx : apiGet(ENDPOINT, { ...params, machines: machineFilter }, opts).then(normalizeSummary)

    Promise.all([ctx, sel])
      .then(([c, s]) => alive && setState({ ctx: c, sel: s, loading: false, error: null }))
      .catch((err) => {
        if (err.name !== 'AbortError' && alive) setState({ ctx: null, sel: null, loading: false, error: err })
      })

    return () => {
      alive = false
      controller.abort()
    }
  }, [start, end, machineFilter, shared, nonce]) // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = useCallback(() => setNonce((n) => n + 1), [])

  return { ...state, refresh }
}