import { useCallback, useEffect, useRef, useState } from 'react'
import PageHeader from '../components/ui/PageHeader.jsx'
import { Upload, ChevronLeft, ChevronRight, CalendarPlus, FileDown, Bot, X, Loader2, Check } from 'lucide-react'
import { useMantenimientoWeek, weekLegend } from '../hooks/useMantenimientoWeek.js'
import { getAlertasSemana, getArchivosSemana, getParadasSemana, getPlanSugerido, getTareasSugeridas, leerCacheArchivos, leerCacheSemana } from '../services/mantenimientoService.js'
import { useMotorEstado } from '../hooks/useMotorEstado.js'
import SubirArchivoModal from '../components/mantenimiento/SubirArchivoModal.jsx'
import AlertasCarousel from '../components/mantenimiento/AlertasCarousel.jsx'
import CalendarioSemanal from '../components/mantenimiento/CalendarioSemanal.jsx'
import EstadoArchivos from '../components/mantenimiento/EstadoArchivos.jsx'
import TablaSugerencias from '../components/mantenimiento/TablaSugerencias.jsx'
import AsistenteChat from '../components/mantenimiento/AsistenteChat.jsx'
import ProgramarParadaModal from '../components/mantenimiento/ProgramarParadaModal.jsx'
import DetalleParadaModal from '../components/mantenimiento/DetalleParadaModal.jsx'
import { semanaPeriodo } from '../components/mantenimiento/semanaPeriodo.js'
import { cargarCatalogo } from '../data/catalogoMotor.js'

/** Solo actualiza el estado si el resultado cambió (evita re-renders al refrescar en silencio). */
const siCambia = (set) => (res) => set((prev) => (JSON.stringify(prev) === JSON.stringify(res) ? prev : res))

/** Pide los datos de la semana; `vigente()` evita que una respuesta vieja pise el estado. */
function cargarSemana(start, sets, vigente = () => true) {
  const si = (set) => (res) => { if (vigente()) siCambia(set)(res) }
  return Promise.allSettled([
    getParadasSemana({ startISO: start }).then(si(sets.setParadas)),
    getAlertasSemana(start).then(si(sets.setAlertas)),
    getPlanSugerido(start).then(si(sets.setPlan)),
    getTareasSugeridas(start).then(si(sets.setTareas)),
  ])
}

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

export default function Mantenimiento() {
  const { week, weeks, idx, goPrev, goNext, goToday, tick } = useMantenimientoWeek()
  // Dirección del último cambio de semana: -1 = hacia atrás (entra por la izquierda), 1 = hacia adelante.
  const idxPrevio = useRef(idx)
  const [dir, setDir] = useState(0)
  useEffect(() => {
    if (idx !== idxPrevio.current) setDir(idx > idxPrevio.current ? -1 : 1)
    idxPrevio.current = idx
  }, [idx])
  const [legend, setLegend] = useState('')
  const [subirOpen, setSubirOpen] = useState(false)
  const [progOpen, setProgOpen] = useState(false)
  const [editParada, setEditParada] = useState(null)
  const [detalleParada, setDetalleParada] = useState(null)
  // Lo ya cargado se pinta al instante al volver a la vista; luego se refresca en silencio.
  const [alertas, setAlertas] = useState(() => leerCacheSemana(week?.start)?.alertas ?? [])
  const [archivos, setArchivos] = useState(() => leerCacheArchivos() ?? [])
  const [paradas, setParadas] = useState(() => leerCacheSemana(week?.start)?.paradas ?? [])
  const [plan, setPlan] = useState(() => leerCacheSemana(week?.start)?.plan ?? [])
  const [tareas, setTareas] = useState(() => leerCacheSemana(week?.start)?.tareas ?? [])
  const [actualizando, setActualizando] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const [exportingSemana, setExportingSemana] = useState(false)
  const [exportSemanaOk, setExportSemanaOk] = useState(false)
  const exportOkTimer = useRef(null)

  const cerrarToast = useCallback(() => setToast(null), [])

  useEffect(() => { setLegend(weekLegend(week)) }, [week?.start, tick]) // eslint-disable-line react-hooks/exhaustive-deps
  // Los datos salen del motor (backend) y dependen de la semana que se está viendo.
  useEffect(() => { cargarCatalogo(); getArchivosSemana().then(siCambia(setArchivos)) }, [])
  useEffect(() => {
    const start = week?.start
    if (!start) return undefined
    // Si el usuario cambia de semana rápido, las respuestas viejas no pisan el estado.
    let cancelado = false
    const cache = leerCacheSemana(start)
    if (cache) {
      // Semana ya vista: se muestra lo guardado y se actualiza en segundo plano.
      if (cache.paradas) setParadas(cache.paradas)
      if (cache.alertas) setAlertas(cache.alertas)
      if (cache.plan) setPlan(cache.plan)
      if (cache.tareas) setTareas(cache.tareas)
      setActualizando(true)
    }
    cargarSemana(start, { setParadas, setAlertas, setPlan, setTareas }, () => !cancelado)
      .then(() => { if (!cancelado) setActualizando(false) })
    return () => { cancelado = true }
  }, [week?.start])

  // Una corrida del motor terminó en ok: las cachés ya se limpiaron, se refresca en silencio.
  const weekStartRef = useRef(week?.start)
  useEffect(() => { weekStartRef.current = week?.start }, [week?.start])
  const refrescarSilencioso = useCallback(() => {
    const start = weekStartRef.current
    getArchivosSemana().then(siCambia(setArchivos))
    if (!start) return
    setActualizando(true)
    cargarSemana(start, { setParadas, setAlertas, setPlan, setTareas }, () => weekStartRef.current === start)
      .then(() => { if (weekStartRef.current === start) setActualizando(false) })
  }, [])
  useMotorEstado(refrescarSilencioso)

  const refreshAll = async () => {
    if (!week?.start) return
    setParadas(await getParadasSemana({ startISO: week.start }))
    setPlan(await getPlanSugerido(week.start))
    setTareas(await getTareasSugeridas(week.start))
    setAlertas(await getAlertasSemana(week.start))
  }
  const onSubido = async () => { setArchivos(await getArchivosSemana()); setToast({ message: 'Archivo cargado' }); refreshAll() }
  const onParadaCreada = async () => { await refreshAll(); setToast({ message: 'Parada programada' }) }
  const onParadaUpdated = async () => { await refreshAll(); setToast({ message: 'Parada actualizada' }) }
  const onParadaDeleted = async () => { await refreshAll(); setToast({ message: 'Parada eliminada' }) }

  const handleExportSemana = async () => {
    if (!paradas || !paradas.length) {
      setToast({ message: 'No hay paradas para exportar en esta semana' })
      return
    }
    if (exportingSemana) return
    setExportingSemana(true)
    try {
      // ExcelJS pesa ~1 MB: solo se descarga al pulsar exportar. El botón ya
      // muestra el spinner mientras dura el import y la generación.
      const { exportarParadasSemana } = await import('../utils/exportExcel.js')
      const res = await exportarParadasSemana(paradas, week)
      if (res?.ok === false) {
        setToast({ message: 'No hay paradas para exportar en esta semana' })
      } else {
        setToast({ message: 'Excel descargado' })
        setExportSemanaOk(true)
        clearTimeout(exportOkTimer.current)
        exportOkTimer.current = setTimeout(() => setExportSemanaOk(false), 1200)
      }
    } catch {
      setToast({ message: 'No se pudo generar el Excel', variant: 'error' })
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
        @keyframes sync-ping { 0% { transform: scale(1); opacity: 0.55; } 80%, 100% { transform: scale(2.6); opacity: 0; } }
        .sync-dot { transition: opacity 200ms ease, transform 200ms cubic-bezier(0.22, 1, 0.36, 1); }
        .sync-dot[data-on="false"] { opacity: 0; transform: scale(0.4); }
        .sync-dot[data-on="true"] { opacity: 1; transform: scale(1); }
        .sync-dot[data-on="true"] .sync-ring { animation: sync-ping 1600ms cubic-bezier(0, 0, 0.2, 1) infinite; }
        @media (prefers-reduced-motion: reduce) { .m-anim > *, .toast-anim, .fab-pulse, .btn-pop { animation: none !important; } .export-icon { transition: none !important; } .sync-dot { transition: opacity 160ms ease; transform: none !important; } .sync-dot .sync-ring { animation: none !important; } }
      `}</style>

      <PageHeader title="Mantenimiento" subtitle={legend}>
        <button onClick={() => setSubirOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-ink-900 px-4 text-sm font-medium text-white hover:bg-primary-500 active:scale-[0.97] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400">
          <Upload className="size-4" /> Subir archivo
        </button>
      </PageHeader>

      <div className="m-anim space-y-6">
        <AlertasCarousel alertas={alertas} />

        <div className="grid gap-6 xl:grid-cols-[1fr_320px] lg:grid-cols-[1fr_280px] items-stretch">
          <div>
            <div className="bg-white rounded-2xl border border-neutral-200 h-full">
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-neutral-200">
                <div className="flex items-center gap-2">
                  <button onClick={goPrev} disabled={idx >= weeks.length - 1} aria-label="Semana anterior" className="h-9 w-9 grid place-items-center rounded-lg hover:bg-neutral-100 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400 disabled:opacity-40 disabled:pointer-events-none"><ChevronLeft className="size-4" /></button>
                  <button onClick={goToday} disabled={!!week?.isCurrent} aria-label="Ir a la semana actual" className="h-9 px-3 rounded-lg text-sm hover:bg-neutral-100 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400 disabled:text-ink-400 disabled:pointer-events-none">Hoy</button>
                  <button onClick={goNext} disabled={idx <= 0} aria-label="Semana siguiente" className="h-9 w-9 grid place-items-center rounded-lg hover:bg-neutral-100 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400 disabled:opacity-40 disabled:pointer-events-none"><ChevronRight className="size-4" /></button>
                  <h2 className="ml-2 text-base font-semibold text-ink-900">Semana</h2>
                  <span className="overflow-hidden" aria-live="polite">
                    <span key={week?.start} className="sem-slide block whitespace-nowrap text-xs text-ink-500 tabular-nums" data-dir={dir}>{semanaPeriodo(week)}</span>
                  </span>
                  <span role="status" aria-live="polite" className="sync-dot relative inline-flex size-2" data-on={actualizando} title={actualizando ? 'Actualizando…' : undefined}>
                    <span aria-hidden="true" className="sync-ring absolute inset-0 rounded-full bg-[#0D9488]" />
                    <span aria-hidden="true" className="relative inline-flex size-2 rounded-full bg-[#0D9488]" />
                    <span className="sr-only">{actualizando ? 'Actualizando datos de la semana' : ''}</span>
                  </span>
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
              <CalendarioSemanal paradas={paradas} week={week} onParadaClick={setDetalleParada} dir={dir} />
            </div>
          </div>
          <div>
            <EstadoArchivos archivos={archivos} />
          </div>
        </div>

        <TablaSugerencias plan={plan} tareas={tareas} paradas={paradas} onRefresh={refreshAll} onToast={setToast} />
      </div>

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
      <Toast toast={toast} onClose={cerrarToast} />
    </div>
  )
}
