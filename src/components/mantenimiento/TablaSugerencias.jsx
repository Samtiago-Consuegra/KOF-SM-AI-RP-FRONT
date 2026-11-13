import { useEffect, useState } from 'react'
import { Eye, CalendarRange, ListTodo } from 'lucide-react'
import DetallePlanModal from './DetallePlanModal.jsx'
import DetalleTareaModal from './DetalleTareaModal.jsx'
import Paginacion from '../ui/Paginacion.jsx'
import OrigenBadge from './OrigenBadge.jsx'

const PAGE_SIZE = 6

const PRIOR = {
  Alta: 'bg-primary-50 text-primary-600',
  Media: 'bg-ink-100 text-ink-700',
  Baja: 'bg-tertiary-50 text-tertiary-700',
}

export default function TablaSugerencias({ plan = [], tareas = [], paradas = [], onRefresh, onToast }) {
  const [tab, setTab] = useState('plan')
  const [selPlan, setSelPlan] = useState(null)
  const [selTarea, setSelTarea] = useState(null)
  const [pagePlan, setPagePlan] = useState(1)
  const [pageTarea, setPageTarea] = useState(1)

  const planSorted = [...plan].sort((a, b) => (a.prioridad === 'Alta' ? 0 : a.prioridad === 'Media' ? 1 : 2) - (b.prioridad === 'Alta' ? 0 : b.prioridad === 'Media' ? 1 : 2))
  const tareasSorted = [...tareas].sort((a, b) => (a.prioridad === 'Alta' ? 0 : a.prioridad === 'Media' ? 1 : 2) - (b.prioridad === 'Alta' ? 0 : b.prioridad === 'Media' ? 1 : 2))

  const totalPlan = planSorted.length
  const totalTareas = tareasSorted.length
  const totalPagesPlan = Math.max(1, Math.ceil(totalPlan / PAGE_SIZE))
  const totalPagesTareas = Math.max(1, Math.ceil(totalTareas / PAGE_SIZE))
  const pagePlanSafe = Math.min(pagePlan, totalPagesPlan)
  const pageTareaSafe = Math.min(pageTarea, totalPagesTareas)
  const inicioPlan = (pagePlanSafe - 1) * PAGE_SIZE
  const inicioTareas = (pageTareaSafe - 1) * PAGE_SIZE
  const planVisibles = planSorted.slice(inicioPlan, inicioPlan + PAGE_SIZE)
  const tareasVisibles = tareasSorted.slice(inicioTareas, inicioTareas + PAGE_SIZE)
  const fromPlan = totalPlan === 0 ? 0 : inicioPlan + 1
  const toPlan = Math.min(inicioPlan + PAGE_SIZE, totalPlan)
  const fromTareas = totalTareas === 0 ? 0 : inicioTareas + 1
  const toTareas = Math.min(inicioTareas + PAGE_SIZE, totalTareas)

  useEffect(() => { setPagePlan(1) }, [totalPlan])
  useEffect(() => { setPageTarea(1) }, [totalTareas])

  const tabs = [
    { id: 'plan', label: 'Plan sugerido de la semana', icon: CalendarRange, count: planSorted.length },
    { id: 'tareas', label: 'Tareas sugeridas', icon: ListTodo, count: tareasSorted.length },
  ]

  const onKey = (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault()
      setTab(tab === 'plan' ? 'tareas' : 'plan')
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-neutral-200">
      <style>{`
        @keyframes tab-fade { from { opacity: 0; transform: translateX(8px); } to { opacity: 1; transform: translateX(0); } }
        @media (prefers-reduced-motion: reduce) { .tab-anim { animation: none !important; } }
      `}</style>
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

      <div id={'panel-' + tab} role="tabpanel" aria-labelledby={'tab-' + tab} className="tab-anim" style={{ animation: 'tab-fade 250ms ease-out' }}>
        {tab === 'plan' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left px-4 py-2 text-xs text-ink-500">PRIORIDAD</th>
                  <th className="text-left px-4 py-2 text-xs text-ink-500">MÁQUINA · COMPONENTE</th>
                  <th className="text-left px-4 py-2 text-xs text-ink-500">TAREA</th>
                  <th className="text-left px-4 py-2 text-xs text-ink-500">CLASE DE ORDEN</th>
                  <th className="hidden md:table-cell text-left px-4 py-2 text-xs text-ink-500">ORIGEN</th>
                  <th className="text-left px-4 py-2 text-xs text-ink-500">PARADA</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {planVisibles.map((p, i) => (
                  <tr key={p.id} className="border-b border-neutral-100 hover:bg-neutral-50/50 transition-colors" style={{ animation: `fade-up 220ms ease-out ${i * 30}ms both` }}>
                    <td className="px-4 py-2"><span className={'inline-flex px-2 py-0.5 rounded-full text-xs ' + PRIOR[p.prioridad]}>{p.prioridad}</span></td>
                    <td className="px-4 py-2 text-ink-900">{p.maquina} · {p.componente}</td>
                    <td className="px-4 py-2 text-ink-700">
                      {p.tarea}
                      {p.origen && <div className="mt-1 md:hidden"><OrigenBadge origen={p.origen} /></div>}
                    </td>
                    <td className="px-4 py-2 text-ink-700">{p.claseOrden}</td>
                    <td className="hidden md:table-cell px-4 py-2"><OrigenBadge origen={p.origen} /></td>
                    <td className="px-4 py-2 text-ink-700">{p.parada?.dia}{p.enCalendario ? <span className="ml-2 inline-flex px-1.5 py-0.5 rounded-full bg-tertiary-50 text-tertiary-700 text-xs">En calendario</span> : null}</td>
                    <td className="px-4 py-2 text-right"><button onClick={() => setSelPlan(p)} className="inline-flex items-center gap-1 text-ink-600 hover:text-ink-900 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400 rounded"><Eye className="size-4 transition-transform group-hover:translate-x-0.5" /> Ver detalles</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {tab === 'plan' && totalPlan > PAGE_SIZE && (
          <Paginacion
            page={pagePlanSafe}
            totalPages={totalPagesPlan}
            from={fromPlan}
            to={toPlan}
            total={totalPlan}
            onPageChange={setPagePlan}
            label="Paginación del plan sugerido"
          />
        )}

        {tab === 'tareas' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left px-4 py-2 text-xs text-ink-500">PRIORIDAD</th>
                  <th className="text-left px-4 py-2 text-xs text-ink-500">TAREA</th>
                  <th className="text-left px-4 py-2 text-xs text-ink-500">COMPONENTE</th>
                  <th className="text-left px-4 py-2 text-xs text-ink-500">MÁQUINA</th>
                  <th className="hidden md:table-cell text-left px-4 py-2 text-xs text-ink-500">ORIGEN</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {tareasVisibles.map((t, i) => (
                  <tr key={t.id} className="border-b border-neutral-100 hover:bg-neutral-50/50 transition-colors" style={{ animation: `fade-up 220ms ease-out ${i * 30}ms both` }}>
                    <td className="px-4 py-2"><span className={'inline-flex px-2 py-0.5 rounded-full text-xs ' + PRIOR[t.prioridad]}>{t.prioridad}</span></td>
                    <td className="px-4 py-2 text-ink-900">
                      {t.tarea}
                      {t.origen && <div className="mt-1 md:hidden"><OrigenBadge origen={t.origen} /></div>}
                    </td>
                    <td className="px-4 py-2 text-ink-700">{t.componente}</td>
                    <td className="px-4 py-2 text-ink-700">{t.maquina}</td>
                    <td className="hidden md:table-cell px-4 py-2"><OrigenBadge origen={t.origen} /></td>
                    <td className="px-4 py-2 text-right"><button onClick={() => setSelTarea(t)} className="inline-flex items-center gap-1 text-ink-600 hover:text-ink-900 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400 rounded"><Eye className="size-4 transition-transform group-hover:translate-x-0.5" /> Más detalles</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {tab === 'tareas' && totalTareas > PAGE_SIZE && (
          <Paginacion
            page={pageTareaSafe}
            totalPages={totalPagesTareas}
            from={fromTareas}
            to={toTareas}
            total={totalTareas}
            onPageChange={setPageTarea}
            label="Paginación de tareas sugeridas"
          />
        )}
      </div>

      <DetallePlanModal open={!!selPlan} onClose={() => setSelPlan(null)} item={selPlan} onDone={() => { setSelPlan(null); onRefresh?.() }} onToast={onToast} />
      <DetalleTareaModal open={!!selTarea} onClose={() => setSelTarea(null)} tarea={selTarea} paradas={paradas} onDone={() => { setSelTarea(null); onRefresh?.() }} onToast={onToast} />
    </div>
  )
}
