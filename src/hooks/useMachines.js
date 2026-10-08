import { useEffect, useState } from 'react'
import { fetchMachines } from '../api/machines.js'

export function useMachines() {
  const [state, setState] = useState({ machines: [], loading: true, error: null })

  useEffect(() => {
    let alive = true
    fetchMachines()
      .then((rows) => alive && setState({ machines: rows, loading: false, error: null }))
      .catch((err) => alive && setState({ machines: [], loading: false, error: err }))
    return () => {
      alive = false
    }
  }, [])

  return state
}