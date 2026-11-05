import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react'
import AlertaCard from './AlertaCard.jsx'

export default function AlertasCarousel({ alertas = [] }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [cardW, setCardW] = useState(420)
  const ref = useRef(null)

  useEffect(() => {
    const update = () => setCardW(window.innerWidth < 640 ? 320 : 420)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  useEffect(() => {
    if (alertas.length <= 1 || paused) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches) return
    const iv = setInterval(() => setIndex((i) => (i + 1) % alertas.length), 5000)
    return () => clearInterval(iv)
  }, [alertas.length, paused])

  useEffect(() => {
    const onVis = () => setPaused(document.hidden)
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  if (!alertas.length) {
    return (
      <section className="bg-white rounded-2xl border border-neutral-200 p-6 flex items-center gap-3">
        <CheckCircle2 className="size-5 text-tertiary-600" />
        <p className="text-sm text-ink-700">No hay alertas esta semana</p>
      </section>
    )
  }

  const n = alertas.length
  const prev = () => setIndex((i) => (i - 1 + n) % n)
  const next = () => setIndex((i) => (i + 1) % n)
  const gap = 24
  const getOffset = (i) => {
    // circular shortest distance
    let d = i - index
    if (d > n / 2) d -= n
    if (d < -n / 2) d += n
    return d
  }

  return (
    <section
      ref={ref}
      aria-roledescription="carrusel"
      className="bg-white rounded-2xl border border-neutral-200 p-4"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => { if (!ref.current?.contains(e.relatedTarget)) setPaused(false) }}
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-ink-900">Alertas</h2>
        <button onClick={() => setPaused((p) => !p)} className="text-xs text-ink-500 hover:text-ink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400 rounded">{paused ? 'Reanudar' : 'Pausar'}</button>
      </div>
      <div className="relative flex items-center justify-center">
        <button aria-label="Anterior" onClick={prev} className="absolute left-0 z-10 hidden md:grid h-9 w-9 place-items-center rounded-full border border-neutral-200 bg-white hover:bg-neutral-50 active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400"><ChevronLeft className="size-4" /></button>
        <div className="relative w-full overflow-hidden" style={{ height: 168 }}>
          {alertas.map((a, i) => {
            const offset = getOffset(i)
            const visible = Math.abs(offset) <= 1
            const active = offset === 0
            const x = `calc(-50% + ${offset * (cardW + gap)}px)`
            const style = {
              position: 'absolute',
              left: '50%',
              top: 0,
              transform: `translateX(${x}) scale(${active ? 1 : 0.9})`,
              opacity: visible ? (active ? 1 : 0.45) : 0,
              filter: active ? 'blur(0px)' : 'blur(2px)',
              transition: 'transform 350ms cubic-bezier(0.22,1,0.36,1), opacity 350ms cubic-bezier(0.22,1,0.36,1), filter 350ms cubic-bezier(0.22,1,0.36,1)',
              pointerEvents: active ? 'auto' : 'none',
              zIndex: active ? 2 : 1,
            }
            return (
              <div key={a.id} style={style} aria-hidden={!active}>
                <AlertaCard alerta={a} />
              </div>
            )
          })}
        </div>
        <button aria-label="Siguiente" onClick={next} className="absolute right-0 z-10 hidden md:grid h-9 w-9 place-items-center rounded-full border border-neutral-200 bg-white hover:bg-neutral-50 active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400"><ChevronRight className="size-4" /></button>
      </div>
      <div className="mt-3 flex items-center justify-center gap-1.5">
        {alertas.map((_, i) => (
          <button key={i} aria-label={'Ir a alerta ' + (i + 1)} onClick={() => setIndex(i)} className={`h-1.5 rounded-full transition-all duration-200 ${i === index ? 'w-4 bg-primary-500' : 'w-1.5 bg-neutral-300'}`} />
        ))}
      </div>
      <p className="mt-1 text-center text-xs text-ink-400">{index + 1} de {alertas.length}</p>
    </section>
  )
}
