import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '../utils/motion.js'

// Un solo IntersectionObserver para todas las tarjetas: las que entran en el mismo
// callback reciben su posición en el lote, que se usa para la cascada.
let observer = null
const callbacks = new Map()

function getObserver() {
  if (!observer) {
    observer = new IntersectionObserver((entries) => {
      entries.filter((e) => e.isIntersecting).forEach((e, i) => {
        callbacks.get(e.target)?.(i)
        callbacks.delete(e.target)
        observer.unobserve(e.target)
      })
    }, { rootMargin: '0px 0px -40px 0px' })
  }
  return observer
}

// Devuelve [ref, índice en el lote | null]. Se dispara una sola vez.
export default function useInView() {
  const ref = useRef(null)
  const [index, setIndex] = useState(() =>
    typeof IntersectionObserver === 'undefined' || prefersReducedMotion() ? 0 : null)

  useEffect(() => {
    const el = ref.current
    if (index !== null || !el) return
    callbacks.set(el, setIndex)
    getObserver().observe(el)
    return () => {
      callbacks.delete(el)
      observer?.unobserve(el)
    }
  }, [index])

  return [ref, index]
}
