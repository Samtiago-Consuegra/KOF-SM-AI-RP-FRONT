import { useMemo, useState } from 'react'
import { CalendarClock } from 'lucide-react'
import { getWeekList, getMonthList, getRangeForWeek, getRangeForMonth, siguienteDiaHabil, formatFechaHabil } from '../utils/weeks'
import WeekSelect from '../components/cumplimiento/WeekSelect'
import MonthSelect from '../components/cumplimiento/MonthSelect'
import ResumenCards from '../components/cumplimiento/ResumenCards'
import CumplimientoChart from '../components/cumplimiento/CumplimientoChart'
import ChartExpandedModal from '../components/cumplimiento/ChartExpandedModal'
import ParadasTable from '../components/cumplimiento/ParadasTable'
import RegistrarSeguimientoModal from '../components/cumplimiento/RegistrarSeguimientoModal'
import DetalleParadaModal from '../components/cumplimiento/DetalleParadaModal'
import MachineFilter from '../components/ui/MachineFilter'
import ConfirmDialog from '../components/mantenimiento/ConfirmDialog'
import { reprogramarParada } from '../services/cumplimientoService'
import { useToast } from '../context/ToastContext'
import PageHeader from '../components/ui/PageHeader'
import PreventivoSap from '../components/cumplimiento/PreventivoSap'

const VISTAS = [
  { id: 'paradas', label: 'Paradas programadas' },
  { id: 'sap', label: 'Preventivo SAP' },
]

const ESTILOS = `
.kof-seg-pill { transition: transform 240ms cubic-bezier(0.25, 1, 0.5, 1); }
.kof-seg-btn { transition: color 200ms ease; touch-action: manipulation; }
@keyframes kof-vista-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
.kof-vista-in { animation: kof-vista-in 280ms cubic-bezier(0.22, 1, 0.36, 1) both; }
@media (prefers-reduced-motion: reduce) {
  .kof-seg-pill { transition: none; }
  .kof-vista-in { animation: kof-vista-fade 160ms ease both; }
}
@keyframes kof-vista-fade { from { opacity: 0; } to { opacity: 1; } }
`

function SelectorVista({ value, onChange }) {
  const indice = Math.max(0, VISTAS.findIndex((v) => v.id === value))
  const onKeyDown = (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    const sig = VISTAS[(indice + (e.key === 'ArrowRight' ? 1 : VISTAS.length - 1)) % VISTAS.length]
    onChange(sig.id)
    document.getElementById(`vista-tab-${sig.id}`)?.focus()
  }
  return (
    <div
      role="tablist"
      aria-label="Vista de cumplimiento"
      onKeyDown={onKeyDown}
      className="relative inline-grid grid-cols-2 rounded-xl border border-neutral-200 bg-[#F8F9FA] p-1"
    >
      <span
        aria-hidden="true"
        className="kof-seg-pill absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-lg bg-white shadow-sm ring-1 ring-neutral-200"
        style={{ transform: `translateX(${indice * 100}%)` }}
      />
      {VISTAS.map((v) => {
        const activa = v.id === value
        return (
          <button
            key={v.id}
            id={`vista-tab-${v.id}`}
            type="button"
            role="tab"
            aria-selected={activa}
            aria-controls={`vista-panel-${v.id}`}
            tabIndex={activa ? 0 : -1}
            onClick={() => onChange(v.id)}
            className={`kof-seg-btn relative z-10 min-h-9 rounded-lg px-4 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400 ${activa ? 'text-[#111827]' : 'text-ink-500 hover:text-ink-700'}`}
          >
            {v.label}
          </button>
        )
      })}
    </div>
  )
}

const MAQUINA_OPTIONS = [
  { value: 'todas', label: 'Todas las máquinas', hint: '4 críticas' },
  { value: 'Llenadora', label: 'Llenadora', hint: 'Sistema de llenado' },
  { value: 'Empacadora', label: 'Empacadora', hint: 'Sellado y arrastre' },
  { value: 'Paletizadora', label: 'Paletizadora', hint: 'Paletizado y seguridad' },
  { value: 'Envolvedora', label: 'Envolvedora', hint: 'Film y corte' },
]

export default function Cumplimiento() {
  const toast = useToast()
  const weeks = useMemo(() => getWeekList(12), [])
  const months = useMemo(() => getMonthList(12), [])

  const [weekKey, setWeekKey] = useState(weeks[0].key)
  const [monthKey, setMonthKey] = useState(null)
  const [maquina, setMaquina] = useState('todas')
  const [vista, setVista] = useState('paradas')
  const [showChartModal, setShowChartModal] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const [registroOpen, setRegistroOpen] = useState(false)
  const [registroParadaId, setRegistroParadaId] = useState(null)
  const [detalleParada, setDetalleParada] = useState(null)
  const [paradaAReprogramar, setParadaAReprogramar] = useState(null)
  const [reprogramando, setReprogramando] = useState(false)

  const selectedWeek = weeks.find((w) => w.key === weekKey) || weeks[0]
  const selectedMonth = months.find((m) => m.key === monthKey)

  const rangoActivo = useMemo(
    () => (monthKey && selectedMonth ? getRangeForMonth(selectedMonth) : getRangeForWeek(selectedWeek)),
    [monthKey, selectedMonth, selectedWeek],
  )
  const rangoLabel = monthKey && selectedMonth ? selectedMonth.rangeLabel : selectedWeek.rangeLabel

  const handleMonthChange = (key) => {
    setMonthKey(key)
    // "Sin mes" vuelve al periodo semanal activo.
    if (!key) setWeekKey(weeks[0].key)
  }

  const handleWeekChange = (key) => {
    setWeekKey(key)
    // Elegir una semana vuelve a la vista semanal.
    setMonthKey(null)
  }

  const handleClear = () => {
    setMonthKey(null)
    setWeekKey(weeks[0].key)
    setMaquina('todas')
  }

  const handleRegistrar = (parada) => {
    if (!parada) return
    setRegistroParadaId(parada.id)
    setRegistroOpen(true)
  }

  const handleVerDetalle = (parada) => setDetalleParada(parada)

  const handleReprogramar = (parada) => {
    if (!parada) return
    setParadaAReprogramar(parada)
  }

  const confirmarReprogramar = async () => {
    if (!paradaAReprogramar || reprogramando) return
    setReprogramando(true)
    try {
      const resultado = await reprogramarParada(paradaAReprogramar.id)
      toast(`Parada reprogramada para el ${formatFechaHabil(resultado.parada.inicio)}`, 'success')
      setParadaAReprogramar(null)
      setRefreshKey((key) => key + 1)
    } catch (error) {
      toast(error?.message || 'No se pudo reprogramar la parada', 'error')
    } finally {
      setReprogramando(false)
    }
  }

  const fechaReprogramacion = paradaAReprogramar
    ? formatFechaHabil(siguienteDiaHabil(paradaAReprogramar.inicio))
    : ''

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto">
      <style>{ESTILOS}</style>
      <div className="space-y-4">
        <PageHeader
          title="Cumplimiento del plan"
          subtitle="Seguimiento de las tareas aceptadas en la pestaña de Mantenimiento"
        />
        <SelectorVista value={vista} onChange={setVista} />
        {vista === 'paradas' && (
        <div
          className="flex flex-wrap items-start gap-2.5"
          role="group"
          aria-label="Filtros del período y la máquina"
        >
          <div className="w-72 shrink-0">
            <WeekSelect
              weeks={weeks}
              value={weekKey}
              onChange={handleWeekChange}
              rangeLabel={monthKey ? null : rangoLabel}
            />
          </div>
          <div className="w-56 shrink-0">
            <MonthSelect
              months={months}
              value={monthKey}
              onChange={handleMonthChange}
              rangeLabel={monthKey ? selectedMonth?.rangeLabel : null}
            />
          </div>
          <div className="w-60 shrink-0">
            <MachineFilter
              label="Máquina"
              value={maquina}
              onChange={setMaquina}
              options={MAQUINA_OPTIONS}
              className="w-full"
            />
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="mt-[22px] inline-flex h-10 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 text-sm font-medium text-ink-700 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400"
          >
            Limpiar
          </button>
        </div>
        )}
      </div>

      {vista === 'sap' ? (
        <div key="sap" id="vista-panel-sap" role="tabpanel" aria-labelledby="vista-tab-sap" className="kof-vista-in">
          <PreventivoSap />
        </div>
      ) : (
      <div key="paradas" id="vista-panel-paradas" role="tabpanel" aria-labelledby="vista-tab-paradas" className="kof-vista-in space-y-6">
      <ResumenCards rango={rangoActivo} maquina={maquina} refreshKey={refreshKey} />

      <CumplimientoChart
        rango={rangoActivo}
        maquina={maquina}
        refreshKey={refreshKey}
        onExpand={() => setShowChartModal(true)}
      />

      <ParadasTable
        refreshKey={refreshKey}
        onRegistrar={handleRegistrar}
        onReprogramar={handleReprogramar}
        onVerDetalle={handleVerDetalle}
      />
      </div>
      )}

      <ChartExpandedModal
        open={showChartModal}
        onClose={() => setShowChartModal(false)}
        rango={rangoActivo}
        maquina={maquina}
        refreshKey={refreshKey}
      />

      <RegistrarSeguimientoModal
        open={registroOpen}
        onClose={() => setRegistroOpen(false)}
        paradaId={registroParadaId}
        onSuccess={() => setRefreshKey((key) => key + 1)}
      />

      <DetalleParadaModal
        open={!!detalleParada}
        onClose={() => setDetalleParada(null)}
        parada={detalleParada}
      />

      <ConfirmDialog
        open={!!paradaAReprogramar}
        title="¿Reprogramar esta parada?"
        message={
          paradaAReprogramar
            ? `«${paradaAReprogramar.titulo}» se moverá al ${fechaReprogramacion}, conservando sus tareas y horas. Quedará Pendiente y se registrará el historial.`
            : ''
        }
        confirmText={reprogramando ? 'Reprogramando…' : 'Reprogramar'}
        cancelText="Cancelar"
        variant="neutral"
        icon={CalendarClock}
        busy={reprogramando}
        onCancel={() => { if (!reprogramando) setParadaAReprogramar(null) }}
        onConfirm={confirmarReprogramar}
      />
    </div>
  )
}
