import { useEffect, useRef, useState } from 'react'
import ccBearVideo from '../../../assets/CC-Bear-min.mp4'
import ccBearPoster from '../../../assets/CC-Bear-poster.webp'

// Deja que el login pinte y quede interactivo antes de pedir el video.
const IDLE_TIMEOUT = 1500
const IDLE_FALLBACK = 1200

export default function AuthVisualPanel() {
  const videoRef = useRef(null)
  const [isDesktop, setIsDesktop] = useState(false)
  const [canPlay, setCanPlay] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(min-width: 1024px)')
    const update = () => setIsDesktop(mq.matches)
    update()
    mq.addEventListener ? mq.addEventListener('change', update) : mq.addListener(update)
    return () => {
      mq.removeEventListener ? mq.removeEventListener('change', update) : mq.removeListener(update)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduceMotion(mq.matches)
    update()
    mq.addEventListener ? mq.addEventListener('change', update) : mq.addListener(update)
    return () => {
      mq.removeEventListener ? mq.removeEventListener('change', update) : mq.removeListener(update)
    }
  }, [])

  // El MP4 no compite con la primera pintura: se pide cuando el hilo principal
  // está libre. Si no hay requestIdleCallback, se usa un timeout corto.
  useEffect(() => {
    if (!isDesktop || reduceMotion) {
      setShouldLoadVideo(false)
      return
    }

    let cancelled = false
    let idleId = null
    let timeoutId = null

    const enable = () => {
      if (!cancelled) setShouldLoadVideo(true)
    }

    if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(enable, { timeout: IDLE_TIMEOUT })
    } else {
      timeoutId = setTimeout(enable, IDLE_FALLBACK)
    }

    return () => {
      cancelled = true
      if (idleId != null && typeof window !== 'undefined' && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId)
      }
      if (timeoutId != null) clearTimeout(timeoutId)
    }
  }, [isDesktop, reduceMotion])

  useEffect(() => {
    if (!shouldLoadVideo || reduceMotion) return
    const video = videoRef.current
    if (!video) return
    const play = async () => {
      try {
        await video.play()
      } catch {
        // Autoplay blocked, keep paused on the poster/first frame
      }
    }
    if (video.readyState >= 2) {
      play()
    } else {
      video.addEventListener('loadeddata', play, { once: true })
      return () => video.removeEventListener('loadeddata', play)
    }
  }, [shouldLoadVideo, reduceMotion])

  useEffect(() => {
    if (typeof document === 'undefined') return
    const onVisibility = () => {
      const video = videoRef.current
      if (!video || !isDesktop || !shouldLoadVideo || reduceMotion) return
      if (document.hidden) {
        try {
          video.pause()
        } catch {
          // ignore
        }
      } else {
        try {
          video.play().catch(() => {})
        } catch {
          // ignore
        }
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [isDesktop, shouldLoadVideo, reduceMotion])

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[28px] bg-neutral-100">
      {/* El poster cubre el primer pintado y es lo único visible con reduced motion. */}
      <img
        src={ccBearPoster}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover object-center"
        decoding="async"
      />

      {isDesktop && !reduceMotion && (
        <video
          ref={videoRef}
          src={shouldLoadVideo ? ccBearVideo : undefined}
          poster={ccBearPoster}
          preload="none"
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
          tabIndex={-1}
          onCanPlay={() => setCanPlay(true)}
          className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity ${canPlay ? 'opacity-100' : 'opacity-0'}`}
          style={{ transitionDuration: '400ms' }}
        />
      )}
    </div>
  )
}
