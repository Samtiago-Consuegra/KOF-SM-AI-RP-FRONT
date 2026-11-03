import { useState } from 'react'
import { X } from 'lucide-react'
import { getResumenExportacion } from '../../services/historiaClinicaService'

export default function ExportarHistoriaModal({ open, onClose, maquina, onExport }) {
  const [periodo, setPeriodo] = useState('12m')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [loading, setLoading] = useState(false)
  
  if (!open) return null
  
  const handleDescargar = async () => {
    setLoading(true)
    try {
      let desdeStr = '1 nov 2025'
      let hastaStr = '2 nov 2026'
      if (periodo === '3m') { desdeStr = '2 ago 2026'; hastaStr = '2 nov 2026' }
      else if (periodo === '6m') { desdeStr = '2 may 2026'; hastaStr = '2 nov 2026' }
      else if (periodo === '12m') { desdeStr = '2 nov 2025'; hastaStr = '2 nov 2026' }
      else if (periodo === 'actual') { desdeStr = '1 ene 2026'; hastaStr = '2 nov 2026' }
      else if (periodo === 'custom') { desdeStr = desde; hastaStr = hasta }
      
      await onExport({ desde: desdeStr, hasta: hastaStr })
      onClose()
      alert('PDF descargado')
    } catch (e) {
      alert('Error al generar PDF')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40">
      <div role="dialog" aria-modal="true" aria-labelledby="export-title" className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 p-4">
          <h3 id="export-title" className="text-lg font-semibold text-ink-900">Exportar historia clínica</h3>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-neutral-100"><X className="size-5" /></button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="text-sm text-ink-500">Máquina</label>
            <input value={maquina} disabled className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-ink-900" />
          </div>
          <div>
            <label className="text-sm text-ink-500">Periodo</label>
            <select value={periodo} onChange={(e) => setPeriodo(e.target.value)} className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm text-ink-900">
              <option value="12m">Últimos 12 meses</option>
              <option value="6m">Últimos 6 meses</option>
              <option value="3m">Últimos 3 meses</option>
              <option value="actual">Año actual</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>
          {periodo === 'custom' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm text-ink-500">Desde</label>
                <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm text-ink-500">Hasta</label>
                <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm" />
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-neutral-200 p-4">
          <button onClick={onClose} className="rounded-xl border border-neutral-200 px-4 py-2 text-sm text-ink-700 hover:bg-neutral-50">Cancelar</button>
          <button onClick={handleDescargar} disabled={loading} className="rounded-xl bg-primary-500 px-4 py-2 text-sm text-white hover:bg-primary-600 disabled:opacity-50">
            {loading ? 'Generando...' : 'Descargar PDF'}
          </button>
        </div>
      </div>
    </div>
  )
}
