import { CalendarClock, Circle, PencilLine, CheckCircle2 } from 'lucide-react'
import Modal from '../ui/Modal.jsx'
import { formatFechaHabil, siguienteDiaHabil } from '../../utils/weeks.js'

/**
 * Se muestra al intentar cumplir una parada con tareas sin marcar.
 * Ofrece volver, cumplir así (con alerta) o reprogramar las restantes.
 */
export default function FaltanTareasDialog({
  open,
  parada,
  tareas,
  busy = false,
  onClose,
  onCumplirAsi,
  onReprogramar,
}) {
  if (!parada) return null

  const lista = parada.tareas || []
  const pendientes = lista.filter((t) => tareas?.[t.id] !== undefined ? !tareas[t.id] : !t.completada)
  const total = lista.length
  const hechas = total - pendientes.length
  const avance = total === 0 ? 0 : Math.round((hechas / total) * 100)

  const fechaCopia = (() => {
    try {
      return formatFechaHabil(siguienteDiaHabil(parada.inicio))
    } catch {
      return ''
    }
  })()

  const optionBase =
    'group flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400 disabled:opacity-60 disabled:cursor-not-allowed'

  return (
    <Modal
      open={open}
      onClose={() => { if (!busy) onClose?.() }}
      title="Faltan tareas por cumplir"
      subtitle={parada.titulo}
      maxWidth="max-w-[620px]"
      bodyClassName="space-y-4"
      legend={<span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700">{pendientes.length} pendiente(s)</span>}
    >
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
        <div className="flex items-center justify-between gap-3 text-xs">
          <p className="font-medium text-ink-700">
            Progreso del checklist
          </p>
          <p className="tabular-nums text-ink-500">
            <span className="font-semibold text-ink-800">{hechas}</span> de {total} tareas · {avance}%
          </p>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-neutral-200">
          <div
            className="h-full rounded-full bg-tertiary-500"
            style={{ width: `${Math.min(100, Math.max(0, avance))}%` }}
          />
        </div>
        <ul className="mt-3 space-y-1.5">
          {pendientes.map((t) => (
            <li key={t.id} className="flex items-start gap-2 text-xs text-ink-700">
              <Circle className="mt-0.5 size-3 shrink-0 text-primary-500" aria-hidden="true" />
              <span className="min-w-0">
                <span className="font-medium text-ink-800">{t.nombre}</span>
                <span className="text-ink-500"> · {t.componente}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-ink-500">¿Qué quieres hacer?</p>

        <button
          type="button"
          disabled={busy}
          onClick={onClose}
          className={`${optionBase} border-neutral-200 bg-white hover:bg-neutral-50`}
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-ink-50 text-ink-700">
            <PencilLine className="size-4" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-ink-900">Volver al seguimiento</span>
            <span className="block text-xs text-ink-500">Marca más tareas antes de cerrar la parada.</span>
          </span>
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={onCumplirAsi}
          className={`${optionBase} border-primary-200 bg-primary-50/40 hover:bg-primary-50`}
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary-100 text-primary-600">
            <CheckCircle2 className="size-4" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-primary-700">No, cumplir así</span>
            <span className="block text-xs text-ink-600">
              La parada queda Cumplida y las tareas pendientes se conservan como alerta.
            </span>
          </span>
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={onReprogramar}
          className={`${optionBase} border-tertiary-200 bg-tertiary-50/50 hover:bg-tertiary-50`}
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-tertiary-100 text-tertiary-700">
            <CalendarClock className="size-4" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-tertiary-800">Sí, reprogramar</span>
            <span className="block text-xs text-ink-600">
              La original queda Cumplida con las tareas hechas y se crea una copia Pendiente
              {fechaCopia ? ` para el ${fechaCopia}` : ' para el siguiente día hábil'}.
            </span>
          </span>
        </button>
      </div>

      {busy && <p className="text-xs text-ink-500" aria-live="polite">Guardando cambios…</p>}
    </Modal>
  )
}
