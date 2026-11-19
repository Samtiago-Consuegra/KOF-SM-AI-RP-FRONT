import Modal from '../ui/Modal.jsx'
import CumplimientoChart from './CumplimientoChart.jsx'
import ChipsTipo from './ChipsTipo.jsx'

// Paradas: la gráfica pide sus datos. SAP: `sap` trae las filas ya calculadas (sin peticiones nuevas)
// y `tipos` los chips del encabezado.
export default function ChartExpandedModal({
  open, onClose, rango, maquina = 'todas', refreshKey = 0,
  title = 'Cumplimiento semanal', sap = null, tipos = null, tiposLabel = 'Órdenes por tipo',
}) {
  const etiquetaMaquina = maquina === 'todas' ? 'Todas las máquinas' : maquina

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      subtitle={`${rango?.label || ''} · ${etiquetaMaquina}`}
      maxWidth="max-w-[1200px]"
      bodyClassName="h-[70vh]"
      legend={
        <>
          {tipos && <ChipsTipo tipos={tipos} label={tiposLabel} />}
          <span className="inline-flex items-center gap-1.5 text-xs text-ink-600">
            <span className="size-2.5 rounded-full bg-primary-500" aria-hidden="true" />
            Meta 90%
          </span>
        </>
      }
    >
      <CumplimientoChart rango={rango} maquina={maquina} refreshKey={refreshKey} sap={sap} bare />
    </Modal>
  )
}
