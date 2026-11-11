import { useCallback, useEffect, useRef, useState } from 'react'
import { clearApiCache } from '../api/client.js'
import { getMotorEstado } from '../api/motor.js'

const INTERVALO_MS = 3000

/**
 * Sigue una corrida del motor. `marcarCalculando()` se llama después de una acción que
 * encola una corrida (subir archivo, decidir, editar parada, recibir un 202). Mientras
 * `calculando` sea true se consulta /motor/estado cada 3 s; al terminar en ok se limpia la
 * caché y se llama `recargar()`; si termina en error se expone el mensaje.
 */
export default function useMotorEstado(recargar) {
  const [calculando, setCalculando] = useState(false)
  const [error, setError] = useState(null)
  const recargarRef = useRef(recargar)

  useEffect(() => {
    recargarRef.current = recargar
  }, [recargar])

  const marcarCalculando = useCallback(() => {
    setError(null)
    setCalculando(true)
  }, [])

  useEffect(() => {
    if (!calculando) return undefined
    let activo = true
    let enCurso = false
    const controller = new AbortController()

    const consultar = async () => {
      if (enCurso) return
      enCurso = true
      try {
        const estado = await getMotorEstado({ signal: controller.signal })
        if (!activo) return
        const status = estado?.run?.status
        const pendientes = Number(estado?.pendientes ?? 0)
        if (pendientes > 0 || estado?.en_cola) return
        if (status === 'ok') {
          setCalculando(false)
          clearApiCache()
          recargarRef.current?.()
        } else if (status === 'error') {
          setCalculando(false)
          setError(estado?.run?.error || 'El motor terminó con un error.')
        } else if (!status) {
          setCalculando(false)
        }
      } catch {
        // Un fallo de red puntual no detiene el seguimiento: se reintenta en el próximo ciclo.
      } finally {
        enCurso = false
      }
    }

    consultar()
    const timer = setInterval(consultar, INTERVALO_MS)
    return () => {
      activo = false
      controller.abort()
      clearInterval(timer)
    }
  }, [calculando])

  return { calculando, error, marcarCalculando }
}
