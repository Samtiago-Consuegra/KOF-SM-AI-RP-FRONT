import { CheckCircle2, Circle, History, Link2 } from 'lucide-react'
import Modal from '../ui/Modal.jsx'
import EstadoBadge from './EstadoBadge.jsx'
import AlertaCumplidaParcial from './AlertaCumplidaParcial.jsx'
import LeyendaReprogramada from './LeyendaReprogramada.jsx'
import { formatFechaHabil } from '../../utils/weeks.js'

function duracionReal(parada) {
  if (!parada?.finReal || !parada?.inicio) return '—'
  const diff = Math.round((new Date(parada.finReal) - new Date(parada.inicio)) / 60000)
  if (!Number.isFinite(diff) || diff <= 0) return '—'
  const horas = Math.floor(diff / 60)
  const minutos = diff % 60
  if (horas === 0) return `${minutos} min`
  return minutos === 0 ? `${horas} h` : `${horas} h ${minutos} min`
}

function motivoTexto(motivo) {
  if (motivo === 'vencida') return 'Parada vencida'
  if (motivo === 'tareas-restantes') return 'Tareas restantes'
  return 'Reprogramación'
}

export default function DetalleParadaModal({ open, onClose, parada }) {
  if (!parada) return null

  const tareas = parada.tareas || []
  const pendientes = tareas.filter((t) => !t.completada)
  const hechas = tareas.length - pendientes.length
  const avance = typeof parada.avanceAlCumplir === 'number'
    ? parada.avanceAlCumplir
    : tareas.length === 0
      ? 0
      : Math.round((hechas / tareas.length) * 100)
  const historial = parada.historialReprogramaciones || []

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={parada.titulo}
      subtitle={`${parada.maquina} · ${parada.sistema} · ${parada.componente}`}
      maxWidth="max-w-[760px]"
      bodyClassName="space-y-4"
      legend={<EstadoBadge estado={parada.estado} />}
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          <span className="text-xs text-ink-500">Parada {parada.id}</span>
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-lg border border-neutral-200 bg-white px-3 text-sm font-medium text-ink-700 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400"
          >
            Cerrar
          </button>
        </div>
      }
    >
      {parada.cumplidaParcial && <AlertaCumplidaParcial parada={parada} />}

      {(parada.reprogramadaA || historial.length > 0) && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-tertiary-200 bg-tertiary-50/40 px-3 py-2">
          <LeyendaReprogramada parada={parada} />
          {parada.reprogramadaA && (
            <span className="inline-flex items-center gap-1 text-xs text-ink-600">
              <Link2 className="size-3.5 text-tertiary-600" aria-hidden="true" />
              Copia {parada.reprogramadaA}
            </span>
          )}
          {parada.paradaOriginalId && (
            <span className="inline-flex items-center gap-1 text-xs text-ink-600">
              <Link2 className="size-3.5 text-tertiary-600" aria-hidden="true" />
              Creada desde {parada.paradaOriginalId}
            </span>
          )}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-500">Estado</p>
          <div className="mt-1"><EstadoBadge estado={parada.estado} /></div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-500">Tipo · Orden SAP</p>
          <p className="mt-1 text-sm font-medium text-ink-900">{parada.tipo} · {parada.ordenSap}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-500">Inicio programado</p>
          <p className="mt-1 text-sm font-medium text-ink-900">{formatFechaHabil(parada.inicio)}</p>
          <p className="text-xs text-ink-500">{formatFechaHabil(parada.finProg)}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-500">Finalización real</p>
          <p className="mt-1 text-sm font-medium text-ink-900">
            {parada.finReal ? formatFechaHabil(parada.finReal) : 'Sin cerrar'}
          </p>
          <p className="text-xs text-ink-500">Duración real: {duracionReal(parada)}</p>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-ink-900">Tareas de la parada</p>
          <p className="text-xs text-ink-500 tabular-nums">
            <span className="font-semibold text-ink-800">{hechas}</span> de {tareas.length} · {avance}%
          </p>
        </div>
        <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-neutral-200">
          <div
            className="h-full rounded-full bg-tertiary-500"
            style={{ width: `${Math.min(100, Math.max(0, avance))}%` }}
          />
        </div>
        <div className="space-y-2">
          {tareas.map((t) => (
            <div
              key={t.id}
              className={`flex items-start gap-3 rounded-xl border p-3 ${
                t.completada ? 'border-tertiary-200 bg-tertiary-50/40' : 'border-neutral-200 bg-white'
              }`}
            >
              {t.completada ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-tertiary-600" aria-hidden="true" />
              ) : (
                <Circle className="mt-0.5 size-4 shrink-0 text-ink-400" aria-hidden="true" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink-900">{t.nombre}</p>
                <p className="text-xs text-ink-500">{t.componente}</p>
              </div>
              <span className={`shrink-0 text-xs font-semibold ${t.completada ? 'text-tertiary-700' : 'text-primary-600'}`}>
                {t.completada ? 'Ejecutada' : 'Pendiente'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {historial.length > 0 && (
        <div className="rounded-xl border border-neutral-200 p-3">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-ink-900">
            <History className="size-4 text-tertiary-600" aria-hidden="true" />
            Historial de reprogramaciones
          </p>
          <ul className="mt-2 space-y-2">
            {historial.slice().reverse().map((item, index) => (
              <li key={`${item.registradaEl || item.fechaNueva}-${index}`} className="border-t border-neutral-100 pt-2 first:border-0 first:pt-0">
                <p className="text-xs font-medium text-ink-800">
                  {formatFechaHabil(item.fechaOriginal)} → {formatFechaHabil(item.fechaNueva)}
                </p>
                <p className="text-xs text-ink-500">
                  {motivoTexto(item.motivo)}
                  {typeof item.avance === 'number' ? ` · ${item.avance}% de avance` : ''}
                  {typeof item.tareasPendientes === 'number' ? ` · ${item.tareasPendientes} tarea(s) pendiente(s)` : ''}
                </p>
                <p className="text-[11px] text-ink-400">Registrada el {formatFechaHabil(item.registradaEl)}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {parada.observaciones && (
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-500">Observaciones</p>
          <p className="mt-1 text-sm text-ink-700">{parada.observaciones}</p>
        </div>
      )}
    </Modal>
  )
}
