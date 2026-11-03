import { useState } from 'react'
import { getWeekList, getMonthList, getRangeForWeek, getRangeForMonth } from '../utils/weeks'
import WeekSelect from '../components/cumplimiento/WeekSelect'
import MonthSelect from '../components/cumplimiento/MonthSelect'
import ResumenCards from '../components/cumplimiento/ResumenCards'
import CumplimientoChart from '../components/cumplimiento/CumplimientoChart'
import ChartExpandedModal from '../components/cumplimiento/ChartExpandedModal'
import ParadasTable from '../components/cumplimiento/ParadasTable'
import RegistrarSeguimientoModal from '../components/cumplimiento/RegistrarSeguimientoModal'
import { useToast } from '../context/ToastContext'
import PageHeader from '../components/ui/PageHeader'

export default function Cumplimiento() {
  const toast = useToast()
  const weeks = getWeekList(12)
  const months = getMonthList(12)
  const [weekKey, setWeekKey] = useState(weeks[0].key)
  const [monthKey, setMonthKey] = useState(null)
  const [selectedParadaId, setSelectedParadaId] = useState(null)
  const [showChartModal, setShowChartModal] = useState(false)
  const [showRegistroModal, setShowRegistroModal] = useState(false)

  const selectedWeek = weeks.find(w => w.key === weekKey) || weeks[0]
  const selectedMonth = months.find(m => m.key === monthKey)

  const rangoActivo = monthKey && selectedMonth ? getRangeForMonth(selectedMonth) : getRangeForWeek(selectedWeek)
  const rangoLabel = monthKey && selectedMonth ? selectedMonth.rangeLabel : selectedWeek.rangeLabel

  const handleMonthChange = (key) => {
    setMonthKey(key)
  }

  const handleWeekChange = (key) => {
    setWeekKey(key)
  }

  const handleClear = () => {
    setMonthKey(null)
    setWeekKey(weeks[0].key)
  }

  const handleRegister = () => {
    if (!selectedParadaId) {
      toast('Selecciona una parada de la tabla para registrar seguimiento', 'error')
      return
    }
    setShowRegistroModal(true)
  }

  const handleSuccess = () => {
    // Forzar recarga
    window.location.reload()
  }

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <PageHeader title="Cumplimiento del plan" />
          <p className="mt-1 text-sm text-ink-500">Seguimiento de las tareas aceptadas en la pestaña de Mantenimiento</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <WeekSelect weeks={weeks} value={weekKey} onChange={handleWeekChange} rangeLabel={monthKey ? null : rangoLabel} />
          <MonthSelect
            months={months}
            value={monthKey}
            onChange={handleMonthChange}
            disabled={!!monthKey}
            disabledText={selectedMonth?.label || 'Mes seleccionado'}
          />
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex h-[38px] items-center justify-center self-start rounded-xl border border-neutral-200 bg-white px-4 text-sm font-medium text-ink-700 transition-colors hover:bg-neutral-50 sm:mt-[22px]"
          >
            Limpiar
          </button>
        </div>
      </div>
      {rangoLabel && monthKey && <p className="text-xs text-ink-500 -mt-4">{rangoLabel}</p>}

      <ResumenCards rango={rangoActivo} />

      <CumplimientoChart rango={rangoActivo} onExpand={() => setShowChartModal(true)} />

      <ParadasTable selectedId={selectedParadaId} onSelect={setSelectedParadaId} onRegister={handleRegister} />

      <ChartExpandedModal open={showChartModal} onClose={() => setShowChartModal(false)} rango={rangoActivo} />
      <RegistrarSeguimientoModal open={showRegistroModal} onClose={() => setShowRegistroModal(false)} paradaId={selectedParadaId} onSuccess={handleSuccess} />
    </div>
  )
}
