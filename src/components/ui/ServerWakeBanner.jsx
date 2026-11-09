import { useEffect, useRef, useState } from 'react'

const HIDE_MS = 300

/**
 * Aviso flotante para el arranque en frío de Render.
 *
 * client.js emite `kof:slow-api` cuando una petición supera los 4 s y
 * `kof:api-ready` cuando termina la última petición lenta. La entrada/salida se
 * hace con keyframes CSS para mantener la animación en transform/opacity.
 */
export default function ServerWakeBanner() {
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const visibleRef = useRef(false)
  const hideTimer = useRef(null)

  useEffect(() => {
    const cancelHide = () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current)
        hideTimer.current = null
      }
    }

    const onSlow = () => {
      cancelHide()
      visibleRef.current = true
      setLeaving(false)
      setVisible(true)
    }

    const onReady = () => {
      if (!visibleRef.current) return
      cancelHide()
      visibleRef.current = false
      setLeaving(true)
      hideTimer.current = setTimeout(() => {
        setVisible(false)
        setLeaving(false)
        hideTimer.current = null
      }, HIDE_MS)
    }

    window.addEventListener('kof:slow-api', onSlow)
    window.addEventListener('kof:api-ready', onReady)
    return () => {
      cancelHide()
      window.removeEventListener('kof:slow-api', onSlow)
      window.removeEventListener('kof:api-ready', onReady)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-5 z-[70] flex justify-center px-4"
      role="status"
      aria-live="polite"
    >
      <div
        className={`flex max-w-xl items-start gap-3 rounded-2xl bg-ink-900/95 px-4 py-3.5 text-white shadow-xl shadow-ink-900/25 ring-1 ring-white/10 backdrop-blur ${
          leaving ? 'kof-wake-out' : 'kof-wake-in'
        }`}
      >
        <span className="relative mt-0.5 flex size-2.5 shrink-0" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-tertiary-400 opacity-70" />
          <span className="relative inline-flex size-2.5 rounded-full bg-tertiary-500" />
        </span>
        <p className="text-sm font-medium leading-snug">
          Conectando con el servidor… la primera carga puede tardar hasta un minuto
        </p>
      </div>
    </div>
  )
}
