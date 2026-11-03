import { useEffect, useRef, useState } from 'react'

export default function useCountUp(end, duration = 800) {
  const [value, setValue] = useState(0)
  const [reduceMotion, setReduceMotion] = useState(false)
  
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
    if (reduceMotion) {
      setValue(end || 0)
      return
    }
    let start = 0
    const startTime = Date.now()
    const animate = () => {
      const now = Date.now()
      const progress = Math.min((now - startTime) / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(start + (end - start) * easeOut))
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    animate()
  }, [end, duration, reduceMotion])
  
  return value
}
