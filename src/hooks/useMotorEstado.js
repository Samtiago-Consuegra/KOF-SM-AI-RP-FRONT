import { useEffect, useRef } from 'react'
import { clearApiCache } from '../api/client.js'
import { invalidar } from '../services/mantenimientoService.js'
import { estadoActual, suscribir } from '../services/motorEstadoStore.js'

/**
 * Escucha el vigilante único de /motor/estado (no sondea por su cuenta). Cuando una corrida
 * termina en ok, limpia las cachés (servicio y client.js) y avisa con onOk para refrescar en silencio.
 */
export function useMotorEstado(onOk) {
  const onOkRef = useRef(onOk)
  useEffect(() => { onOkRef.current = onOk }, [onOk])

  useEffect(() => {
    const inicial = estadoActual()?.run ?? null
    let previo = inicial ? { id: inicial.id, status: inicial.status } : undefined // undefined = sin lectura

    const revisar = (estado) => {
      const run = estado?.run ?? null
      if (!run) { if (previo === undefined) previo = null; return }
      const termino = run.status === 'ok' && previo !== undefined
        && (previo?.id !== run.id || previo?.status !== 'ok')
      previo = { id: run.id, status: run.status }
      if (termino) {
        invalidar()
        clearApiCache()
        onOkRef.current?.()
      }
    }

    return suscribir(revisar)
  }, [])
}
