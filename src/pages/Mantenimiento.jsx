import { useCallback, useEffect, useRef, useState } from 'react'
import PageHeader from '../components/ui/PageHeader.jsx'
import RecalculandoBadge from '../components/ui/RecalculandoBadge.jsx'
import MotorVacio from '../components/ui/MotorVacio.jsx'
import useMotorEstado from '../hooks/useMotorEstado.js'
import { semanaISO } from '../api/motorAdapter.js'
import { Upload, ChevronLeft, ChevronRight, CalendarPlus, FileDown, Bot, X, Loader2, Check, ListChecks, CalendarCheck, Gauge, HardHat, CalendarX, CalendarClock, FileSearch, Info } from 'lucide-react'
import StatCard from '../components/ui/StatCard.jsx'
import Skeleton from '../components/ui/Skeleton.jsx'
import useCountUp from '../hooks/useCountUp.js'
import { useMantenimientoWeek, weekLegend } from '../hooks/useMantenimientoWeek.js'
import { getAlertasSemana, getArchivosSemana, getParadasSemana, getPlanSugerido, getTareasSugeridas, getIndicadoresSemana, descargarExcelSemana } from '../services/mantenimientoService.js'
import SubirArchivoModal from '../components/mantenimiento/SubirArchivoModal.jsx'
import AlertasCarousel from '../components/mantenimiento/AlertasCarousel.jsx'
import CalendarioSemanal from '../components/mantenimiento/CalendarioSemanal.jsx'
import EstadoArchivos from '../components/mantenimiento/EstadoArchivos.jsx'
import TablaSugerencias from '../components/mantenimiento/TablaSugerencias.jsx'
import AsistenteChat from '../components/mantenimiento/AsistenteChat.jsx'
import ProgramarParadaModal from '../components/mantenimiento/ProgramarParadaModal.jsx'
import DetalleParadaModal from '../components/mantenimiento/DetalleParadaModal.jsx'

function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [toast, onClose])
  if (!toast) return null
  const isError = toast.variant === 'error'
  return (
    <div className="fixed bottom-6 right-6 z-[80]">
      <style>{`
        @keyframes toast-in { from { opacity: 0; transform: translate(20px, 20px); } to { opacity: 1; transform: translate(0,0); } }
        @keyframes toast-bar { from { transform: scaleX(1); } to { transform: scaleX(0); } }
        @media (prefers-reduced-motion: reduce) { .toast-anim { animation: none !important; } }
      `}</style>
      <div className="toast-anim bg-white rounded-xl border border-neutral-200 shadow-lg overflow-hidden min-w-[240px]" style={{ animation: 'toast-in 250ms ease-out' }}>
        <div className="flex items-center justify-between p-3">
          <p className={`text-sm ${isError ? 'text-primary-600' : 'text-ink-900'}`}>{toast.message}</p>
          <button onClick={onClose} className="h-6 w-6 grid place-items-center rounded hover:bg-neutral-100"><X className="size-3.5" /></button>
        </div>
        <div className={`h-1 origin-left ${isError ? 'bg-primary-500' : 'bg-tertiary-500'}`} style={{ animation: 'toast-bar 3500ms linear' }} />
      </div>
    </div>
  )
}

const INDICADORES = [
  { clave: 'tareas', label: 'Tareas de la semana', icon: ListChecks, tone: 'default' },
  { clave: 'enParadasExistentes', label: 'En paradas existentes', icon: CalendarCheck, tone: 'teal' },
  { clave: 'usoParadasPct', label: 'Uso de paradas', icon: Gauge, tone: 'teal', unit: '%' },
  { clave: 'conContratista', label: 'Con contratista', icon: HardHat, tone: 'amber' },
  { clave: 'requierenParadaDedicada', label: 'Requieren parada dedicada', icon: CalendarX, tone: 'red' },
  { clave: 'pasanASiguienteSemana', label: 'Pasan a la siguiente semana', icon: CalendarClock, tone: 'amber' },
  { clave: 'ordenesPorVerificar', label: 'Órdenes por verificar', icon: FileSearch, tone: 'default' },
]

function IndicadorCard({ def, valor }) {
  const numero = Number(valor)
  const valido = valor !== null && valor !== undefined && Number.isFinite(numero)
  const conteo = useCountUp(valido ? numero : 0, 700)
  return <StatCard label={def.label} value={valido ? conteo : '—'} unit={valido ? def.unit : undefined} icon={def.icon} tone={def.tone} />
}

function Indicadores({ indicadores, cargando }) {
  if (cargando) {
    return (
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4 xl:grid-cols-7" aria-busy="true" aria-label="Cargando indicadores">
        {INDICADORES.map((d) => <Skeleton key={d.clave} className="h-[118px]" />)}
      </div>
    )
  }
  if (!indicadores?.disponible) return null
  return (
    <div className="grid gap-3 grid-cols-2 md:grid-cols-4 xl:grid-cols-7">
      {INDICADORES.map((d, i) => (
        <div key={d.clave} className="m-ind-card" style={{ animationDelay: `${i * 40}ms` }}>
          <IndicadorCard def={d} valor={indicadores[d.clave]} />
        </div>
      ))}
    </div>
  )
}

function CalendarioSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-2 p-3" aria-busy="true" aria-label="Cargando calendario">
      {Array.from({ length: 7 }, (_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-16" />
          {i % 2 === 0 && <Skeleton className="h-16" />}
        </div>
      ))}
    </div>
  )
}

export default function Mantenimiento() {
  const { week, goPrev, goNext, goToday, tick } = useMantenimientoWeek()
  const [legend, setLegend] = useState('')
  const [subirOpen, setSubirOpen] = useState(false)
  const [progOpen, setProgOpen] = useState(false)
  const [editParada, setEditParada] = useState(null)
  const [detalleParada, setDetalleParada] = useState(null)
  const [alertas, setAlertas] = useState([])
  const [archivos, setArchivos] = useState([])
  const [paradas, setParadas] = useState([])
  const [plan, setPlan] = useState([])
  const [tareas, setTareas] = useState([])
  const [chatOpen, setChatOpen] = useState(false)
  const [toast, setToastRaw] = useState(null)
  const setToast = useCallback((t) => setToastRaw(typeof t === 'string' ? { message: t } : t), [])
  const [indicadores, setIndicadores] = useState(null)
  const [planCargando, setPlanCargando] = useState(true)
  const [exportingSemana, setExportingSemana] = useState(false)
  const [exportSemanaOk, setExportSemanaOk] = useState(false)
  const exportOkTimer = useRef(null)

  const semana = semanaISO(week?.start)

  const cargarAlertas = useCallback(() => getAlertasSemana(semana).then(setAlertas).catch((e) => setToast({ message: e?.message || 'No se pudieron cargar las alertas', variant: 'error' })), [semana])
  const cargarArchivos = useCallback(() => getArchivosSemana().then(setArchivos).catch((e) => setToast({ message: e?.message || 'No se pudo consultar el estado de los archivos', variant: 'error' })), [])
  const cargarPlan = useCallback(async () => {
    if (!week?.start) return
    try {
      const [p, ps, ts, ind] = await Promise.all([
        getParadasSemana({ startISO: week.start }),
        getPlanSugerido(semana),
        getTareasSugeridas(semana),
        getIndicadoresSemana(semana),
      ])
      setParadas(p); setPlan(ps); setTareas(ts); setIndicadores(ind)
    } catch (e) {
      setToast({ message: e?.message || 'No se pudo cargar el plan semanal', variant: 'error' })
    } finally {
      setPlanCargando(false)
    }
  }, [week?.start, semana, setToast])
  const recargarMotor = useCallback(() => Promise.all([cargarAlertas(), cargarArchivos(), cargarPlan()]), [cargarAlertas, cargarArchivos, cargarPlan])
  const { calculando, error: errorMotor, marcarCalculando } = useMotorEstado(recargarMotor)
  useEffect(() => { if (alertas.calculando || paradas.calculando) marcarCalculando() }, [alertas, paradas, marcarCalculando])
  useEffect(() => { if (errorMotor) setToast({ message: errorMotor, variant: 'error' }) }, [errorMotor])

  useEffect(() => { setLegend(weekLegend(week)) }, [week, tick])
  useEffect(() => { cargarArchivos() }, [cargarArchivos])
  useEffect(() => { cargarAlertas() }, [cargarAlertas])
  useEffect(() => { setPlanCargando(true); cargarPlan() }, [cargarPlan])

  const motorSinDatos = alertas.available === false || archivos.available === false
  const mensajeMotor = alertas.message || archivos.message
  const recalculando = calculando || alertas.calculando === true || paradas.calculando === true
  const planEnEspera = planCargando || paradas.calculando === true

  const onSubido = async () => { marcarCalculando(); await cargarArchivos() }
  const trasEscritura = async () => { marcarCalculando(); await cargarPlan() }
  const onParadaCreada = async () => { await trasEscritura(); setToast({ message: 'Parada programada' }) }
  const onParadaUpdated = async () => { await trasEscritura(); setToast({ message: 'Parada actualizada' }) }
  const onParadaDeleted = async () => { await trasEscritura(); setToast({ message: 'Parada eliminada' }) }

  const handleExportSemana = async () => {
    if (exportingSemana || !semana) return
    setExportingSemana(true)
    try {
      const res = await descargarExcelSemana(semana)
      if (!res.ok) {
        if (res.calculando) marcarCalculando()
        setToast({ message: res.calculando ? 'El Excel se está generando, intenta en unos segundos' : (res.message || 'Aún no hay Excel para esta semana') })
        return
      }
      const url = URL.createObjectURL(res.blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `plan_semanal_${semana}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      setToast({ message: 'Excel descargado' })
      setExportSemanaOk(true)
      clearTimeout(exportOkTimer.current)
      exportOkTimer.current = setTimeout(() => setExportSemanaOk(false), 1200)
    } catch (e) {
      setToast({ message: e?.message || 'No se pudo descargar el Excel', variant: 'error' })
    } finally {
      setExportingSemana(false)
    }
  }

  const handleEditParada = (p) => {
    setDetalleParada(null)
    setEditParada(p)
    setProgOpen(true)
  }

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto">
      <style>{`
        @keyframes fade-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fab-in { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
        @keyframes pulse-soft { 0%,100% { box-shadow: 0 0 0 0 rgba(244,0,0,0.25); } 50% { box-shadow: 0 0 0 8px rgba(244,0,0,0.05); } }
        @keyframes cd-pop { from { transform: scale(0.6); } to { transform: scale(1); } }
        @keyframes btn-pop { 0% { transform: scale(0.7); opacity: 0; } 60% { transform: scale(1.15); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
        .m-anim > * { animation: fade-up 350ms ease-out both; }
        .m-anim > *:nth-child(1){animation-delay:0ms}
        .m-anim > *:nth-child(2){animation-delay:60ms}
        .m-anim > *:nth-child(3){animation-delay:120ms}
        .m-anim > *:nth-child(4){animation-delay:180ms}
        .m-anim > *:nth-child(5){animation-delay:240ms}
        .export-icon { transition: opacity 200ms ease, transform 200ms ease; }
        .btn-pop { animation: btn-pop 280ms ease-out; }
        @keyframes m-badge-in { from { opacity: 0; transform: translateY(-4px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .m-badge { animation: m-badge-in 220ms cubic-bezier(0.22,1,0.36,1) both; }
        .m-vacio { animation: fade-up 350ms cubic-bezier(0.22,1,0.36,1) both; }
        .m-ind-card { animation: fade-up 320ms cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes m-aviso-in { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        .m-aviso { animation: m-aviso-in 260ms cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes m-swap-in { from { opacity: 0; } to { opacity: 1; } }
        .m-swap { animation: m-swap-in 220ms ease-out both; }
        @media (prefers-reduced-motion: reduce) { .m-anim > *, .toast-anim, .fab-pulse, .btn-pop, .m-badge, .m-vacio, .m-ind-card, .m-aviso, .m-swap { animation: none !important; } .export-icon { transition: none !important; } }
      `}</style>

      <PageHeader title="Mantenimiento" subtitle={legend}>
        {recalculando && <span className="m-badge inline-flex" aria-live="polite"><RecalculandoBadge /></span>}
        <button onClick={() => setSubirOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-ink-900 px-4 text-sm font-medium text-white hover:bg-primary-500 active:scale-[0.97] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400">
          <Upload className="size-4" /> Subir archivo
        </button>
      </PageHeader>

      {motorSinDatos ? (
        <div className="m-vacio">
          <MotorVacio message={mensajeMotor} actionLabel="Subir archivos" onAction={() => setSubirOpen(true)} />
        </div>
      ) : (
      <div className="m-anim space-y-6">
        <AlertasCarousel alertas={alertas} />

        <Indicadores indicadores={indicadores} cargando={planEnEspera && !indicadores?.disponible} />

        <div className="grid gap-6 xl:grid-cols-[1fr_320px] lg:grid-cols-[1fr_280px] items-stretch">
          <div id="calendario" className="scroll-mt-24">
            <div className="bg-white rounded-2xl border border-neutral-200 h-full">
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-neutral-200">
                <div className="flex items-center gap-2">
                  <button onClick={goPrev} aria-label="Semana anterior" className="h-9 w-9 grid place-items-center rounded-lg hover:bg-neutral-100 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400"><ChevronLeft className="size-4" /></button>
                  <button onClick={goToday} className="h-9 px-3 rounded-lg text-sm hover:bg-neutral-100 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400">Hoy</button>
                  <button onClick={goNext} aria-label="Semana siguiente" className="h-9 w-9 grid place-items-center rounded-lg hover:bg-neutral-100 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400"><ChevronRight className="size-4" /></button>
                  <h2 className="ml-2 text-base font-semibold text-ink-900">Semana</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportSemana}
                    disabled={exportingSemana}
                    aria-busy={exportingSemana}
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-neutral-200 px-3 text-sm hover:bg-neutral-50 active:scale-[0.97] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400 disabled:opacity-60 disabled:pointer-events-none"
                  >
                    <span className="export-icon inline-flex items-center justify-center size-4">
                      {exportingSemana ? <Loader2 className="size-4 animate-spin" /> : exportSemanaOk ? <Check className="size-4 text-tertiary-600 btn-pop" /> : <FileDown className="size-4" />}
                    </span>
                    {exportingSemana ? 'Exportando…' : 'Exportar semana (Excel)'}
                  </button>
                  <button onClick={() => { setEditParada(null); setProgOpen(true) }} className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary-500 px-3 text-sm text-white hover:bg-primary-600 active:scale-[0.97] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400"><CalendarPlus className="size-4" /> Programar parada</button>
                </div>
              </div>
              {paradas.calendarioEsEjemplo && !planEnEspera && (
                <div className="m-aviso mx-4 mt-3 flex items-center gap-2 rounded-lg border border-tertiary-200 bg-tertiary-50/60 px-3 py-2 text-xs text-tertiary-700" role="status">
                  <Info className="size-3.5 shrink-0" aria-hidden="true" />
                  Calendario de ejemplo: programa las paradas reales de la semana
                </div>
              )}
              {planEnEspera ? <CalendarioSkeleton /> : (
                <div className="m-swap" key={semana}>
                  <CalendarioSemanal paradas={paradas} week={week} onParadaClick={setDetalleParada} />
                </div>
              )}
            </div>
          </div>
          <div>
            <EstadoArchivos archivos={archivos} />
          </div>
        </div>

        <div id="plan" className="scroll-mt-24">
          {planEnEspera ? (
            <div className="bg-white rounded-2xl border border-neutral-200 p-4 space-y-3" aria-busy="true" aria-label="Cargando plan sugerido">
              <Skeleton className="h-9 w-80 max-w-full" />
              {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-10" />)}
            </div>
          ) : (
            <div className="m-swap">
              <TablaSugerencias plan={plan} tareas={tareas} paradas={paradas} onAccion={trasEscritura} onToast={setToast} />
            </div>
          )}
        </div>
      </div>
      )}

      <button aria-label="Abrir asistente de mantenimiento" aria-expanded={chatOpen} onClick={() => setChatOpen((v) => !v)} className="fab-pulse fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full bg-primary-500 text-white grid place-items-center shadow-lg hover:bg-primary-600 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400" style={{ animation: 'fab-in 350ms ease-out both, pulse-soft 2400ms ease-in-out infinite' }}>
        <Bot className="size-5" />
      </button>

      <SubirArchivoModal open={subirOpen} onClose={() => setSubirOpen(false)} onSuccess={onSubido} onToast={setToast} />
      <ProgramarParadaModal
        key={progOpen ? (editParada?.id || 'new') : 'closed'}
        open={progOpen}
        onClose={() => { setProgOpen(false); setEditParada(null) }}
        onCreated={editParada ? onParadaUpdated : onParadaCreada}
        editParada={editParada}
        onToast={setToast}
      />
      <DetalleParadaModal open={!!detalleParada} onClose={() => setDetalleParada(null)} parada={detalleParada} onEdit={handleEditParada} onDeleted={onParadaDeleted} onToast={setToast} />
      <AsistenteChat open={chatOpen} onClose={() => setChatOpen(false)} />
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  )
}
