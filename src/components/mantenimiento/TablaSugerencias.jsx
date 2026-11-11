import { useState } from 'react'
import { Eye, CalendarRange, ListTodo, HardHat, Clock3, Undo2, Loader2, Check, FileSearch, Wrench } from 'lucide-react'
import { posponerTarea, deshacerDecisionTarea } from '../../services/mantenimientoService.js'
import DetallePlanModal from './DetallePlanModal.jsx'
import DetalleTareaModal from './DetalleTareaModal.jsx'

const PRIOR = {
  'Crítica': 'bg-primary-500 text-white',
  Alta: 'bg-primary-50 text-primary-600',
  Media: 'bg-ink-100 text-ink-700',
  Baja: 'bg-tertiary-50 text-tertiary-700',
}

const ESTADO = {
  'Enviada a la parada': 'bg-tertiary-50 text-tertiary-700 border-tertiary-200',
  'Pospuesta por el usuario': 'bg-neutral-100 text-ink-600 border-neutral-200',
  'Sin espacio: pasa a la siguiente semana': 'bg-amber-50 text-amber-700 border-amber-200',
  'Requiere parada dedicada': 'bg-primary-50 text-primary-600 border-primary-100',
  'Verificar: atrasada o sin cerrar en SAP': 'bg-amber-50 text-amber-700 border-amber-200',
}

const TH = 'text-left px-4 py-2 text-xs font-medium text-ink-500'

function PrioridadChip({ prioridad }) {
  return <span className={'inline-flex px-2 py-0.5 rounded-full text-xs whitespace-nowrap ' + (PRIOR[prioridad] || 'bg-neutral-100 text-ink-700')}>{prioridad || '—'}</span>
}

function EstadoChip({ estado }) {
  if (!estado) return <span className="text-ink-400">—</span>
  return <span className={'ts-chip inline-flex px-2 py-0.5 rounded-full border text-xs ' + (ESTADO[estado] || 'bg-neutral-50 text-ink-600 border-neutral-200')}>{estado}</span>
}

function ContratistaChip() {
  return (
    <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-700 align-middle">
      <HardHat className="size-3" aria-hidden="true" /> Contratista
    </span>
  )
}

function DecisionBoton({ tarea, onAccion, onToast }) {
  const [estado, setEstado] = useState('idle') // idle | cargando | ok
  const deshacer = tarea.decidida
  const run = async () => {
    if (estado !== 'idle') return
    setEstado('cargando')
    try {
      if (deshacer) await deshacerDecisionTarea(tarea.id)
      else await posponerTarea(tarea.id, tarea.semana)
      setEstado('ok')
      onToast?.(deshacer ? 'Decisión deshecha' : 'Tarea pospuesta')
      setTimeout(() => { setEstado('idle'); onAccion?.() }, 650)
    } catch (e) {
      setEstado('idle')
      onToast?.({ message: e?.message || 'No se pudo registrar la decisión', variant: 'error' })
    }
  }
  const Icon = estado === 'cargando' ? Loader2 : estado === 'ok' ? Check : deshacer ? Undo2 : Clock3
  return (
    <button
      onClick={run}
      disabled={estado !== 'idle'}
      aria-busy={estado === 'cargando'}
      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 text-xs text-ink-700 hover:bg-neutral-50 hover:border-neutral-300 active:scale-[0.97] transition-[background-color,border-color,transform] duration-150 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400"
    >
      <span className="inline-grid size-3.5 place-items-center" key={estado}>
        <Icon className={`size-3.5 ${estado === 'cargando' ? 'animate-spin' : ''} ${estado === 'ok' ? 'text-tertiary-600 ts-pop' : ''}`} aria-hidden="true" />
      </span>
      {deshacer ? 'Deshacer' : 'Posponer'}
    </button>
  )
}

function VerBoton({ onClick, label = 'Ver detalles' }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1 text-xs text-ink-600 hover:text-ink-900 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400 rounded whitespace-nowrap">
      <Eye className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" /> {label}
    </button>
  )
}

function Vacio({ texto }) {
  return <p className="ts-vacio px-4 py-6 text-center text-sm text-ink-400">{texto}</p>
}

function BloqueLista({ titulo, descripcion, icon: Icon, items, delay = 0 }) {
  return (
    <section className="ts-bloque bg-white rounded-2xl border border-neutral-200" style={{ animationDelay: `${delay}ms` }} aria-label={titulo}>
      <div className="flex items-center gap-2 p-4 border-b border-neutral-200">
        <span className="grid size-8 place-items-center rounded-lg bg-neutral-100 text-ink-700"><Icon className="size-4" aria-hidden="true" /></span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-ink-900">{titulo}</h3>
          <p className="text-xs text-ink-500">{descripcion}</p>
        </div>
        <span className="ml-auto inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-neutral-100 px-1.5 text-xs text-ink-500">{items.length}</span>
      </div>
      {items.length === 0 ? <Vacio texto="Nada pendiente esta semana" /> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className={TH}>PRIORIDAD</th>
                <th className={TH}>MÁQUINA · COMPONENTE</th>
                <th className={TH}>TAREA</th>
                <th className={TH}>ORDEN / PLAN</th>
                <th className={TH}>ESTADO</th>
              </tr>
            </thead>
            <tbody>
              {items.map((t, i) => (
                <tr key={t.id} className="ts-row border-b border-neutral-100 hover:bg-neutral-50/50 transition-colors" style={{ animationDelay: `${Math.min(i, 10) * 30}ms` }}>
                  <td className="px-4 py-2"><PrioridadChip prioridad={t.prioridad} /></td>
                  <td className="px-4 py-2 text-ink-900">{[t.maquina, t.componente || t.grupo].filter(Boolean).join(' · ')}{t.conContratista && <ContratistaChip />}</td>
                  <td className="px-4 py-2 text-ink-700">{t.tarea}</td>
                  <td className="px-4 py-2 text-ink-700 whitespace-nowrap">{[t.orden, t.plan].filter(Boolean).join(' · ') || t.claseOrden || '—'}</td>
                  <td className="px-4 py-2"><EstadoChip estado={t.estado} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default function TablaSugerencias({ plan = [], tareas = [], paradas = [], onRefresh, onAccion, onToast }) {
  const [tab, setTab] = useState('plan')
  const [selPlan, setSelPlan] = useState(null)
  const [selTarea, setSelTarea] = useState(null)
  const porVerificar = tareas.porVerificar || []
  const fueraDeParada = tareas.fueraDeParada || []
  const tareasLista = Array.isArray(tareas) ? tareas : []
  const accion = onAccion || onRefresh

  const tabs = [
    { id: 'plan', label: 'Plan sugerido de la semana', icon: CalendarRange, count: plan.length },
    { id: 'tareas', label: 'Tareas sugeridas', icon: ListTodo, count: tareasLista.length },
  ]

  const onKey = (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault()
      setTab(tab === 'plan' ? 'tareas' : 'plan')
    }
  }

  const paradaTexto = (p) => {
    if (!p.idParada) return '—'
    const d = p.parada || {}
    return [d.dia, d.horaInicio && d.horaFin ? `${d.horaInicio}–${d.horaFin}` : ''].filter(Boolean).join(' · ') || p.idParada
  }

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes tab-fade { from { opacity: 0; transform: translateX(8px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes ts-row-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes ts-pop { 0% { transform: scale(0.6); opacity: 0; } 60% { transform: scale(1.15); opacity: 1; } 100% { transform: scale(1); } }
        @keyframes ts-chip-in { from { opacity: 0; } to { opacity: 1; } }
        .ts-row { animation: ts-row-in 220ms cubic-bezier(0.22,1,0.36,1) both; }
        .ts-bloque { animation: ts-row-in 320ms cubic-bezier(0.22,1,0.36,1) both; }
        .ts-pop { animation: ts-pop 280ms cubic-bezier(0.22,1,0.36,1) both; }
        .ts-chip, .ts-vacio { animation: ts-chip-in 200ms ease-out both; }
        @media (prefers-reduced-motion: reduce) { .tab-anim, .ts-row, .ts-bloque, .ts-pop, .ts-chip, .ts-vacio { animation: none !important; } }
      `}</style>

      <div className="bg-white rounded-2xl border border-neutral-200">
        <div className="p-4 border-b border-neutral-200">
          <div role="tablist" aria-label="Sugerencias" className="flex flex-wrap gap-2" onKeyDown={onKey}>
            {tabs.map((t) => {
              const Icon = t.icon
              const active = tab === t.id
              return (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={active}
                  aria-controls={'panel-' + t.id}
                  id={'tab-' + t.id}
                  onClick={() => setTab(t.id)}
                  className={`inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400 ${active ? 'bg-ink-900 text-white' : 'bg-white border border-neutral-200 text-ink-700 hover:bg-neutral-50 hover:border-neutral-300'}`}
                >
                  <Icon className="size-4" />
                  {t.label}
                  <span className={`inline-flex min-w-5 h-5 items-center justify-center rounded-full px-1 text-xs ${active ? 'bg-white/20 text-white' : 'bg-neutral-100 text-ink-500'}`}>{t.count}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div id={'panel-' + tab} key={tab} role="tabpanel" aria-labelledby={'tab-' + tab} className="tab-anim" style={{ animation: 'tab-fade 250ms ease-out' }}>
          {tab === 'plan' && (plan.length === 0 ? <Vacio texto="El motor no sugirió tareas para esta semana" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className={TH}>PRIORIDAD</th>
                    <th className={TH}>MÁQUINA · COMPONENTE</th>
                    <th className={TH}>TAREA</th>
                    <th className={TH}>CLASE DE ORDEN</th>
                    <th className={TH}>PARADA</th>
                    <th className={TH}>ESTADO</th>
                    <th className="px-4 py-2"><span className="sr-only">Acciones</span></th>
                  </tr>
                </thead>
                <tbody>
                  {plan.map((p, i) => (
                    <tr key={p.id} className="ts-row border-b border-neutral-100 hover:bg-neutral-50/50 transition-colors" style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}>
                      <td className="px-4 py-2"><PrioridadChip prioridad={p.prioridad} /></td>
                      <td className="px-4 py-2 text-ink-900">{p.maquina} · {p.componente || p.grupo}{p.conContratista && <ContratistaChip />}</td>
                      <td className="px-4 py-2 text-ink-700">{p.tarea}</td>
                      <td className="px-4 py-2 text-ink-700">{p.claseOrden || '—'}</td>
                      <td className="px-4 py-2 text-ink-700 whitespace-nowrap">{paradaTexto(p)}</td>
                      <td className="px-4 py-2"><EstadoChip estado={p.estado} /></td>
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-end gap-3">
                          <DecisionBoton key={p.id + p.estado} tarea={p} onAccion={accion} onToast={onToast} />
                          <VerBoton onClick={() => setSelPlan(p)} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          {tab === 'tareas' && (tareasLista.length === 0 ? <Vacio texto="Todas las tareas tienen parada esta semana" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className={TH}>PRIORIDAD</th>
                    <th className={TH}>TAREA</th>
                    <th className={TH}>COMPONENTE</th>
                    <th className={TH}>MÁQUINA</th>
                    <th className={TH}>ESTADO</th>
                    <th className="px-4 py-2"><span className="sr-only">Acciones</span></th>
                  </tr>
                </thead>
                <tbody>
                  {tareasLista.map((t, i) => (
                    <tr key={t.id} className="ts-row border-b border-neutral-100 hover:bg-neutral-50/50 transition-colors" style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}>
                      <td className="px-4 py-2"><PrioridadChip prioridad={t.prioridad} /></td>
                      <td className="px-4 py-2 text-ink-900">{t.tarea}{t.conContratista && <ContratistaChip />}</td>
                      <td className="px-4 py-2 text-ink-700">{t.componente || t.grupo}</td>
                      <td className="px-4 py-2 text-ink-700">{t.maquina}</td>
                      <td className="px-4 py-2"><EstadoChip estado={t.estado} /></td>
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-end gap-3">
                          <DecisionBoton key={t.id + t.estado} tarea={t} onAccion={accion} onToast={onToast} />
                          <VerBoton onClick={() => setSelTarea(t)} label="Más detalles" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>

      {tab === 'tareas' && (
        <div className="grid gap-6 xl:grid-cols-2">
          <BloqueLista titulo="Órdenes por verificar en SAP" descripcion="Abiertas de la semana anterior: probablemente hechas y sin cerrar." icon={FileSearch} items={porVerificar} />
          <BloqueLista titulo="Fuera de parada" descripcion="Rutinas del operador y acciones de gestión." icon={Wrench} items={fueraDeParada} delay={60} />
        </div>
      )}

      <DetallePlanModal open={!!selPlan} onClose={() => setSelPlan(null)} item={selPlan} onDone={() => { setSelPlan(null); accion?.() }} onToast={onToast} />
      <DetalleTareaModal open={!!selTarea} onClose={() => setSelTarea(null)} tarea={selTarea} paradas={paradas} onDone={() => { setSelTarea(null); accion?.() }} onToast={onToast} />
    </div>
  )
}
