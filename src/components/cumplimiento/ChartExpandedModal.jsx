import Modal from '../ui/Modal.jsx'
import CumplimientoChart from './CumplimientoChart.jsx'

export default function ChartExpandedModal({ open, onClose, rango, maquina = 'todas', refreshKey = 0 }) {
  const etiquetaMaquina = maquina === 'todas' ? 'Todas las máquinas' : maquina

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Cumplimiento semanal"
      subtitle={`${rango?.label || ''} · ${etiquetaMaquina}`}
      maxWidth="max-w-[1200px]"
      bodyClassName="h-[70vh]"
      legend={
        <span className="inline-flex items-center gap-1.5 text-xs text-ink-600">
          <span className="size-2.5 rounded-full bg-primary-500" aria-hidden="true" />
          Meta 90%
        </span>
      }
    >
      <CumplimientoChart rango={rango} maquina={maquina} refreshKey={refreshKey} bare />
    </Modal>
  )
}
