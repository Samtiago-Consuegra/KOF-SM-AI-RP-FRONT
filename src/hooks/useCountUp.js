import { useEffect, useRef, useState } from 'react'

// Cuenta hasta `end`; la primera vez desde 0 y después desde el valor anterior.
export default function useCountUp(end, duration = 800) {
  const [value, setValue] = useState(0)
  const [reduceMotion, setReduceMotion] = useState(false)
  const current = useRef(0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduceMotion(mq.matches)
    const handler = (e) => setReduceMotion(e.matches)
    mq.addEventListener ? mq.addEventListener('change', handler) : mq.addListener(handler)
    return () => {
      mq.removeEventListener ? mq.removeEventListener('change', handler) : mq.removeListener(handler)
    }
  }, [])

  useEffect(() => {
    const target = end || 0
    if (reduceMotion) {
      current.current = target
      setValue(target)
      return
    }
    const start = current.current
    const startTime = Date.now()
    let frame
    const animate = () => {
      const progress = Math.min((Date.now() - startTime) / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const next = Math.round(start + (target - start) * easeOut)
      current.current = next
      setValue(next)
      if (progress < 1) frame = requestAnimationFrame(animate)
    }
    animate()
    return () => cancelAnimationFrame(frame)
  }, [end, duration, reduceMotion])

  return value
}
