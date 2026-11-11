import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, ChevronDown, CheckCircle2 } from 'lucide-react'
import AlertaCard from './AlertaCard.jsx'

export default function AlertasCarousel({ alertas: todas = [] }) {
  // El motor marca con Mostrar las destacadas; se respetan en el orden recibido.
  const hayDestacadas = todas.some((a) => a.mostrar)
  const alertas = hayDestacadas ? todas.filter((a) => a.mostrar) : todas
  const resto = hayDestacadas ? todas.filter((a) => !a.mostrar) : []
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [cardW, setCardW] = useState(420)
  const [verTodas, setVerTodas] = useState(false)
  const ref = useRef(null)

  useEffect(() => { setIndex((i) => (i < alertas.length ? i : 0)) }, [alertas.length])

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
        <div className="flex items-center gap-3">
          {resto.length > 0 && (
            <button
              onClick={() => setVerTodas((v) => !v)}
              aria-expanded={verTodas}
              aria-controls="alertas-resto"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400 rounded"
            >
              {verTodas ? 'Ocultar' : `Ver todas (${resto.length})`}
              <ChevronDown className="vt-chevron size-3.5" aria-hidden="true" style={{ transform: verTodas ? 'rotate(180deg)' : 'none' }} />
            </button>
          )}
          <button onClick={() => setPaused((p) => !p)} className="text-xs text-ink-500 hover:text-ink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400 rounded">{paused ? 'Reanudar' : 'Pausar'}</button>
        </div>
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
      {resto.length > 0 && (
        <div id="alertas-resto" className="vt-panel" data-open={verTodas ? 'true' : 'false'} aria-hidden={!verTodas}>
          <style>{`
            .vt-panel { display: grid; grid-template-rows: 0fr; opacity: 0; visibility: hidden; transition: grid-template-rows 250ms cubic-bezier(0.25,1,0.5,1), opacity 150ms ease, visibility 0s linear 250ms; }
            .vt-panel[data-open='true'] { grid-template-rows: 1fr; opacity: 1; visibility: visible; transition: grid-template-rows 250ms cubic-bezier(0.25,1,0.5,1), opacity 250ms ease, visibility 0s; }
            .vt-panel > div { min-height: 0; overflow: hidden; }
            .vt-panel[data-open='true'] .vt-item { animation: vt-in 260ms cubic-bezier(0.22,1,0.36,1) both; }
            .vt-chevron { transition: transform 200ms cubic-bezier(0.22,1,0.36,1); }
            @keyframes vt-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
            @media (prefers-reduced-motion: reduce) {
              .vt-panel { transition: opacity 150ms ease, visibility 0s linear 150ms; }
              .vt-panel[data-open='true'] { transition: opacity 150ms ease, visibility 0s; }
              .vt-panel[data-open='true'] .vt-item { animation: none; }
              .vt-chevron { transition: none; }
            }
          `}</style>
          <div>
            <div className="mt-4 border-t border-neutral-200 pt-4 grid gap-3 justify-items-center md:grid-cols-2 2xl:grid-cols-3">
              {resto.map((a, i) => (
                <div key={a.id} className="vt-item" style={{ animationDelay: `${Math.min(i, 6) * 40}ms` }}>
                  <AlertaCard alerta={a} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
