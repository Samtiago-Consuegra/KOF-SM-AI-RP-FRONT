import { Check, Pencil, X, CheckCircle2 } from 'lucide-react'

const TIPOS_BADGE = {
  Preventiva: 'bg-tertiary-50 text-tertiary-700',
  Correctiva: 'bg-primary-50 text-primary-600',
  Predictiva: 'bg-ink-100 text-ink-700',
}

export default function TareasComponenteCard({ card, editingCardId, editingTask, onConfirmar, onEditar, onEliminarTarea, onCargarTarea, onMouseEnterTarea }) {
  const isEditing = card.estado === 'edicion'
  const isConfirmada = card.estado === 'confirmada'
  const isAbierta = card.estado === 'abierta'

  const getBorderClass = () => {
    if (isEditing) return 'border-primary-500'
    if (isConfirmada) return 'border-neutral-200'
    return 'border-dashed border-neutral-300'
  }

  const getBgClass = () => {
    if (isEditing) return 'bg-primary-50/40'
    return 'bg-white'
  }

  return (
    <div className={`rounded-xl border ${getBorderClass()} ${getBgClass()} p-3 relative transition-all`} style={isEditing ? { animation: 'pulse-soft 2000ms ease-in-out infinite' } : {}}>
      <style>{`
        @keyframes pulse-soft { 0%,100% { box-shadow: 0 0 0 0 rgba(244,0,0,0.0); } 50% { box-shadow: 0 0 0 4px rgba(244,0,0,0.05); } }
      `}</style>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-ink-500">{card.maquina}</p>
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-ink-900">{card.sistemaNombre} · {card.componenteNombre}</p>
            {isConfirmada && <CheckCircle2 className="size-4 text-tertiary-600" />}
          </div>
        </div>
      </div>
      <div className="mt-2 space-y-1.5">
        {card.tareas.map((tarea, idx) => {
          const isTaskEditing = editingTask?.cardId === card.id && editingTask?.taskIndex === idx
          return (
            <div
              key={tarea.id || idx}
              tabIndex={isEditing ? 0 : -1}
              onDoubleClick={() => {
                if (!isEditing) {
                  // show tooltip via title
                } else {
                  onCargarTarea(card.id, idx)
                }
              }}
              onKeyDown={(e) => {
                if (!isEditing) return
                if (e.key === 'Enter' || e.key === 'F2') {
                  e.preventDefault()
                  onCargarTarea(card.id, idx)
                }
              }}
              className={`flex items-center justify-between rounded-lg px-2 py-1.5 group ${isTaskEditing ? 'bg-primary-100' : 'hover:bg-neutral-50'}`}
              title={!isEditing ? 'Pulsa Editar para modificar esta tarea' : ''}
            >
              <p className="text-sm text-ink-700 flex-1 mr-2">{tarea.descripcion}</p>
              <div className="flex items-center gap-1.5">
                <span className={`inline-flex px-1.5 py-0.5 rounded-full text-xs ${TIPOS_BADGE[tarea.tipo] || 'bg-neutral-100 text-ink-700'}`}>{tarea.tipo}</span>
                {isEditing && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onEliminarTarea(card.id, idx) }}
                    aria-label="Eliminar tarea"
                    className="opacity-0 group-hover:opacity-100 h-5 w-5 grid place-items-center rounded hover:bg-primary-50"
                  >
                    <X className="size-3 text-primary-600" />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs text-ink-500">{card.tareas.length} tareas</p>
        <button
          onClick={() => isConfirmada ? onEditar(card.id) : onConfirmar(card.id)}
          aria-label={isConfirmada ? `Editar tareas de ${card.sistemaNombre} · ${card.componenteNombre}` : `Confirmar tareas de ${card.sistemaNombre} · ${card.componenteNombre}`}
          className={`h-7 px-2 rounded-lg border text-xs inline-flex items-center gap-1 ${isConfirmada ? 'border-ink-200 text-ink-700 hover:bg-ink-50' : 'border-tertiary-600 text-tertiary-700 hover:bg-tertiary-50'}`}
          title={isConfirmada ? 'Editar tareas de este componente' : 'Confirmar tareas de este componente'}
        >
          {isConfirmada ? <Pencil className="size-3" /> : <Check className="size-3" />}
          {isConfirmada ? 'Editar' : 'Confirmar'}
        </button>
      </div>
    </div>
  )
}
