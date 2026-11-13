import { useState } from 'react'
import { CheckCircle2, ChevronLeft, ChevronRight, XCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ARCHIVOS } from '../../services/mantenimientoService.js'

const POR_PAGINA = 3
const fecha = (iso) => new Date(iso).toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

function Fila({ clave, tipo, Icon, f, idx }) {
  const actualizado = f?.estado === 'actual'
  const subtitulo = clave === 'acr'
    ? (f?.total ? `${f.total} ACR cargado${f.total === 1 ? '' : 's'}` : 'Sin archivo')
    : (f?.nombre || 'Sin archivo')
  return (
    <div className="p-3 flex items-start gap-3" style={{ animation: `fade-up 250ms ease-out ${idx * 60}ms both` }}>
      <div className="h-9 w-9 rounded-lg bg-neutral-50 grid place-items-center shrink-0">
        <Icon className="size-4 text-ink-700" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink-900 whitespace-nowrap truncate">{tipo}</p>
        <p className="text-xs text-ink-500 truncate" title={clave === 'acr' && f?.nombre ? `Último: ${f.nombre}` : subtitulo}>{subtitulo}</p>
        <div className="mt-0.5 flex items-center gap-1 min-w-0">
          {actualizado ? (
            <>
              <CheckCircle2 className="size-3.5 text-tertiary-600 shrink-0" style={{ animation: 'cd-pop 220ms ease-out' }} />
              <p className="text-xs text-tertiary-600 truncate whitespace-nowrap">
                Actualizado · {f?.actualizado ? fecha(f.actualizado) : ''}
              </p>
            </>
          ) : (
            <>
              <XCircle className="size-3.5 text-primary-600 shrink-0" />
              <p className="text-xs text-primary-600 truncate whitespace-nowrap">Sin actualizar esta semana</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function EstadoArchivos({ archivos = [] }) {
  const [pagina, setPagina] = useState(0)

  // Los 6 tipos, con la carga más reciente primero; los que no tienen archivo van al final.
  const items = ARCHIVOS.map((a, orden) => ({ ...a, orden, f: archivos.find((x) => x.clave === a.clave || x.tipo === a.tipo) }))
    .sort((a, b) => {
      const ta = a.f?.actualizado ? Date.parse(a.f.actualizado) : -Infinity
      const tb = b.f?.actualizado ? Date.parse(b.f.actualizado) : -Infinity
      return tb - ta || a.orden - b.orden
    })
  const paginas = Array.from({ length: Math.ceil(items.length / POR_PAGINA) }, (_, p) => items.slice(p * POR_PAGINA, (p + 1) * POR_PAGINA))
  const actual = Math.min(pagina, paginas.length - 1)
  const ir = (p) => setPagina(Math.max(0, Math.min(paginas.length - 1, p)))

  const flecha = 'grid size-7 place-items-center rounded-lg border border-neutral-200 text-ink-700 transition-[background-color,opacity,transform] duration-200 hover:bg-neutral-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400'

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 h-full min-w-[280px] flex flex-col">
      <div className="p-4 border-b border-neutral-200">
        <h2 className="text-base font-semibold text-ink-900">Archivos de la semana</h2>
      </div>

      <div className="overflow-hidden" aria-roledescription="carrusel" aria-label="Tipos de archivo">
        <div
          className="flex transition-transform duration-300 ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none"
          style={{ transform: `translateX(-${actual * 100}%)` }}
        >
          {paginas.map((grupo, p) => (
            <div
              key={p}
              className="w-full shrink-0 divide-y divide-neutral-200"
              aria-hidden={p !== actual}
              aria-roledescription="página"
              aria-label={`${p + 1} de ${paginas.length}`}
            >
              {grupo.map((it, idx) => <Fila key={it.clave} {...it} idx={idx} />)}
            </div>
          ))}
        </div>
      </div>

      {paginas.length > 1 && (
        <div className="mt-auto flex items-center justify-between gap-2 px-3 py-2 border-t border-neutral-200">
          <button type="button" onClick={() => ir(actual - 1)} disabled={actual === 0} aria-label="Tipos anteriores" className={flecha}>
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs tabular-nums text-ink-500" aria-live="polite">{actual + 1} de {paginas.length}</span>
            <div className="flex items-center gap-1">
              {paginas.map((_, p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => ir(p)}
                  aria-label={`Ir a la página ${p + 1}`}
                  aria-current={p === actual ? 'true' : undefined}
                  className={`h-1.5 rounded-full transition-[width,background-color] duration-300 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400 ${
                    p === actual ? 'w-4 bg-primary-500' : 'w-1.5 bg-neutral-300 hover:bg-neutral-400'
                  }`}
                />
              ))}
            </div>
          </div>
          <button type="button" onClick={() => ir(actual + 1)} disabled={actual === paginas.length - 1} aria-label="Tipos siguientes" className={flecha}>
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="p-3 border-t border-neutral-200">
        <Link to="/historial" className="text-sm text-primary-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400 rounded">Ver historial de cargas</Link>
      </div>
    </div>
  )
}
