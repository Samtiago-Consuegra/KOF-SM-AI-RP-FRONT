import { AlertTriangle, ClipboardList, CalendarCheck, CheckCircle2, XCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

const ICONS = { AlertTriangle, ClipboardList, CalendarCheck }

export default function EstadoArchivos({ archivos = [] }) {
  const items = [
    { tipo: 'Avisos de daño', icon: 'AlertTriangle' },
    { tipo: 'Órdenes de trabajo', icon: 'ClipboardList' },
    { tipo: 'Plan preventivo', icon: 'CalendarCheck' },
  ]

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 h-full min-w-[280px]">
      <div className="p-4 border-b border-neutral-200">
        <h2 className="text-base font-semibold text-ink-900">Archivos de la semana</h2>
      </div>
      <div className="divide-y divide-neutral-200">
        {items.map((it, idx) => {
          const Icon = ICONS[it.icon]
          const f = archivos.find((a) => a.tipo === it.tipo)
          const actualizado = f?.estado === 'actual'
          return (
            <div key={it.tipo} className="p-3 flex items-start gap-3" style={{ animation: `fade-up 250ms ease-out ${idx * 60}ms both` }}>
              <div className="h-9 w-9 rounded-lg bg-neutral-50 grid place-items-center shrink-0">
                <Icon className="size-4 text-ink-700" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink-900 whitespace-nowrap truncate">{it.tipo}</p>
                <p className="text-xs text-ink-500 truncate" title={f?.nombre || 'Sin archivo'}>{f?.nombre || 'Sin archivo'}</p>
                <div className="mt-0.5 flex items-center gap-1 min-w-0">
                  {actualizado ? (
                    <>
                      <CheckCircle2 className="size-3.5 text-tertiary-600 shrink-0 transition-transform" style={{ animation: 'cd-pop 220ms ease-out' }} />
                      <p className="text-xs text-tertiary-600 truncate whitespace-nowrap">
                        Actualizado · {f?.actualizado ? new Date(f.actualizado).toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
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
        })}
      </div>
      <div className="p-3 border-t border-neutral-200">
        <Link to="/historial" className="text-sm text-primary-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400 rounded">Ver historial de cargas</Link>
      </div>
    </div>
  )
}
