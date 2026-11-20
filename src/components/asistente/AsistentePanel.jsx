import { useEffect, useId, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Bot, ChevronDown, MessageCircleQuestion, X } from 'lucide-react'
import { cargarCatalogo } from '../../data/asistente/index.js'
import { responder } from '../../data/asistente/helpers.js'
import { useLeerAsistente } from '../../context/AsistenteContext.jsx'
import { isTopLayer, pushLayer } from '../../utils/modalLayer.js'
import { prefersReducedMotion, staggerStyle } from '../../utils/motion.js'

const GRUPOS = [
  { id: 'vista', label: 'Sobre esta vista' },
  { id: 'explicar', label: '¿Qué significa…?' },
]
// "Escribiendo…" breve: con datos un poco más, para que se note que se consultó algo.
const ESPERA_MS = { datos: 450, texto: 250 }
const esperar = (ms) => new Promise((r) => setTimeout(r, ms))

const boton = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400 focus-visible:ring-offset-1'

function Explicacion({ partes }) {
  return (
    <dl className="space-y-2">
      {[['Qué es', partes.queEs], ['Cómo se calcula', partes.comoSeCalcula], ['De dónde salen los datos', partes.origen]].map(([t, d]) => (
        <div key={t}>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-tertiary-700">{t}</dt>
          <dd className="mt-0.5">{d}</dd>
        </div>
      ))}
    </dl>
  )
}

function Escribiendo() {
  return (
    <div className="asis-msg flex justify-start">
      <div className="inline-flex items-center gap-1 rounded-2xl rounded-bl-md border border-neutral-200 bg-white px-3 py-2.5" role="status">
        <span className="sr-only">El asistente está escribiendo</span>
        {[0, 1, 2].map((i) => <span key={i} aria-hidden="true" className="asis-dot size-1.5 rounded-full bg-ink-400" />)}
      </div>
    </div>
  )
}

function OpcionPregunta({ pregunta, onElegir, disabled, style }) {
  return (
    <button
      type="button"
      onClick={() => onElegir(pregunta)}
      disabled={disabled}
      style={style}
      className={`asis-msg group flex w-full items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-left text-sm text-ink-800 transition-[border-color,background-color] duration-150 hover:border-tertiary-300 hover:bg-tertiary-50 active:bg-tertiary-100 disabled:opacity-50 ${boton}`}
    >
      <MessageCircleQuestion aria-hidden="true" className="size-4 shrink-0 text-tertiary-600" />
      <span className="min-w-0 flex-1">{pregunta.texto}</span>
      <ArrowRight aria-hidden="true" className="size-3.5 shrink-0 text-ink-300 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-tertiary-600" />
    </button>
  )
}

export default function AsistentePanel({ abierto, vista, titulo, mensajes, setMensajes, onClose, onCerrado }) {
  const leer = useLeerAsistente()
  const navigate = useNavigate()
  const uid = useId()
  const [catalogo, setCatalogo] = useState(null)
  const [fallo, setFallo] = useState(false)
  const [grupo, setGrupo] = useState('vista')
  const [verMenu, setVerMenu] = useState(true)
  const [seccion, setSeccion] = useState(null)
  const [escribiendo, setEscribiendo] = useState(false)
  const scrollRef = useRef(null)
  const primerChipRef = useRef(null)

  // Catálogo de la vista actual (import diferido, memorizado por vista).
  useEffect(() => {
    let vigente = true
    setFallo(false)
    if (!vista) { setCatalogo(null); return undefined }
    cargarCatalogo(vista)
      .then((c) => { if (vigente) setCatalogo(c) })
      .catch(() => { if (vigente) setFallo(true) })
    return () => { vigente = false }
  }, [vista])

  // Vista nueva: se muestran sus sugerencias.
  useEffect(() => { setVerMenu(true); setGrupo('vista'); setSeccion(null) }, [vista])

  // Escape cierra solo si el asistente es la capa superior (un modal abierto encima tiene prioridad).
  useEffect(() => {
    if (!abierto) return undefined
    const id = 'asistente'
    const quitar = pushLayer(id)
    const onKey = (e) => { if (e.key === 'Escape' && isTopLayer(id)) onClose() }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey); quitar() }
  }, [abierto, onClose])

  useEffect(() => { primerChipRef.current?.focus({ preventScroll: true }) }, [])

  // Cierre: se desmonta al terminar la animación (con respaldo por si no se dispara).
  useEffect(() => {
    if (abierto) return undefined
    const t = setTimeout(onCerrado, 250)
    return () => clearTimeout(t)
  }, [abierto, onCerrado])

  // Lo nuevo siempre queda a la vista.
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  }, [mensajes.length, escribiendo, verMenu, grupo])

  const preguntar = async (p) => {
    if (escribiendo) return
    const id = `${Date.now()}`
    setMensajes((m) => [...m, { id: `u${id}`, rol: 'usuario', texto: p.texto }])
    setVerMenu(false)
    setEscribiendo(true)
    const inicio = Date.now()
    const { contenido, accion } = await responder(p, { datos: leer(vista) })
    const resto = ESPERA_MS[typeof p.respuesta === 'function' ? 'datos' : 'texto'] - (Date.now() - inicio)
    if (resto > 0) await esperar(resto)
    const relacionadas = (p.relacionadas ?? []).map((rid) => catalogo?.preguntas.find((q) => q.id === rid)).filter(Boolean)
    setEscribiendo(false)
    setMensajes((m) => [...m, { id: `a${id}`, rol: 'asistente', contenido, accion, relacionadas }])
  }

  const elegirGrupo = (g) => { setGrupo(g); setVerMenu(true); setSeccion(null) }
  const ultimo = mensajes[mensajes.length - 1]
  const preguntasVista = catalogo?.preguntas.filter((q) => q.grupo === 'vista') ?? []

  return (
    <section
      id="asistente-panel"
      role="dialog"
      aria-modal="false"
      aria-labelledby={`${uid}-titulo`}
      data-state={abierto ? 'open' : 'closed'}
      onAnimationEnd={(e) => { if (!abierto && e.target === e.currentTarget) onCerrado() }}
      className="asis-panel fixed z-dropdown flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl"
    >
      <header className="bg-ink-900 px-3 pt-3 pb-3 text-white">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-500" aria-hidden="true">
            <Bot className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id={`${uid}-titulo`} className="text-sm font-semibold leading-tight">Asistente virtual</h2>
            <p className="truncate text-xs text-white/70">Preguntas sobre {titulo}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar asistente" className={`grid size-9 place-items-center rounded-lg transition-colors hover:bg-white/10 active:bg-white/20 ${boton}`}>
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>
        <div className="relative mt-3 grid grid-cols-2 rounded-xl bg-white/10 p-1" role="group" aria-label="Tipo de pregunta">
          <span
            aria-hidden="true"
            className="asis-tab-ind absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-lg bg-white shadow-sm"
            style={{ transform: grupo === 'explicar' ? 'translateX(100%)' : 'none' }}
          />
          {GRUPOS.map((g, i) => (
            <button
              key={g.id}
              ref={i === 0 ? primerChipRef : undefined}
              type="button"
              aria-pressed={grupo === g.id}
              onClick={() => elegirGrupo(g.id)}
              className={`relative h-8 rounded-lg px-2 text-xs font-semibold transition-colors duration-200 ${grupo === g.id ? 'text-ink-900' : 'text-white/80 hover:text-white'} ${boton}`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </header>

      <div ref={scrollRef} className="scroll-thin min-h-0 flex-1 overflow-y-auto overscroll-contain bg-neutral-50 p-3">
        <div className="space-y-3" role="log" aria-live="polite" aria-relevant="additions" aria-label="Conversación con el asistente">
          {mensajes.length === 0 && (
            <div className="asis-msg flex justify-start">
              <p className="max-w-[88%] rounded-2xl rounded-bl-md border border-neutral-200 bg-white px-3 py-2 text-sm text-ink-800">
                Hola. Elige una pregunta sobre {titulo} o pregúntame qué significa cada indicador.
              </p>
            </div>
          )}
          {mensajes.map((m) => {
            if (m.rol === 'sistema') {
              return (
                <p key={m.id} className="asis-msg flex items-center gap-2 text-[11px] font-medium text-ink-500">
                  <span className="h-px flex-1 bg-neutral-200" aria-hidden="true" />{m.texto}<span className="h-px flex-1 bg-neutral-200" aria-hidden="true" />
                </p>
              )
            }
            if (m.rol === 'usuario') {
              return (
                <div key={m.id} className="asis-msg flex justify-end">
                  <p className="max-w-[85%] rounded-2xl rounded-br-md bg-primary-500 px-3 py-2 text-sm text-white">{m.texto}</p>
                </div>
              )
            }
            const esUltimo = m === ultimo && !escribiendo && !verMenu
            return (
              <div key={m.id} className="asis-msg space-y-2">
                <div className="max-w-[92%] rounded-2xl rounded-bl-md border border-neutral-200 bg-white px-3 py-2.5 text-sm leading-relaxed text-ink-800">
                  {typeof m.contenido === 'string' ? <p>{m.contenido}</p> : <Explicacion partes={m.contenido} />}
                </div>
                {esUltimo && (
                  <div className="space-y-1.5">
                    {m.accion && (
                      <button
                        type="button"
                        onClick={() => navigate(m.accion.ruta)}
                        className={`asis-msg inline-flex h-9 items-center gap-1.5 rounded-lg bg-ink-900 px-3 text-xs font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-primary-500 active:scale-[0.97] ${boton}`}
                      >
                        {m.accion.etiqueta}<ArrowRight aria-hidden="true" className="size-3.5" />
                      </button>
                    )}
                    {m.relacionadas?.length > 0 && <p className="pt-1 text-[11px] font-medium text-ink-500">Preguntas relacionadas</p>}
                    {m.relacionadas?.map((q, i) => (
                      <OpcionPregunta key={q.id} pregunta={q} onElegir={preguntar} disabled={escribiendo} style={staggerStyle(i, 40, 60)} />
                    ))}
                    <button
                      type="button"
                      onClick={() => setVerMenu(true)}
                      className={`asis-msg inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-tertiary-700 transition-colors hover:bg-tertiary-50 ${boton}`}
                    >
                      <ArrowLeft aria-hidden="true" className="size-3.5" />Volver a las preguntas
                    </button>
                  </div>
                )}
              </div>
            )
          })}
          {escribiendo && <Escribiendo />}
        </div>

        {verMenu && !escribiendo && (
          <div className="mt-3 space-y-1.5" key={`${vista}-${grupo}`}>
            {!vista && <p className="text-sm text-ink-500">En esta página no hay preguntas disponibles. Abre una de las vistas del menú.</p>}
            {vista && fallo && <p className="text-sm text-ink-500">No pude cargar las preguntas en este momento.</p>}
            {vista && !fallo && !catalogo && <p className="text-sm text-ink-500" role="status">Cargando preguntas…</p>}
            {catalogo && grupo === 'vista' && preguntasVista.map((q, i) => (
              <OpcionPregunta key={q.id} pregunta={q} onElegir={preguntar} style={staggerStyle(i, 30)} />
            ))}
            {catalogo && grupo === 'explicar' && catalogo.secciones.map((s, i) => {
              const abiertaSec = seccion === s
              const items = catalogo.preguntas.filter((q) => q.grupo === 'explicar' && q.seccion === s)
              const regionId = `${uid}-sec-${i}`
              return (
                <div key={s} className="asis-msg overflow-hidden rounded-xl border border-neutral-200 bg-white" style={staggerStyle(i, 30)}>
                  <button
                    type="button"
                    aria-expanded={abiertaSec}
                    aria-controls={regionId}
                    onClick={() => setSeccion(abiertaSec ? null : s)}
                    className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-semibold text-ink-900 transition-colors hover:bg-neutral-50 ${boton} focus-visible:ring-inset`}
                  >
                    <span className="flex-1">{s}</span>
                    <span className="rounded-full bg-neutral-100 px-1.5 text-[11px] font-medium text-ink-500">{items.length}</span>
                    <ChevronDown aria-hidden="true" className="asis-chev size-4 text-ink-400" />
                  </button>
                  <div id={regionId} className="asis-acc" data-open={abiertaSec} {...(!abiertaSec && { inert: '' })}>
                    <div>
                      <ul className="flex flex-wrap gap-1.5 px-3 pb-3 pt-0.5">
                        {items.map((q) => (
                          <li key={q.id}>
                            <button
                              type="button"
                              onClick={() => preguntar(q)}
                              className={`rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-xs text-ink-700 transition-colors duration-150 hover:border-tertiary-300 hover:bg-tertiary-50 hover:text-tertiary-800 active:bg-tertiary-100 ${boton}`}
                            >
                              {q.texto}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
