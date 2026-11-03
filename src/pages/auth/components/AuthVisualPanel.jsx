import { useEffect, useRef, useState } from 'react'
import ccBearVideo from '../../../assets/CC-Bear.mp4'

export default function AuthVisualPanel() {
  const videoRef = useRef(null)
  const [isDesktop, setIsDesktop] = useState(false)
  const [canPlay, setCanPlay] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)

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

  useEffect(() => {
    if (!isDesktop || reduceMotion) return
    const video = videoRef.current
    if (!video) return
    const play = async () => {
      try {
        await video.play()
      } catch {
        // Autoplay blocked, keep paused on first frame
      }
    }
    if (video.readyState >= 2) {
      play()
    } else {
      video.addEventListener('loadeddata', play, { once: true })
      return () => video.removeEventListener('loadeddata', play)
    }
  }, [isDesktop, reduceMotion])

  useEffect(() => {
    if (typeof document === 'undefined') return
    const onVisibility = () => {
      const video = videoRef.current
      if (!video || !isDesktop) return
      if (document.hidden || reduceMotion) {
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
  }, [isDesktop, reduceMotion])

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[28px] bg-neutral-100">
      {isDesktop && (
        <video
          ref={videoRef}
          src={ccBearVideo}
          autoPlay={!reduceMotion}
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          tabIndex={-1}
          onCanPlay={() => setCanPlay(true)}
          className={`h-full w-full object-cover object-center transition-opacity duration-400 ${canPlay ? 'opacity-100' : 'opacity-0'}`}
          style={{ transitionDuration: '400ms' }}
        />
      )}
    </div>
  )
}
