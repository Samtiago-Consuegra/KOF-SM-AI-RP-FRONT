import { useEffect, useMemo, useRef, useState } from 'react'
import { X, CornerDownLeft, ListPlus, Info, CalendarPlus, Factory, ListChecks } from 'lucide-react'
import { programarParada, actualizarParada } from '../../services/mantenimientoService.js'
import { MAQUINAS } from '../../data/mock/mantenimiento.js'
import { useProgramarParada } from '../../hooks/useProgramarParada.js'
import TareasComponenteCard from './TareasComponenteCard.jsx'
import CondicionParadaBadge from './CondicionParadaBadge.jsx'
import CondicionSelector from './CondicionSelector.jsx'
import ConfirmDialog from './ConfirmDialog.jsx'
import { inputCls, labelCls } from './modalFormStyles.js'

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
    condicion: parada.condicion || 'frio',
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

  const gruposPorMaquina = useMemo(() => {
    const map = new Map()
    hook.cards.forEach((card) => {
      const key = card.maquina || 'Sin máquina'
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(card)
    })
    return [...map.entries()]
  }, [hook.cards])

  const totalTareas = hook.cards.reduce((total, card) => total + card.tareas.length, 0)

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
        @keyframes card-group-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .card-group-anim { animation: card-group-in 220ms cubic-bezier(0.22, 1, 0.36, 1) both; }
        @media (prefers-reduced-motion: reduce) { .modal-anim { animation: none !important; } .shake { animation: none !important; } .card-group-anim { animation: none !important; } }
        .shake { animation: shake 400ms ease-in-out; }
      `}</style>
      <div className="absolute inset-0 bg-ink-900/60 backdrop-blur-sm" style={{ animation: 'fade-in 200ms ease-out' }} onClick={handleClose} />
      <div role="dialog" aria-modal="true" aria-labelledby="prog-title" className="modal-anim relative w-full max-w-[1180px] h-[92vh] max-h-[92vh] overflow-hidden bg-white rounded-2xl border border-neutral-200 shadow-xl mx-4 flex flex-col" style={{ animation: 'modal-in 250ms ease-out' }}>
        <div className="flex flex-wrap items-center justify-between gap-2 p-4 border-b border-neutral-200 flex-shrink-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h2 id="prog-title" className="text-lg font-semibold text-ink-900">{isEdit ? 'Editar parada' : 'Programar parada'}</h2>
            <CondicionParadaBadge condicion={hook.condicion} />
          </div>
          <button onClick={handleClose} aria-label="Cerrar" className="h-8 w-8 grid place-items-center rounded-lg hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400"><X className="size-4" /></button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain scroll-visible">
          <div className="grid lg:grid-cols-[360px_minmax(0,1fr)] xl:grid-cols-[390px_minmax(0,1fr)]">
            <section aria-label="Datos de la parada" className="p-4 pb-6 lg:border-r lg:border-neutral-200">
              <div className="mb-3 flex items-center gap-2">
                <span className="grid size-7 place-items-center rounded-lg bg-primary-50 text-primary-600"><CalendarPlus className="size-4" aria-hidden="true" /></span>
                <div>
                  <p className="text-sm font-semibold text-ink-900">Datos de la parada</p>
                  <p className="text-xs text-ink-500">Un horario para todas las máquinas.</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className={labelCls} htmlFor="parada-titulo">Título de la parada</label>
                  <input id="parada-titulo" value={hook.titulo} onChange={(e) => hook.setTitulo(e.target.value)} className={inputCls} />
                  {hook.errores.titulo && <p className="mt-1 text-xs text-primary-600">{hook.errores.titulo}</p>}
                </div>

                <div>
                  <label className={labelCls} htmlFor="parada-fecha">Fecha</label>
                  <input id="parada-fecha" type="date" value={hook.fecha} onChange={(e) => hook.setFecha(e.target.value)} className={inputCls} />
                  {hook.errores.fecha && <p className="mt-1 text-xs text-primary-600">{hook.errores.fecha}</p>}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelCls} htmlFor="parada-hora-inicio">Hora de inicio</label>
                    <input id="parada-hora-inicio" type="time" value={hook.horaInicio} onChange={(e) => hook.setHoraInicio(e.target.value)} className={inputCls} />
                    {hook.errores.horaInicio && <p className="mt-1 text-xs text-primary-600">{hook.errores.horaInicio}</p>}
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="parada-hora-fin">Hora de fin</label>
                    <input id="parada-hora-fin" type="time" value={hook.horaFin} onChange={(e) => hook.setHoraFin(e.target.value)} className={inputCls} />
                    {hook.errores.horaFin && <p className="mt-1 text-xs text-primary-600">{hook.errores.horaFin}</p>}
                  </div>
                </div>

                <div>
                  <span className={labelCls}>Condición de la parada</span>
                  <CondicionSelector value={hook.condicion} onChange={hook.setCondicion} />
                  {hook.errores.condicion && <p className="mt-1 text-xs text-primary-600">{hook.errores.condicion}</p>}
                  <p className="mt-1 text-[11px] text-ink-400">Independiente del tipo de tarea.</p>
                </div>

                <div className="border-t border-dashed border-neutral-300 pt-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Ubicación de la tarea</p>
                  <div className="space-y-3">
                    <div>
                      <label className={labelCls} htmlFor="parada-maquina">Máquina</label>
                      <select id="parada-maquina" value={hook.maquina} onChange={(e) => hook.setMaquina(e.target.value)} disabled={hook.editingCardId && hook.cards.find(c => c.id === hook.editingCardId)?.estado === 'edicion'} className={inputCls}>
                        <option value="">Seleccionar</option>
                        {MAQUINAS.map((m) => <option key={m} value={m}>{m}</option>)}
                      </select>
                      {hook.errores.maquina && <p className="mt-1 text-xs text-primary-600">{hook.errores.maquina}</p>}
                    </div>

                    <div>
                      <label className={labelCls} htmlFor="parada-sistema">Sistema</label>
                      <select id="parada-sistema" value={hook.sistema} onChange={(e) => hook.setSistema(e.target.value)} disabled={!hook.maquina || (hook.editingCardId && hook.cards.find(c => c.id === hook.editingCardId)?.estado === 'edicion')} className={inputCls}>
                        <option value="">Seleccionar</option>
                        {hook.sistemas.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                      </select>
                      {hook.errores.sistema && <p className="mt-1 text-xs text-primary-600">{hook.errores.sistema}</p>}
                    </div>

                    <div>
                      <label className={labelCls} htmlFor="parada-componente">Componente</label>
                      <select id="parada-componente" value={hook.componente} onChange={(e) => hook.setComponente(e.target.value)} disabled={!hook.sistema || (hook.editingCardId && hook.cards.find(c => c.id === hook.editingCardId)?.estado === 'edicion')} className={inputCls}>
                        <option value="">Seleccionar</option>
                        {hook.componentes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                      </select>
                      {hook.errores.componente && <p className="mt-1 text-xs text-primary-600">{hook.errores.componente}</p>}
                    </div>

                    <div>
                      <label className={labelCls} htmlFor="parada-tipo-tarea">Tipo de tarea</label>
                      <select id="parada-tipo-tarea" value={hook.tipoTarea} onChange={(e) => hook.setTipoTarea(e.target.value)} className={inputCls}>
                        <option>Preventiva</option>
                        <option>Correctiva</option>
                        <option>Predictiva</option>
                      </select>
                    </div>

                    <div>
                      <label className={labelCls} htmlFor="parada-tarea">Tarea</label>
                      <div className="relative">
                        <input id="parada-tarea" ref={tareaRef} value={hook.tareaInput} onChange={(e) => hook.setTareaInput(e.target.value)} onKeyDown={handleAddTareaKey} placeholder="Escribe la tarea y presiona Enter" className={`${inputCls} pr-8`} />
                        <CornerDownLeft className="absolute right-2 top-1/2 -translate-y-1/2 size-4 text-ink-400" aria-hidden="true" />
                      </div>
                      {hook.editingTask && <p className="mt-1 text-xs text-ink-500 flex items-center gap-1"><Info className="size-3" /> Presiona Enter para guardar el cambio o Escape para cancelar.</p>}
                      {!hook.editingTask && hook.cards.some(c => c.estado === 'edicion') && <p className="mt-1 text-xs text-ink-500 flex items-center gap-1"><Info className="size-3" /> Editando {hook.cards.find(c => c.estado === 'edicion')?.sistemaNombre} · {hook.cards.find(c => c.estado === 'edicion')?.componenteNombre}. Haz doble clic en una tarea para modificarla, o escribe una nueva y presiona Enter.</p>}
                      <p className="mt-1 text-xs text-ink-400">Escribe la tarea y presiona Enter para agregarla.</p>
                      {hook.msgTarea && <p className="text-xs text-ink-500" aria-live="polite">{hook.msgTarea}</p>}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section aria-label="Tareas por máquina" className="bg-neutral-50/60 p-4">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="grid size-7 place-items-center rounded-lg border border-neutral-200 bg-white text-ink-700"><ListChecks className="size-4" aria-hidden="true" /></span>
                  <div>
                    <p className="text-sm font-semibold text-ink-900">Tareas por máquina</p>
                    <p className="text-xs text-ink-500">{hook.cards.length} {hook.cards.length === 1 ? 'componente' : 'componentes'} · {totalTareas} {totalTareas === 1 ? 'tarea' : 'tareas'}</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-xs text-ink-600">
                  <Factory className="size-3.5" aria-hidden="true" />
                  {gruposPorMaquina.length} {gruposPorMaquina.length === 1 ? 'máquina' : 'máquinas'}
                </span>
              </div>

              {hook.cards.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-300 bg-white/70 px-4 py-10 text-center">
                  <ListPlus className="size-5 text-ink-400" aria-hidden="true" />
                  <p className="text-sm font-medium text-ink-700">Aún no hay tareas registradas.</p>
                  <p className="max-w-[36ch] text-xs text-ink-500">Selecciona máquina, sistema y componente a la izquierda, escribe la tarea y presiona Enter.</p>
                </div>
              ) : (
                <div className={`space-y-4 ${shake ? 'shake' : ''}`}>
                  {gruposPorMaquina.map(([maquina, cards], index) => {
                    const tareasMaquina = cards.reduce((total, card) => total + card.tareas.length, 0)
                    return (
                      <div key={maquina} className="card-group-anim" style={{ animationDelay: `${Math.min(index, 6) * 40}ms` }}>
                        <div className="mb-2 flex items-center gap-2">
                          <span className="grid size-7 place-items-center rounded-lg border border-neutral-200 bg-white text-ink-700"><Factory className="size-4" aria-hidden="true" /></span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-ink-900">{maquina}</p>
                            <p className="text-xs text-ink-500">{cards.length} {cards.length === 1 ? 'componente' : 'componentes'} · {tareasMaquina} {tareasMaquina === 1 ? 'tarea' : 'tareas'}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-2">
                          {cards.map(card => (
                            <TareasComponenteCard key={card.id} card={card} mostrarMaquina={false} editingCardId={hook.editingCardId} editingTask={hook.editingTask} onConfirmar={hook.confirmarCard} onEditar={hook.editarCard} onEliminarTarea={hook.eliminarTarea} onCargarTarea={hook.cargarTareaParaEditar} />
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 p-4 border-t border-neutral-200 flex-shrink-0">
          <p className="inline-flex items-center gap-1.5 text-xs text-ink-500">
            <Factory className="size-3.5" aria-hidden="true" />
            {gruposPorMaquina.length} {gruposPorMaquina.length === 1 ? 'máquina' : 'máquinas'} · {totalTareas} {totalTareas === 1 ? 'tarea' : 'tareas'}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={handleClose} className="h-9 px-3 rounded-lg bg-neutral-100 text-ink-700 text-sm hover:bg-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400">Cancelar</button>
            <button onClick={handleGuardar} disabled={saving} className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary-500 px-3 text-sm text-white hover:bg-primary-600 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400">
              <CalendarPlus className="size-4" /> {saving ? 'Guardando...' : (isEdit ? 'Guardar cambios' : 'Agregar parada')}
            </button>
          </div>
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
