import { ArrowRight } from 'lucide-react'
import { fmtFechaCobertura, NOMBRES_FUENTE } from '../../utils/cobertura.js'

/** Texto según el caso: el periodo cae después del último registro o antes del primero. */
export function textoSinDatos(fuente, ev) {
  const nombre = NOMBRES_FUENTE[fuente] ?? fuente
  if (ev?.sinDatosDesde && ev.ultimoDato && ev.sinDatosDesde > ev.ultimoDato) {
    return `No hay registros de ${nombre} desde el ${fmtFechaCobertura(ev.sinDatosDesde)} (último registro: ${fmtFechaCobertura(ev.ultimoDato)})`
  }
  return `Los registros de ${nombre} empiezan el ${fmtFechaCobertura(ev?.primerDato)}`
}

/**
 * Estado vacío ilustrado: el filtro no tiene registros pero la fuente sí tiene datos en otras fechas.
 * `fuente` es una clave de NOMBRES_FUENTE o un texto ya legible; `ev` sale de evaluarCobertura.
 */
export default function SinDatosPeriodo({ fuente, ev, onIrAUltimo, compacto = false, className = '' }) {
  return (
    <div
      role="status"
      className={`sdp flex flex-col items-center text-center ${compacto ? 'gap-2 px-4 py-8' : 'gap-3 px-6 py-14'} ${className}`}
    >
      <style>{`
        @keyframes sdp-in { from { opacity: 0; transform: translateY(8px) scale(.98); } to { opacity: 1; transform: none; } }
        @keyframes sdp-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        @keyframes sdp-dash { to { stroke-dashoffset: 0; } }
        @keyframes sdp-fade { from { opacity: 0; } }
        .sdp { animation: sdp-in 320ms cubic-bezier(0.22, 1, 0.36, 1) both; }
        .sdp-ilus { animation: sdp-float 2.8s ease-in-out 400ms infinite; }
        .sdp-linea { stroke-dasharray: 4 5; stroke-dashoffset: 27; animation: sdp-dash 700ms cubic-bezier(0.22, 1, 0.36, 1) 160ms both; }
        .sdp-btn { transition: background-color 200ms ease, transform 140ms cubic-bezier(0.22, 1, 0.36, 1); touch-action: manipulation; }
        .sdp-btn:active { transform: scale(.97); }
        .sdp-btn svg { transition: transform 200ms cubic-bezier(0.22, 1, 0.36, 1); }
        @media (hover: hover) and (pointer: fine) { .sdp-btn:hover svg { transform: translateX(2px); } }
        @media (prefers-reduced-motion: reduce) {
          .sdp { animation: sdp-fade 160ms ease-out both; }
          .sdp-ilus { animation-play-state: paused; }
          .sdp-linea { animation: none; stroke-dashoffset: 0; }
          .sdp-btn, .sdp-btn svg { transition: background-color 200ms ease; }
          .sdp-btn:active { transform: none; }
        }
      `}</style>

      {/* Calendario con la franja sin datos punteada */}
      <svg className={`sdp-ilus ${compacto ? 'h-12' : 'h-16'} w-auto`} viewBox="0 0 64 56" fill="none" aria-hidden="true">
        <rect x="4" y="8" width="56" height="44" rx="8" fill="#F8F9FA" stroke="#E5E7EB" strokeWidth="2" />
        <path d="M4 18h56" stroke="#E5E7EB" strokeWidth="2" />
        <path d="M18 4v8M46 4v8" stroke="#111827" strokeWidth="2.5" strokeLinecap="round" />
        <rect x="12" y="25" width="8" height="7" rx="2" fill="#0D9488" opacity=".85" />
        <rect x="24" y="25" width="8" height="7" rx="2" fill="#0D9488" opacity=".55" />
        <path className="sdp-linea" d="M12 41h40" stroke="#F40000" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="48" cy="28.5" r="3.5" fill="#F40000" />
      </svg>

      <p className={`${compacto ? 'text-sm' : 'text-base'} font-semibold text-[#111827] text-balance`}>No hay registros en este periodo</p>
      <p className="max-w-md text-sm text-ink-500 text-pretty">{textoSinDatos(fuente, ev)}</p>

      {onIrAUltimo && (
        <button
          type="button"
          onClick={onIrAUltimo}
          className="sdp-btn mt-1 inline-flex h-9 items-center gap-2 rounded-xl bg-[#111827] px-4 text-sm font-semibold text-white hover:bg-[#F40000] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] focus-visible:ring-offset-2"
        >
          Ir al último periodo con datos
          <ArrowRight className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
