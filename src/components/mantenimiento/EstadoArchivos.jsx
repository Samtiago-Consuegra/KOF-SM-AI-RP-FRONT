import { AlertTriangle, ClipboardList, CalendarCheck, Layers, FileSearch, FileCheck2, FileSpreadsheet, CheckCircle2, CircleDashed } from 'lucide-react'
import { Link } from 'react-router-dom'
import { TIPOS_ARCHIVO } from '../../api/motorAdapter.js'

const ICONS = { AlertTriangle, ClipboardList, CalendarCheck, Layers, FileSearch, FileCheck2 }

const fmtFecha = (iso) => (iso ? new Date(iso).toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '')

export default function EstadoArchivos({ archivos = [] }) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 h-full min-w-[280px]">
      <style>{`
        .ea-row { animation: fade-up 250ms cubic-bezier(0.22,1,0.36,1) both; transition: background-color 160ms ease; }
        .ea-badge { animation: cd-pop 220ms cubic-bezier(0.22,1,0.36,1) both; }
        @media (prefers-reduced-motion: reduce) { .ea-row, .ea-badge { animation: none; } }
      `}</style>
      <div className="p-4 border-b border-neutral-200">
        <h2 className="text-base font-semibold text-ink-900">Archivos de la semana</h2>
      </div>
      <div className="divide-y divide-neutral-200">
        {TIPOS_ARCHIVO.map((t, idx) => {
          const Icon = ICONS[t.icon] || FileSpreadsheet
          const f = archivos.find((a) => a.clave === t.clave)
          const vigente = f?.estado === 'actual'
          const esAcr = t.clave === 'acr'
          return (
            <div key={`${t.clave}-${f?.id ?? 'x'}`} className="ea-row p-3 flex items-start gap-3 hover:bg-neutral-50" style={{ animationDelay: `${idx * 50}ms` }}>
              <div className={'h-9 w-9 rounded-lg grid place-items-center shrink-0 ' + (vigente ? 'bg-tertiary-50' : 'bg-neutral-50')}>
                <Icon className={'size-4 ' + (vigente ? 'text-tertiary-700' : 'text-ink-500')} aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 min-w-0">
                  <p className="text-sm font-medium text-ink-900 truncate">{t.label}</p>
                  {esAcr && (
                    <span key={f?.cantidad ?? 0} className="ea-badge shrink-0 rounded-full bg-ink-900 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white" title="ACR cargados">
                      {f?.cantidad ?? 0}
                    </span>
                  )}
                </div>
                <p className="text-xs text-ink-500 truncate" title={f?.nombre || 'Sin archivo'}>
                  {esAcr && vigente ? `${f.cantidad} ACR cargados · último: ${f.nombre}` : f?.nombre || 'Sin archivo'}
                </p>
                <div className="mt-0.5 flex items-center gap-1 min-w-0">
                  {vigente ? (
                    <>
                      <CheckCircle2 className="ea-badge size-3.5 text-tertiary-600 shrink-0" aria-hidden="true" />
                      <p className="text-xs text-tertiary-700 truncate" title={`${fmtFecha(f.actualizado)}${f.subidoPor ? ' · ' + f.subidoPor : ''}`}>
                        {fmtFecha(f.actualizado)}{f.subidoPor ? ` · ${f.subidoPor}` : ''}
                      </p>
                    </>
                  ) : (
                    <>
                      <CircleDashed className="size-3.5 text-ink-400 shrink-0" aria-hidden="true" />
                      <p className="text-xs text-ink-500 truncate">Sin cargar</p>
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
