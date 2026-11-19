import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Info, X } from 'lucide-react'
import { avisaCoberturaParcial, fmtFechaCobertura, NOMBRES_FUENTE } from '../../utils/cobertura.js'

const DURACION = 6000
const SALIDA = 160

/** Contenedor fijo compartido: varios avisos se apilan en la esquina superior derecha. */
function pila() {
  let el = document.getElementById('kof-avisos-cobertura')
  if (!el) {
    el = document.createElement('div')
    el.id = 'kof-avisos-cobertura'
    el.setAttribute('aria-live', 'polite')
    el.className = 'pointer-events-none fixed right-4 top-20 z-toast flex w-[min(360px,calc(100vw-2rem))] flex-col items-end gap-2'
    document.body.appendChild(el)
  }
  return el
}

const reducir = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * Aviso flotante y temporal: el periodo cruza el último registro; se muestran los datos que hay.
 * Aparece una vez por filtro y fuente (`filtro` + el rango sin datos), se cierra solo a los 6 s
 * (pausa al pasar el cursor) o con la X. `activo=false` lo oculta sin olvidar que ya se mostró.
 * No aplica a "paradas": se crean en la app y que no haya más no significa que falten datos.
 */
export default function AvisoCoberturaParcial({ fuente, ev, filtro = '', activo = true }) {
  const clave = `${fuente}|${filtro}|${ev?.sinDatosDesde ?? ''}|${ev?.sinDatosHasta ?? ''}`
  const [cerrada, setCerrada] = useState(null) // clave del aviso ya cerrado
  const [saliendo, setSaliendo] = useState(false)
  const [pausado, setPausado] = useState(false)
  const restante = useRef(DURACION)
  const aplica = avisaCoberturaParcial(fuente, ev)
  const visible = aplica && activo && cerrada !== clave

  const cerrar = useCallback(() => setSaliendo(true), [])

  // Filtro nuevo: el aviso vuelve a mostrarse con el tiempo completo.
  useEffect(() => { restante.current = DURACION; setSaliendo(false); setPausado(false) }, [clave])

  useEffect(() => {
    if (!visible || pausado || saliendo) return undefined
    const inicio = Date.now()
    const t = setTimeout(cerrar, restante.current)
    return () => { clearTimeout(t); restante.current = Math.max(0, restante.current - (Date.now() - inicio)) }
  }, [clave, visible, pausado, saliendo, cerrar])

  useEffect(() => {
    if (!saliendo) return undefined
    let cancelado = false
    const t = setTimeout(() => { if (!cancelado) { setCerrada(clave); setSaliendo(false) } }, reducir() ? 0 : SALIDA)
    return () => { cancelado = true; clearTimeout(t) }
  }, [saliendo, clave])

  if (!visible || typeof document === 'undefined') return null
  const nombre = NOMBRES_FUENTE[fuente] ?? fuente
  return createPortal(
    <div
      key={clave}
      role="status"
      data-saliendo={saliendo}
      data-pausado={pausado}
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
      className="acp pointer-events-auto w-full overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg"
    >
      <style>{`
        @keyframes acp-in { from { opacity: 0; transform: translateY(-8px) scale(.98); } to { opacity: 1; transform: none; } }
        @keyframes acp-bar { from { transform: scaleX(1); } to { transform: scaleX(0); } }
        .acp { animation: acp-in 240ms cubic-bezier(0.22, 1, 0.36, 1) both; transition: opacity ${SALIDA}ms ease, transform ${SALIDA}ms ease; }
        .acp[data-saliendo="true"] { opacity: 0; transform: translateY(-6px) scale(.98); }
        .acp-bar { animation: acp-bar ${DURACION}ms linear both; transform-origin: left; }
        .acp[data-pausado="true"] .acp-bar { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) {
          .acp { animation: none; transition: opacity 120ms ease; }
          .acp[data-saliendo="true"] { transform: none; }
        }
      `}</style>
      <div className="flex items-start gap-2.5 p-3">
        <span className="mt-px grid size-6 shrink-0 place-items-center rounded-full bg-[#0D9488]/10">
          <Info className="size-3.5 text-[#0D9488]" aria-hidden="true" />
        </span>
        <p className="min-w-0 flex-1 text-xs leading-5 text-ink-700">
          Datos de {nombre} disponibles hasta el{' '}
          <span className="font-semibold tabular-nums text-[#111827]">{fmtFechaCobertura(ev?.ultimoDato)}</span>
        </p>
        <button
          type="button"
          onClick={cerrar}
          aria-label="Cerrar aviso"
          className="grid size-6 shrink-0 place-items-center rounded-md text-ink-500 transition-colors duration-150 hover:bg-neutral-100 hover:text-[#111827] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400"
          style={{ touchAction: 'manipulation' }}
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      </div>
      <div className="acp-bar h-0.5 bg-[#0D9488]" />
    </div>,
    pila(),
  )
}
