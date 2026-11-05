import { useEffect, useRef, useState } from 'react'
import { X, CornerDownLeft, ListPlus, Info, CalendarPlus } from 'lucide-react'
import { programarParada, actualizarParada } from '../../services/mantenimientoService.js'
import { MAQUINAS } from '../../data/mock/mantenimiento.js'
import { useProgramarParada } from '../../hooks/useProgramarParada.js'
import TareasComponenteCard from './TareasComponenteCard.jsx'
import ConfirmDialog from './ConfirmDialog.jsx'

function buildPrecargaFromEdit(parada) {
  if (!parada) return null
  const tareas = parada.tareasDetalle || (parada.tareas || []).map(t => ({ descripcion: t, tipo: parada.tipo?.includes('Predictiva') ? 'Predictiva' : 'Preventiva', maquina: parada.maquina, sistema: '', sistemaId: '', componente: '', componenteId: '' }))
  // group by combo
  const map = {}
  tareas.forEach(t => {
    const key = `${t.maquina}|${t.sistemaId || t.sistema}|${t.componenteId || t.componente}`
    if (!map[key]) map[key] = { maquina: t.maquina, sistemaId: t.sistemaId || t.sistema, sistemaNombre: t.sistema || t.sistemaId, componenteId: t.componenteId || t.componente, componenteNombre: t.componente || t.componenteId, tareas: [] }
    map[key].tareas.push({ descripcion: t.descripcion, tipo: t.tipo, id: 't-' + Math.random().toString(36).slice(2) })
  })
  const cards = Object.values(map).map((g, i) => ({ id: 'card-edit-' + i, ...g, estado: 'confirmada' }))
  return {
    titulo: parada.titulo,
    fecha: parada.fecha,
    horaInicio: parada.horaInicio,
    horaFin: parada.horaFin,
    maquina: parada.maquina || cards[0]?.maquina || '',
    sistema: cards[0]?.sistemaId || '',
    componente: cards[0]?.componenteId || '',
    tipoTarea: cards[0]?.tareas[0]?.tipo || 'Preventiva',
    cardsIniciales: cards,
  }
}

export default function ProgramarParadaModal({ open, onClose, onCreated, editParada = null, precarga = null, onToast }) {
  const isEdit = !!editParada
  const initial = isEdit ? buildPrecargaFromEdit(editParada) : precarga
  const hook = useProgramarParada({ initialPrecarga: initial })
  const [saving, setSaving] = useState(false)
  const [shake, setShake] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)
  const tareaRef = useRef(null)
  const dirtyRef = useRef(false)

  useEffect(() => {
    if (open) {
      dirtyRef.current = false
    }
  }, [open])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && open && !confirmClose) {
        if (hasData()) setConfirmClose(true)
        else onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, confirmClose])

  const hasData = () => hook.titulo || hook.tareaInput || hook.cards.length > 0 || hook.fecha || hook.horaInicio || hook.horaFin

  const handleClose = () => {
    if (hasData()) setConfirmClose(true)
    else onClose()
  }

  const handleAddTareaKey = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      hook.handleAddTarea()
      tareaRef.current?.focus()
    }
    if (e.key === 'Escape' && hook.editingTask) {
      e.preventDefault()
      hook.cancelarEdicionTarea()
    }
  }

  const handleGuardar = async () => {
    if (!hook.validarParaGuardar()) {
      const hayAbiertasOEdicion = hook.cards.some(c => c.estado === 'abierta' || c.estado === 'edicion')
      if (hayAbiertasOEdicion) {
        setShake(true)
        setTimeout(() => setShake(false), 600)
        onToast?.('Confirma las tareas de todos los componentes antes de agregar la parada')
      }
      return
    }
    setSaving(true)
    const data = hook.getParadaData()
    try {
      if (isEdit) {
        await actualizarParada(editParada.id, data)
        onToast?.('Parada actualizada')
      } else {
        await programarParada(data)
        onToast?.('Parada programada')
      }
      onClose()
      onCreated?.()
    } catch {
      onToast?.('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <style>{`
        @keyframes modal-in { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
        @media (prefers-reduced-motion: reduce) { .modal-anim { animation: none !important; } .shake { animation: none !important; } }
        .shake { animation: shake 400ms ease-in-out; }
      `}</style>
      <div className="absolute inset-0 bg-ink-900/60 backdrop-blur-sm" style={{ animation: 'fade-in 200ms ease-out' }} onClick={handleClose} />
      <div role="dialog" aria-modal="true" aria-labelledby="prog-title" className="modal-anim relative w-full max-w-[880px] max-h-[90vh] bg-white rounded-2xl border border-neutral-200 shadow-xl mx-4 flex flex-col" style={{ animation: 'modal-in 250ms ease-out' }}>
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 flex-shrink-0">
          <h2 id="prog-title" className="text-lg font-semibold text-ink-900">{isEdit ? 'Editar parada' : 'Programar parada'}</h2>
          <button onClick={handleClose} aria-label="Cerrar" className="h-8 w-8 grid place-items-center rounded-lg hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400"><X className="size-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <p className="text-sm font-semibold text-ink-900 mb-2">Formulario</p>
            <div className="grid md:grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-ink-500">Título de la parada</label>
                <input value={hook.titulo} onChange={(e) => hook.setTitulo(e.target.value)} className="w-full h-9 rounded-lg border border-neutral-200 px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400" />
                {hook.errores.titulo && <p className="text-xs text-primary-600">{hook.errores.titulo}</p>}
              </div>
              <div>
                <label className="text-xs text-ink-500">Fecha</label>
                <input type="date" value={hook.fecha} onChange={(e) => hook.setFecha(e.target.value)} className="w-full h-9 rounded-lg border border-neutral-200 px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400" />
                {hook.errores.fecha && <p className="text-xs text-primary-600">{hook.errores.fecha}</p>}
              </div>
              <div>
                <label className="text-xs text-ink-500">Hora de inicio</label>
                <input type="time" value={hook.horaInicio} onChange={(e) => hook.setHoraInicio(e.target.value)} className="w-full h-9 rounded-lg border border-neutral-200 px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400" />
                {hook.errores.horaInicio && <p className="text-xs text-primary-600">{hook.errores.horaInicio}</p>}
              </div>
              <div>
                <label className="text-xs text-ink-500">Hora de fin</label>
                <input type="time" value={hook.horaFin} onChange={(e) => hook.setHoraFin(e.target.value)} className="w-full h-9 rounded-lg border border-neutral-200 px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400" />
                {hook.errores.horaFin && <p className="text-xs text-primary-600">{hook.errores.horaFin}</p>}
              </div>
              <div>
                <label className="text-xs text-ink-500">Máquina</label>
                <select value={hook.maquina} onChange={(e) => hook.setMaquina(e.target.value)} disabled={hook.editingCardId && hook.cards.find(c => c.id === hook.editingCardId)?.estado === 'edicion'} className="w-full h-9 rounded-lg border border-neutral-200 px-2 text-sm disabled:bg-neutral-50 disabled:text-ink-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400">
                  <option value="">Seleccionar</option>
                  {MAQUINAS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                {hook.errores.maquina && <p className="text-xs text-primary-600">{hook.errores.maquina}</p>}
              </div>
              <div>
                <label className="text-xs text-ink-500">Sistema</label>
                <select value={hook.sistema} onChange={(e) => hook.setSistema(e.target.value)} disabled={!hook.maquina || (hook.editingCardId && hook.cards.find(c => c.id === hook.editingCardId)?.estado === 'edicion')} className="w-full h-9 rounded-lg border border-neutral-200 px-2 text-sm disabled:bg-neutral-50 disabled:text-ink-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400">
                  <option value="">Seleccionar</option>
                  {hook.sistemas.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
                {hook.errores.sistema && <p className="text-xs text-primary-600">{hook.errores.sistema}</p>}
              </div>
              <div>
                <label className="text-xs text-ink-500">Componente</label>
                <select value={hook.componente} onChange={(e) => hook.setComponente(e.target.value)} disabled={!hook.sistema || (hook.editingCardId && hook.cards.find(c => c.id === hook.editingCardId)?.estado === 'edicion')} className="w-full h-9 rounded-lg border border-neutral-200 px-2 text-sm disabled:bg-neutral-50 disabled:text-ink-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400">
                  <option value="">Seleccionar</option>
                  {hook.componentes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
                {hook.errores.componente && <p className="text-xs text-primary-600">{hook.errores.componente}</p>}
              </div>
              <div>
                <label className="text-xs text-ink-500">Tipo de tarea</label>
                <select value={hook.tipoTarea} onChange={(e) => hook.setTipoTarea(e.target.value)} className="w-full h-9 rounded-lg border border-neutral-200 px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400">
                  <option>Preventiva</option>
                  <option>Correctiva</option>
                  <option>Predictiva</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-ink-500">Tarea</label>
                <div className="relative">
                  <input ref={tareaRef} value={hook.tareaInput} onChange={(e) => hook.setTareaInput(e.target.value)} onKeyDown={handleAddTareaKey} placeholder="Escribe la tarea y presiona Enter" className="w-full h-9 rounded-lg border border-neutral-200 px-2 pr-8 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400" />
                  <CornerDownLeft className="absolute right-2 top-1/2 -translate-y-1/2 size-4 text-ink-400" />
                </div>
                {hook.editingTask && <p className="mt-1 text-xs text-ink-500 flex items-center gap-1"><Info className="size-3" /> Presiona Enter para guardar el cambio o Escape para cancelar.</p>}
                {!hook.editingTask && hook.cards.some(c => c.estado === 'edicion') && <p className="mt-1 text-xs text-ink-500 flex items-center gap-1"><Info className="size-3" /> Editando {hook.cards.find(c => c.estado === 'edicion')?.sistemaNombre} · {hook.cards.find(c => c.estado === 'edicion')?.componenteNombre}. Haz doble clic en una tarea para modificarla, o escribe una nueva y presiona Enter.</p>}
                <p className="text-xs text-ink-400">Escribe la tarea y presiona Enter para agregarla</p>
                {hook.msgTarea && <p className="text-xs text-ink-500" aria-live="polite">{hook.msgTarea}</p>}
              </div>
            </div>
          </div>

          <div className="border-t border-dashed border-neutral-300 pt-4">
            <p className="text-sm font-semibold text-ink-900 mb-2">Tareas por componente</p>
            {hook.cards.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-6 text-ink-400">
                <ListPlus className="size-5" />
                <p className="text-sm">Aún no hay tareas. Agrega la primera desde el campo Tarea.</p>
              </div>
            ) : (
              <div className={`grid md:grid-cols-2 gap-2 ${shake ? 'shake' : ''}`}>
                {hook.cards.map(card => (
                  <TareasComponenteCard key={card.id} card={card} editingCardId={hook.editingCardId} editingTask={hook.editingTask} onConfirmar={hook.confirmarCard} onEditar={hook.editarCard} onEliminarTarea={hook.eliminarTarea} onCargarTarea={hook.cargarTareaParaEditar} />
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 p-4 border-t border-neutral-200 flex-shrink-0">
          <button onClick={handleClose} className="h-9 px-3 rounded-lg bg-neutral-100 text-ink-700 text-sm hover:bg-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400">Cancelar</button>
          <button onClick={handleGuardar} disabled={saving} className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary-500 px-3 text-sm text-white hover:bg-primary-600 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400">
            <CalendarPlus className="size-4" /> {saving ? 'Guardando...' : (isEdit ? 'Guardar cambios' : 'Agregar parada')}
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmClose}
        variant="neutral"
        title={isEdit ? '¿Cerrar y descartar los cambios?' : '¿Cerrar y descartar la parada?'}
        message={isEdit ? 'Se perderán los cambios que no hayas guardado.' : 'Se perderán los datos y las tareas que ingresaste.'}
        confirmText="Aceptar"
        cancelText="Seguir editando"
        onCancel={() => setConfirmClose(false)}
        onConfirm={() => { setConfirmClose(false); onClose() }}
      />
    </div>
  )
}
