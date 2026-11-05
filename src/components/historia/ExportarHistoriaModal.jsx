import { useEffect, useMemo, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { useToast } from '../../context/ToastContext.jsx'

function mesKey(iso) {
  return iso ? iso.slice(0, 7) : null
}

function restarMeses(key, n) {
  if (!key) return null
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, m - 1 - n, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function finDeMes(key) {
  if (!key) return ''
  const [y, m] = key.split('-').map(Number)
  return `${y}-${String(m).padStart(2, '0')}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`
}

// Traduce el periodo activo de la página a la opción inicial del modal
function opcionInicial(resolved) {
  const startKey = mesKey(resolved.start)
  const endKey = mesKey(resolved.end)
  if (!startKey || !endKey) return { opcion: '12m' }
  const [y1, m1] = startKey.split('-').map(Number)
  const [y2, m2] = endKey.split('-').map(Number)
  const span = (y2 - y1) * 12 + (m2 - m1) + 1
  if (span >= 11) return { opcion: '12m', desde: resolved.start, hasta: resolved.end }
  if (span >= 5) return { opcion: '6m', desde: resolved.start, hasta: resolved.end }
  if (span >= 2) return { opcion: '3m', desde: resolved.start, hasta: resolved.end }
  return { opcion: 'custom', desde: resolved.start, hasta: resolved.end }
}

/**
 * Modal de exportación del PDF. El periodo inicial hereda el de los filtros de
 * la página; el PDF es siempre de la máquina completa y solo documenta el
 * alcance (sistema/componente) como línea informativa bajo el título.
 */
export default function ExportarHistoriaModal({ open, onClose, maquina, alcance, periodoInicial, onExport }) {
  const toast = useToast()
  const inicial = useMemo(() => opcionInicial(periodoInicial?.resolved ?? {}), [periodoInicial])
  const [opcion, setOpcion] = useState(inicial.opcion)
  const [desde, setDesde] = useState(inicial.desde ?? '')
  const [hasta, setHasta] = useState(inicial.hasta ?? '')
  const [loading, setLoading] = useState(false)
  const modalRef = useRef(null)
  const closeRef = useRef(null)

  useEffect(() => {
    if (open) {
      setOpcion(inicial.opcion)
      setDesde(inicial.desde ?? '')
      setHasta(inicial.hasta ?? '')
      document.body.style.overflow = 'hidden'
      setTimeout(() => closeRef.current?.focus(), 50)
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open, inicial])

  // Cierre con Escape (Cancel/X también)
  useEffect(() => {
    if (!open) return
    const esc = (e) => e.key === 'Escape' && onClose()
    const tab = (e) => {
      if (e.key !== 'Tab') return
      const focusable = modalRef.current?.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
      if (!focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault() }
      else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault() }
    }
    document.addEventListener('keydown', esc)
    document.addEventListener('keydown', tab)
    return () => {
      document.removeEventListener('keydown', esc)
      document.removeEventListener('keydown', tab)
    }
  }, [open, onClose])

  if (!open) return null

  const elegirOpcion = (value) => {
    setOpcion(value)
    const endKey = mesKey(periodoInicial?.resolved?.end)
    const endISO = finDeMes(endKey)
    if (value === '3m') { setDesde(finDeMes(restarMeses(endKey, 2))); setHasta(endISO) }
    else if (value === '6m') { setDesde(finDeMes(restarMeses(endKey, 5))); setHasta(endISO) }
    else if (value === '12m') { setDesde(finDeMes(restarMeses(endKey, 11))); setHasta(endISO) }
    else if (value === 'actual') { setDesde(`${endKey.slice(0, 4)}-01-01`); setHasta(endISO) }
    // 'custom' conserva los campos Desde/Hasta actuales
  }

  const descargar = async () => {
    setLoading(true)
    try {
      await onExport({ desde, hasta })
      onClose()
      toast('PDF descargado')
    } catch {
      toast('Error al generar el PDF')
    } finally {
      setLoading(false)
    }
  }

  const alcanceTexto = alcance?.sistemaNombre || alcance?.componenteNombre
    ? [alcance?.sistemaNombre, alcance?.componenteNombre].filter(Boolean).join(' · ')
    : null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-900/60 backdrop-blur-sm animate-[modal-fade-in_250ms_ease-out]" aria-hidden="true" />
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-historia-title"
        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl animate-[modal-scale-in_250ms_ease-out]"
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <h2 id="export-historia-title" className="text-lg font-bold text-ink-900">Exportar historia clínica</h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="grid size-9 place-items-center rounded-xl text-ink-700 transition-colors hover:bg-neutral-100"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div>
            <label htmlFor="export-maquina" className="block text-xs font-medium text-ink-500 mb-1.5">Máquina</label>
            <input
              id="export-maquina"
              value={`${maquina} L4`}
              disabled
              className="w-full rounded-xl border border-neutral-200 bg-neutral-100 px-3.5 py-2.5 text-sm text-ink-700"
            />
          </div>
          {alcanceTexto && (
            <p className="rounded-xl bg-neutral-50 px-3.5 py-2.5 text-xs text-ink-500">
              Alcance de indicadores: <span className="font-medium text-ink-700">{alcanceTexto}</span>
            </p>
          )}
          <div>
            <label htmlFor="export-periodo" className="block text-xs font-medium text-ink-500 mb-1.5">Periodo</label>
            <select
              id="export-periodo"
              value={opcion}
              onChange={(e) => elegirOpcion(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-ink-900"
            >
              <option value="3m">Últimos 3 meses</option>
              <option value="6m">Últimos 6 meses</option>
              <option value="12m">Últimos 12 meses</option>
              <option value="actual">Año actual</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>
          {opcion === 'custom' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="export-desde" className="block text-xs font-medium text-ink-500 mb-1.5">Desde</label>
                <input
                  id="export-desde"
                  type="date"
                  value={desde}
                  onChange={(e) => setDesde(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label htmlFor="export-hasta" className="block text-xs font-medium text-ink-500 mb-1.5">Hasta</label>
                <input
                  id="export-hasta"
                  type="date"
                  value={hasta}
                  onChange={(e) => setHasta(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-neutral-200 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-neutral-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={descargar}
            disabled={loading || !desde || !hasta}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-600 disabled:opacity-60"
          >
            {loading && <span className="size-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />}
            Descargar PDF
          </button>
        </div>
      </div>
    </div>
  )
}
