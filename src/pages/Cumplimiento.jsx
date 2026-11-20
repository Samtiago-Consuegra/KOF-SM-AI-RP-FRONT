import { useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
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
import VistaSelector from '../components/cumplimiento/VistaSelector'
import VistaOrdenesSap from '../components/cumplimiento/VistaOrdenesSap'
import { VISTAS, vistaDesdeParams } from '../services/ordenesSapCumplimiento'
import SinDatosPeriodo from '../components/ui/SinDatosPeriodo'
import AvisoCoberturaParcial from '../components/ui/AvisoCoberturaParcial'
import { useEvalCobertura } from '../hooks/useCobertura'
import { tieneDatos } from '../utils/cobertura'
import { usePublicarAsistente } from '../context/AsistenteContext.jsx'

/** Aviso de cobertura de una vista: null (todo normal), 'sin' (reemplaza secciones) o 'parcial' (aviso temporal). */
const modoCobertura = (ev) => (ev?.estado === 'sin_datos' && tieneDatos(ev) ? 'sin' : ev?.estado === 'parcial' ? 'parcial' : null)

/** Mientras la vista está oculta devuelve el último valor que vio: no pide datos hasta mostrarse. */
function useValorSiActiva(valor, activa) {
  const ref = useRef(valor)
  if (activa) ref.current = valor
  return ref.current
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
  const [searchParams, setSearchParams] = useSearchParams()
  const vista = vistaDesdeParams(searchParams)
  const esSap = vista === VISTAS.SAP
  const montadas = useRef(new Set())
  montadas.current.add(vista) // cada vista se monta la primera vez que se muestra y luego se conserva

  const cambiarVista = (nueva) => {
    const params = new URLSearchParams(searchParams)
    if (nueva === VISTAS.SAP) params.set('vista', VISTAS.SAP)
    else params.delete('vista')
    setSearchParams(params, { replace: true })
  }
  const weeks = useMemo(() => getWeekList(12), [])
  const months = useMemo(() => getMonthList(12), [])

  const [weekKey, setWeekKey] = useState(weeks[0].key)
  const [monthKey, setMonthKey] = useState(null)
  const [maquina, setMaquina] = useState('todas')
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
  const rangoParadas = useValorSiActiva(rangoActivo, !esSap)
  const maquinaParadas = useValorSiActiva(maquina, !esSap)
  const rangoSap = useValorSiActiva(rangoActivo, esSap)
  const maquinaSap = useValorSiActiva(maquina, esSap)

  const covParadas = useEvalCobertura('paradas', rangoParadas.from, rangoParadas.to)
  const covSap = useEvalCobertura('ordenes_sap', rangoSap.from, rangoSap.to)
  const modoParadas = modoCobertura(covParadas)
  const modoSap = modoCobertura(covSap)
  // Mes de la lista (últimos 12) que contiene el último dato; sin él no se ofrece el botón.
  const irAlMesDe = (ev) => {
    const mes = ev?.ultimoDato && months.find((m) => m.start <= ev.ultimoDato && ev.ultimoDato <= m.end)
    return mes ? () => handleMonthChange(mes.key) : undefined
  }

  const rangoLabel = monthKey && selectedMonth ? selectedMonth.rangeLabel : selectedWeek.rangeLabel
  usePublicarAsistente('cumplimiento', { rango: rangoActivo, rangoLabel, maquina, vista })

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
      <div className="space-y-4">
        <PageHeader
          title="Cumplimiento del plan"
          subtitle="Seguimiento de las tareas aceptadas en la pestaña de Mantenimiento"
        />
        <VistaSelector value={vista} onChange={cambiarVista} />
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
      </div>

      {montadas.current.has(VISTAS.PARADAS) && (
        <div hidden={esSap} className="kof-fade-up space-y-6">
          {modoParadas === 'sin' ? (
            <div className="rounded-2xl border border-neutral-200 bg-white">
              <SinDatosPeriodo key={rangoParadas.from} fuente="paradas" ev={covParadas} onIrAUltimo={irAlMesDe(covParadas)} />
            </div>
          ) : (
            <>
              <ResumenCards rango={rangoParadas} maquina={maquinaParadas} refreshKey={refreshKey} />

              <CumplimientoChart
                rango={rangoParadas}
                maquina={maquinaParadas}
                refreshKey={refreshKey}
                onExpand={() => setShowChartModal(true)}
              />
            </>
          )}

          <ParadasTable
            refreshKey={refreshKey}
            onRegistrar={handleRegistrar}
            onReprogramar={handleReprogramar}
            onVerDetalle={handleVerDetalle}
          />
        </div>
      )}

      {montadas.current.has(VISTAS.SAP) && (
        <div hidden={!esSap} className="kof-fade-up space-y-4">
          <AvisoCoberturaParcial fuente="ordenes_sap" ev={covSap} filtro={`${rangoSap.from}|${maquinaSap}`} activo={esSap} />
          {modoSap === 'sin' ? (
            <div className="rounded-2xl border border-neutral-200 bg-white">
              <SinDatosPeriodo key={rangoSap.from} fuente="ordenes_sap" ev={covSap} onIrAUltimo={irAlMesDe(covSap)} />
            </div>
          ) : (
            <VistaOrdenesSap desde={rangoSap.from} hasta={rangoSap.to} maquina={maquinaSap} tipo={rangoSap.type} etiqueta={rangoSap.label} />
          )}
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
