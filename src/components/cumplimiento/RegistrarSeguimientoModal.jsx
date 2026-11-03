import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import EstadoBadge from './EstadoBadge.jsx'
import { getParadaById } from '../../data/mock/cumplimiento'
import { registrarSeguimiento } from '../../services/cumplimientoService'
import { useToast } from '../../context/ToastContext'

export default function RegistrarSeguimientoModal({ open, onClose, paradaId, onSuccess }) {
  const toast = useToast()
  const modalRef = useRef(null)
  const closeBtnRef = useRef(null)
  const [parada, setParada] = useState(null)
  const [tareas, setTareas] = useState({})
  const [estado, setEstado] = useState('Pendiente')
  const [finReal, setFinReal] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [saving, setSaving] = useState(false)
  const [errorDuracion, setErrorDuracion] = useState('')
  
  useEffect(() => {
    if (open && paradaId) {
      const p = getParadaById(paradaId)
      setParada(p)
      if (p) {
        const t = {}
        p.tareas.forEach(x => { t[x.id] = x.completada })
        setTareas(t)
        setEstado(p.estado)
        setFinReal(p.finReal ? p.finReal.slice(0, 16) : '')
      }
      document.body.style.overflow = 'hidden'
      setTimeout(() => closeBtnRef.current?.focus(), 50)
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open, paradaId])
  
  useEffect(() => {
    if (!finReal || !parada) {
      setErrorDuracion('')
      return
    }
    const inicio = new Date(parada.inicio)
    const fin = new Date(finReal)
    if (fin < inicio) {
      setErrorDuracion('La finalización no puede ser anterior al inicio')
    } else {
      setErrorDuracion('')
    }
  }, [finReal, parada])
  
  const completadas = parada ? parada.tareas.filter(t => tareas[t.id]).length : 0
  const total = parada ? parada.tareas.length : 0
  const progreso = total === 0 ? 0 : Math.round((completadas / total) * 100)
  
  const duracionReal = () => {
    if (!finReal || !parada || errorDuracion) return null
    const inicio = new Date(parada.inicio)
    const fin = new Date(finReal)
    const diff = Math.round((fin - inicio) / 60000)
    return diff > 0 ? diff : 0
  }
  
  const handleClose = () => {
    if (saving) return
    onClose()
  }
  
  const handleSave = async () => {
    if (!parada || errorDuracion) return
    setSaving(true)
    try {
      await registrarSeguimiento(parada.id, {
        tareas,
        estado,
        finReal: finReal ? new Date(finReal).toISOString() : null,
        observaciones
      })
      toast('Seguimiento registrado', 'success')
      onSuccess && onSuccess()
      onClose()
    } catch (e) {
      toast('Error al guardar', 'error')
    } finally {
      setSaving(false)
    }
  }
  
  if (!open) return null
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-ink-900/60 backdrop-blur-sm" onClick={handleClose} />
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="registro-title"
        className="relative z-10 mx-4 max-h-[90vh] w-full max-w-[720px] overflow-y-auto rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <h2 id="registro-title" className="text-lg font-bold text-ink-900">Registrar seguimiento</h2>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={handleClose}
            aria-label="Cerrar"
            className="grid size-9 place-items-center rounded-xl hover:bg-neutral-100 text-ink-700"
          >
            <X className="size-5" />
          </button>
        </div>
        
        <div className="space-y-5 p-6">
          {!parada ? (
            <p className="text-sm text-ink-500">Selecciona una parada desde la tabla.</p>
          ) : (
            <>
              <div className="rounded-xl bg-neutral-50 p-4">
                <div className="grid gap-2 text-sm sm:grid-cols-2">
                  <div><span className="text-ink-500">Máquina:</span> <span className="font-medium text-ink-900">{parada.maquina}</span></div>
                  <div><span className="text-ink-500">Componente:</span> <span className="font-medium text-ink-900">{parada.componente}</span></div>
                  <div><span className="text-ink-500">Orden SAP:</span> <span className="font-medium text-ink-900">{parada.ordenSap}</span></div>
                  <div><span className="text-ink-500">Estado actual:</span> <EstadoBadge estado={parada.estado} /></div>
                  <div><span className="text-ink-500">Inicio programado:</span> <span className="font-medium text-ink-900">{new Date(parada.inicio).toLocaleString('es-CO')}</span></div>
                  <div><span className="text-ink-500">Fin programado:</span> <span className="font-medium text-ink-900">{new Date(parada.finProg).toLocaleString('es-CO')}</span></div>
                </div>
              </div>
              
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink-900">Checklist de tareas</p>
                  <p className="text-xs text-ink-500">{completadas} de {total} tareas completadas</p>
                </div>
                <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-neutral-200">
                  <div className="h-full bg-tertiary-500 transition-all" style={{ width: `${progreso}%` }} />
                </div>
                <div className="space-y-2">
                  {parada.tareas.map(t => (
                    <label key={t.id} className="flex items-center gap-3 rounded-xl border border-neutral-200 p-3 hover:bg-neutral-50">
                      <input
                        type="checkbox"
                        checked={!!tareas[t.id]}
                        onChange={(e) => setTareas(prev => ({ ...prev, [t.id]: e.target.checked }))}
                        className="size-4 rounded border-neutral-300 text-primary-500 focus:ring-tertiary-400"
                      />
                      <div>
                        <p className="text-sm text-ink-900">{t.nombre}</p>
                        <p className="text-xs text-ink-500">{t.componente}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-500">Cambiar estado</label>
                  <select
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm text-ink-900"
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="Vencida">Vencida</option>
                    <option value="En ejecución">En ejecución</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-500">Fecha y hora de finalización real</label>
                  <input
                    type="datetime-local"
                    value={finReal}
                    onChange={(e) => setFinReal(e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm text-ink-900"
                  />
                </div>
              </div>
              
              {errorDuracion && <p className="text-xs text-primary-600">{errorDuracion}</p>}
              {duracionReal() !== null && !errorDuracion && (
                <p className="text-sm font-semibold text-ink-900">Duración real: {duracionReal()} min</p>
              )}
              
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-500">Observaciones</label>
                <textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Qué se encontró, qué se cambió…"
                  rows={3}
                  className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm text-ink-900"
                />
              </div>
              
              <p className="text-xs text-ink-500">La duración real se guarda aparte de las fechas de la orden, para no depender del cierre en SAP.</p>
            </>
          )}
        </div>
        
        <div className="flex items-center justify-end gap-2 border-t border-neutral-200 px-6 py-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="rounded-xl bg-neutral-100 px-4 py-2 text-sm font-medium text-ink-700 hover:bg-neutral-200 disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!parada || errorDuracion || saving}
            className="rounded-xl bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-60"
          >
            {saving ? 'Guardando...' : 'Guardar registro'}
          </button>
        </div>
      </div>
    </div>
  )
}
