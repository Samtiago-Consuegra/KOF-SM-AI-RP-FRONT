import { useState } from 'react'
import { X, Pencil, Send, AlertTriangle } from 'lucide-react'
import { enviarTareaAParada } from '../../services/mantenimientoService.js'
import ProgramarParadaModal from './ProgramarParadaModal.jsx'
import { JERARQUIA } from '../../data/mock/historiaClinica.js'

export default function DetalleTareaModal({ open, onClose, tarea, paradas = [], onDone, onToast }) {
  const [edit, setEdit] = useState(false)
  const [paradaId, setParadaId] = useState(tarea?.paradaSugerida?.existe ? tarea.paradaSugerida.id : '')
  const [showDlg, setShowDlg] = useState(false)
  const [showProg, setShowProg] = useState(false)

  if (!open || !tarea) return null

  const disponibles = paradas.filter((p) => p.maquina === tarea.maquina)

  const enviar = async () => {
    if (!tarea.paradaSugerida?.existe && !paradaId) {
      setShowDlg(true)
      return
    }
    if (paradaId) {
      await enviarTareaAParada(tarea.id, { paradaId })
      onClose(); onDone?.(); onToast?.('Tarea enviada a la parada'); return
    }
    if (tarea.paradaSugerida?.existe && tarea.paradaSugerida?.id) {
      await enviarTareaAParada(tarea.id, { paradaId: tarea.paradaSugerida.id })
      onClose(); onDone?.(); onToast?.('Tarea enviada a la parada'); return
    }
    setShowDlg(true)
  }

  const crear = async () => {
    setShowDlg(false)
    setShowProg(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-ink-900/60 backdrop-blur-sm" onClick={onClose} />
      <div role="dialog" aria-modal="true" className="relative w-full max-w-[520px] bg-white rounded-2xl border border-neutral-200 shadow-xl mx-4">
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-ink-900">Detalle de la tarea</h2>
          <button onClick={onClose} aria-label="Cerrar" className="h-8 w-8 grid place-items-center rounded-lg hover:bg-neutral-100"><X className="size-4" /></button>
        </div>
        <div className="p-4 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-xs text-ink-500">Máquina</label><p className="text-sm text-ink-900">{tarea.maquina}</p></div>
            <div><label className="text-xs text-ink-500">Sistema</label><p className="text-sm text-ink-900">{tarea.sistema}</p></div>
          </div>
          <div><label className="text-xs text-ink-500">Componente a arreglar</label><p className="text-sm text-ink-900">{tarea.componente}</p></div>
          <div><label className="text-xs text-ink-500">Tarea</label><p className="text-sm text-ink-900">{tarea.tarea}</p></div>
          <div>
            <label className="text-xs text-ink-500">Parada sugerida</label>
            <p className="text-sm text-ink-900">{tarea.paradaSugerida?.existe ? 'Existe' : 'No existe'} {tarea.paradaSugerida?.dia ? '· ' + tarea.paradaSugerida.dia : ''}</p>
          </div>
          {edit && (
            <div>
              <label className="text-xs text-ink-500">Enviar a parada</label>
              <select value={paradaId} onChange={(e)=>setParadaId(e.target.value)} className="w-full h-9 rounded-lg border border-neutral-200 px-2 text-sm">
                <option value="">Seleccionar parada</option>
                {disponibles.map((p)=><option key={p.id} value={p.id}>{p.titulo} · {p.fecha} {p.horaInicio}-{p.horaFin}</option>)}
              </select>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between p-4 border-t border-neutral-200">
          <button onClick={()=>setEdit(!edit)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-neutral-200 px-3 text-sm hover:bg-neutral-50"><Pencil className="size-4" /> Personalizar</button>
          <button onClick={enviar} className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary-500 px-3 text-sm text-white hover:bg-primary-600"><Send className="size-4" /> Enviar a la parada</button>
        </div>
      </div>

      {showDlg && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-ink-900/60" />
          <div className="relative w-full max-w-[420px] bg-white rounded-2xl border border-neutral-200 shadow-xl mx-4">
            <div className="p-4 flex items-start gap-3">
              <div className="h-9 w-9 rounded-full bg-primary-50 grid place-items-center"><AlertTriangle className="size-4 text-primary-500" /></div>
              <div>
                <p className="text-base font-semibold text-ink-900">La parada no está creada</p>
                <p className="text-sm text-ink-700">¿Deseas crearla para enviar esta tarea?</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 p-4 border-t border-neutral-200">
              <button onClick={()=>setShowDlg(false)} className="h-9 px-3 rounded-lg border border-neutral-200 text-sm hover:bg-neutral-50">Cerrar</button>
              <button onClick={crear} className="h-9 px-3 rounded-lg bg-primary-500 text-white text-sm hover:bg-primary-600">Crear parada</button>
            </div>
          </div>
        </div>
      )}

      <ProgramarParadaModal 
        key={showProg ? 'prog-' + tarea.id : 'closed'}
        open={showProg} 
        onClose={()=>setShowProg(false)} 
        onCreated={async ()=>{ 
          setShowProg(false); 
          onClose(); 
          onDone?.(); 
          onToast?.('Parada creada y tarea asignada')
        }}
        onToast={onToast}
        precarga={(() => {
          let sistemaId = ''
          let sistemaNombre = tarea.sistema || ''
          const sis = (JERARQUIA[tarea.maquina] || []).find(s => s.nombre === tarea.sistema)
          if (sis) sistemaId = sis.id
          else {
            // try to find
            for (const s of (JERARQUIA[tarea.maquina] || [])) {
              if (s.componentes?.some(c => c.nombre === tarea.componente)) { sistemaId = s.id; sistemaNombre = s.nombre; break }
            }
          }
          const comp = (JERARQUIA[tarea.maquina] || []).flatMap(s => s.componentes || []).find(c => c.nombre === tarea.componente)
          return {
            titulo: tarea.tarea,
            fecha: new Date().toISOString().slice(0,10),
            horaInicio: '08:00',
            horaFin: '12:00',
            maquina: tarea.maquina,
            sistema: sistemaId || sistemaNombre,
            componente: comp?.id || tarea.componente,
            tipoTarea: 'Predictiva',
            cardInicial: {
              id: 'card-preload-' + Date.now(),
              maquina: tarea.maquina,
              sistemaId: sistemaId || sistemaNombre,
              sistemaNombre: sistemaNombre,
              componenteId: comp?.id || tarea.componente,
              componenteNombre: tarea.componente,
              estado: 'confirmada',
              tareas: [{ descripcion: tarea.tarea, tipo: 'Predictiva', id: 't-preload-' + Date.now() }]
            }
          }
        })()}
      />
    </div>
  )
}
