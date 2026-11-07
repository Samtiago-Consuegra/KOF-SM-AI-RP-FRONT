import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ListChecks } from 'lucide-react'
import Modal from '../ui/Modal.jsx'
import EstadoBadge from './EstadoBadge.jsx'
import ConfirmDialog from '../mantenimiento/ConfirmDialog.jsx'
import FaltanTareasDialog from './FaltanTareasDialog.jsx'
import { getParada, registrarSeguimiento, cumplirParada, cumplirYReprogramarRestantes } from '../../services/cumplimientoService.js'
import { useToast } from '../../context/ToastContext'
import { formatFechaHabil, formatRangoHoras } from '../../utils/weeks.js'

function toLocalInput(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function duracionEnMinutos(inicioISO, finLocal) {
  if (!inicioISO || !finLocal) return null
  const inicio = new Date(inicioISO)
  const fin = new Date(finLocal)
  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime())) return null
  const diff = Math.round((fin - inicio) / 60000)
  return diff > 0 ? diff : null
}

function duracionTexto(minutos) {
  if (!minutos) return ''
  const horas = Math.floor(minutos / 60)
  const resto = minutos % 60
  if (horas === 0) return `${resto} min`
  return resto === 0 ? `${horas} h` : `${horas} h ${resto} min`
}

export default function RegistrarSeguimientoModal({ open, onClose, paradaId, onSuccess }) {
  const toast = useToast()
  const [parada, setParada] = useState(null)
  const [tareas, setTareas] = useState({})
  const [estado, setEstado] = useState('Pendiente')
  const [finReal, setFinReal] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [confirmCumplir, setConfirmCumplir] = useState(false)
  const [faltanOpen, setFaltanOpen] = useState(false)

  useEffect(() => {
    if (!open || !paradaId) return
    let ignore = false

    setLoading(true)
    setError('')
    setParada(null)

    getParada(paradaId).then((p) => {
      if (ignore) return
      setParada(p)
      if (p) {
        const iniciales = {}
        p.tareas.forEach((t) => { iniciales[t.id] = !!t.completada })
        setTareas(iniciales)
        setEstado(p.estado === 'En ejecución' ? 'En ejecución' : 'Pendiente')
        setFinReal(p.finReal ? toLocalInput(p.finReal) : '')
        setObservaciones(p.observaciones || '')
      }
      setLoading(false)
    }).catch(() => {
      if (!ignore) {
        setLoading(false)
        setError('No se pudo cargar la parada.')
      }
    })

    return () => { ignore = true }
  }, [open, paradaId])

  const total = parada?.tareas?.length || 0
  const completadas = parada?.tareas?.filter((t) => tareas[t.id]).length || 0
  const progreso = total === 0 ? 0 : Math.round((completadas / total) * 100)
  const minutos = useMemo(() => duracionEnMinutos(parada?.inicio, finReal), [parada?.inicio, finReal])
  const finRealISO = useMemo(() => {
    if (!finReal) return null
    const date = new Date(finReal)
    return Number.isNaN(date.getTime()) ? null : date.toISOString()
  }, [finReal])

  const handleClose = () => {
    if (saving) return
    onClose?.()
  }

  const handleToggle = (tareaId, checked) => {
    const siguientes = { ...tareas, [tareaId]: checked }
    setTareas(siguientes)
    setError('')

    const alguna = Object.values(siguientes).some(Boolean)
    if (checked && estado === 'Pendiente') setEstado('En ejecución')
    if (!alguna && estado === 'En ejecución') setEstado('Pendiente')
  }

  const handleMarcarTodas = () => {
    if (!parada) return
    const todas = completadas !== total
    const siguientes = {}
    parada.tareas.forEach((t) => { siguientes[t.id] = todas })
    setTareas(siguientes)
    setError('')
    setEstado(todas ? 'En ejecución' : 'Pendiente')
  }

  const validarCierre = () => {
    if (!parada) return 'No se encontró la parada.'
    if (completadas === 0) return 'Marca al menos una tarea para cumplir la parada.'
    if (!finReal) return 'Registra la finalización real para cumplir la parada.'
    const inicio = new Date(parada.inicio)
    const fin = new Date(finReal)
    if (Number.isNaN(fin.getTime())) return 'La fecha de finalización no es válida.'
    if (fin < inicio) return 'La finalización real no puede ser anterior al inicio de la parada.'
    if (fin.getTime() > Date.now() + 60000) return 'La finalización real no puede ser una fecha futura.'
    return ''
  }

  const handleGuardarAvance = async () => {
    if (!parada || saving) return
    setSaving(true)
    setError('')
    try {
      await registrarSeguimiento(parada.id, {
        tareas,
        estado,
        finReal: finRealISO,
        observaciones,
      })
      toast('Avance registrado', 'success')
      onSuccess?.()
      onClose?.()
    } catch (e) {
      toast(e?.message || 'No se pudo guardar el avance', 'error')
      setError(e?.message || 'No se pudo guardar el avance.')
    } finally {
      setSaving(false)
    }
  }

  const intentarCumplir = () => {
    if (saving) return
    const mensaje = validarCierre()
    if (mensaje) {
      setError(mensaje)
      toast(mensaje, 'error')
      return
    }

    setError('')
    if (completadas === total) {
      setConfirmCumplir(true)
      return
    }
    setFaltanOpen(true)
  }

  const cerrarCumplida = async (resultado, mensaje) => {
    toast(mensaje, 'success')
    onSuccess?.(resultado)
    onClose?.()
  }

  const handleCumplirTodas = async () => {
    if (!parada || saving) return
    setSaving(true)
    try {
      const resultado = await cumplirParada(parada.id, {
        tareas,
        finReal: finRealISO,
        observaciones,
      })
      setConfirmCumplir(false)
      await cerrarCumplida(resultado, 'Parada cumplida')
    } catch (e) {
      toast(e?.message || 'No se pudo cumplir la parada', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleCumplirAsi = async () => {
    if (!parada || saving) return
    setSaving(true)
    try {
      const resultado = await cumplirParada(parada.id, {
        tareas,
        finReal: finRealISO,
        observaciones,
      })
      setFaltanOpen(false)
      await cerrarCumplida(resultado, 'Parada cumplida con tareas pendientes')
    } catch (e) {
      toast(e?.message || 'No se pudo cumplir la parada', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleReprogramarRestantes = async () => {
    if (!parada || saving) return
    setSaving(true)
    try {
      const resultado = await cumplirYReprogramarRestantes(parada.id, {
        tareas,
        finReal: finRealISO,
        observaciones,
      })
      setFaltanOpen(false)
      const mensaje = resultado.copia
        ? `Parada cumplida y copia programada para el ${formatFechaHabil(resultado.copia.inicio)}`
        : 'Parada cumplida'
      await cerrarCumplida(resultado, mensaje)
    } catch (e) {
      toast(e?.message || 'No se pudo reprogramar el resto', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <>
      <Modal
        open={open}
        onClose={handleClose}
        title="Registrar seguimiento"
        subtitle={parada ? `${parada.maquina} · ${parada.sistema} · ${parada.componente}` : 'Cargando parada…'}
        maxWidth="max-w-[760px]"
        bodyClassName="space-y-5"
        legend={parada ? <EstadoBadge estado={parada.estado} /> : null}
        footer={
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-ink-500 tabular-nums">
              <span className="font-semibold text-ink-800">{completadas}</span> de {total} tareas marcadas
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={saving}
                className="h-9 rounded-lg border border-neutral-200 bg-white px-3 text-sm font-medium text-ink-700 hover:bg-neutral-50 disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGuardarAvance}
                disabled={!parada || saving || loading}
                className="h-9 rounded-lg border border-neutral-200 bg-white px-3 text-sm font-semibold text-ink-700 hover:bg-neutral-50 disabled:opacity-60"
              >
                Guardar avance
              </button>
              <button
                type="button"
                onClick={intentarCumplir}
                disabled={!parada || saving || loading}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary-500 px-3 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-60"
              >
                <CheckCircle2 className="size-4" aria-hidden="true" />
                Cumplir parada
              </button>
            </div>
          </div>
        }
      >
        {loading && (
          <div className="space-y-3" aria-live="polite">
            <p className="text-sm text-ink-500">Cargando información de la parada…</p>
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-neutral-100" />
            ))}
          </div>
        )}

        {!loading && parada && (
          <>
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-500">Máquina</p>
                  <p className="mt-0.5 font-medium text-ink-900">{parada.maquina}</p>
                  <p className="text-xs text-ink-500">{parada.sistema} · {parada.componente}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-500">Orden SAP · Tipo</p>
                  <p className="mt-0.5 font-medium text-ink-900">{parada.ordenSap} · {parada.tipo}</p>
                  <p className="text-xs text-ink-500">Estado efectivo: {parada.estado}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-500">Inicio</p>
                  <p className="mt-0.5 font-medium text-ink-900">{formatFechaHabil(parada.inicio)}</p>
                  <p className="text-xs text-ink-500">{formatRangoHoras(parada.inicio, parada.finProg)}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-500">Fin programado</p>
                  <p className="mt-0.5 font-medium text-ink-900">{formatFechaHabil(parada.finProg)}</p>
                  <p className="text-xs text-ink-500">{formatRangoHoras(parada.inicio, parada.finProg)}</p>
                </div>
              </div>
            </div>

            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-ink-900">Checklist de tareas</p>
                  <p className="text-xs text-ink-500">Marca las tareas ejecutadas. Para cumplir debe haber al menos una.</p>
                </div>
                <button
                  type="button"
                  onClick={handleMarcarTodas}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 text-xs font-semibold text-ink-700 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400"
                >
                  <ListChecks className="size-3.5" aria-hidden="true" />
                  {completadas === total ? 'Desmarcar todas' : 'Marcar todas'}
                </button>
              </div>

              <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-neutral-200">
                <div
                  className="h-full rounded-full bg-tertiary-500"
                  style={{ width: `${progreso}%` }}
                />
              </div>

              <div className="space-y-2">
                {parada.tareas.map((t) => (
                  <label
                    key={t.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
                      tareas[t.id] ? 'border-tertiary-200 bg-tertiary-50/40' : 'border-neutral-200 bg-white hover:bg-neutral-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={!!tareas[t.id]}
                      onChange={(e) => handleToggle(t.id, e.target.checked)}
                      aria-label={`Marcar ${t.nombre}`}
                      className="mt-0.5 size-4 rounded border-neutral-300 accent-primary-500 focus:ring-tertiary-400"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-ink-900">{t.nombre}</span>
                      <span className="block text-xs text-ink-500">{t.componente}</span>
                    </span>
                    <span className={`shrink-0 text-[11px] font-semibold ${tareas[t.id] ? 'text-tertiary-700' : 'text-ink-400'}`}>
                      {tareas[t.id] ? 'Ejecutada' : 'Pendiente'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="seguimiento-estado" className="mb-1 block text-xs font-semibold text-ink-500">
                  Estado del seguimiento
                </label>
                <select
                  id="seguimiento-estado"
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400"
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="En ejecución">En ejecución</option>
                </select>
                <p className="mt-1 text-[11px] text-ink-500">Vencida se calcula automáticamente si pasa el fin programado.</p>
              </div>
              <div>
                <label htmlFor="seguimiento-fin" className="mb-1 block text-xs font-semibold text-ink-500">
                  Finalización real
                </label>
                <input
                  id="seguimiento-fin"
                  type="datetime-local"
                  value={finReal}
                  min={toLocalInput(parada.inicio)}
                  max={toLocalInput(new Date())}
                  onChange={(e) => { setFinReal(e.target.value); setError('') }}
                  className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400"
                />
                <p className="mt-1 text-[11px] text-ink-500">
                  {minutos ? `Duración real: ${duracionTexto(minutos)}` : 'Obligatoria para cumplir la parada.'}
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="seguimiento-obs" className="mb-1 block text-xs font-semibold text-ink-500">
                Observaciones
              </label>
              <textarea
                id="seguimiento-obs"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Qué se encontró, qué se cambió…"
                rows={3}
                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400"
              />
            </div>

            {error && (
              <p className="rounded-xl border border-primary-200 bg-primary-50 px-3 py-2 text-sm font-medium text-primary-700" role="alert">
                {error}
              </p>
            )}
          </>
        )}

        {!loading && !parada && (
          <p className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-ink-500">
            No se encontró la parada seleccionada.
          </p>
        )}
      </Modal>

      <ConfirmDialog
        open={confirmCumplir}
        title="¿Cumplir esta parada?"
        message={`Se marcarán las ${total} tareas como ejecutadas y la parada quedará Cumplida con la finalización real registrada.`}
        confirmText={saving ? 'Cumpliendo…' : 'Sí, cumplir'}
        cancelText="Cancelar"
        variant="neutral"
        icon={CheckCircle2}
        busy={saving}
        onCancel={() => { if (!saving) setConfirmCumplir(false) }}
        onConfirm={handleCumplirTodas}
      />

      <FaltanTareasDialog
        open={faltanOpen}
        parada={parada}
        tareas={tareas}
        busy={saving}
        onClose={() => { if (!saving) setFaltanOpen(false) }}
        onCumplirAsi={handleCumplirAsi}
        onReprogramar={handleReprogramarRestantes}
      />
    </>
  )
}
