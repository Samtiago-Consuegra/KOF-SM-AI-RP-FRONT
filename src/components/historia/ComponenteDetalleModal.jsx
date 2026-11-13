import { useEffect, useState } from 'react'
import { FileDown, Loader2 } from 'lucide-react'
import Modal from '../ui/Modal.jsx'
import Skeleton from '../ui/Skeleton.jsx'
import AntecedentesComponente from './AntecedentesComponente.jsx'
import { getAntecedentesComponente } from '../../services/historiaClinicaService.js'

const fmt = (v, dec = 0) => (v == null ? '—' : Number(v).toLocaleString('es-CO', { maximumFractionDigits: dec }))

/** Indicadores que muestra el modal y que se exportan al PDF (mismo texto en ambos). */
export function indicadoresDe(c) {
  const pocos = !c.datosSuficientes
  return [
    { label: 'Eventos', value: fmt(c.eventos) },
    { label: 'Minutos de paro', value: fmt(c.minutosParo) },
    { label: 'MTTR mediano', value: c.mttrMediana == null ? '—' : `${fmt(c.mttrMediana, 1)} min` },
    { label: 'MTBF mediano', value: pocos ? 'Pocos datos' : c.mtbfMedianaH == null ? '—' : `${fmt(c.mtbfMedianaH)} h`, pocos },
    { label: 'Tendencia', value: c.tendencia || '—' },
    { label: 'Confianza', value: c.confianza || '—', pocos },
  ]
}

export default function ComponenteDetalleModal({ componente, onClose }) {
  const open = !!componente
  const [antecedentes, setAntecedentes] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [exportando, setExportando] = useState(false)
  const [errorPdf, setErrorPdf] = useState('')

  useEffect(() => {
    if (!componente) return undefined
    let cancelado = false
    setCargando(true); setAntecedentes(null); setErrorPdf('')
    getAntecedentesComponente(componente.maquina, componente.id)
      .then((a) => { if (!cancelado) setAntecedentes(a) })
      .catch(() => { if (!cancelado) setAntecedentes(null) })
      .finally(() => { if (!cancelado) setCargando(false) })
    return () => { cancelado = true }
  }, [componente])

  if (!componente) return null
  const indicadores = indicadoresDe(componente)

  const exportar = async () => {
    if (exportando || cargando) return
    setExportando(true); setErrorPdf('')
    try {
      // jsPDF pesa ~1 MB: se descarga solo al exportar.
      const { exportAntecedentesComponentePdf } = await import('../../utils/exportHistoriaPdf.js')
      await exportAntecedentesComponentePdf(componente, indicadores, antecedentes)
    } catch {
      setErrorPdf('No se pudo generar el PDF')
    } finally {
      setExportando(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={componente.nombre}
      subtitle={[componente.maquina, componente.sistema, componente.id].filter(Boolean).join(' · ')}
      bodyClassName=""
      maxWidth="max-w-[880px]"
      footer={(
        <>
          <span className="self-center text-ink-500" role={errorPdf ? 'alert' : undefined}>
            {errorPdf ? <span className="text-primary-600">{errorPdf}</span> : 'Antecedentes calculados por el motor de planes'}
          </span>
          <button
            type="button"
            onClick={exportar}
            disabled={exportando || cargando}
            aria-busy={exportando}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary-500 px-3 text-sm font-medium text-white transition-[background-color,transform] duration-200 hover:bg-primary-600 active:scale-[.97] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400"
          >
            {exportando ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <FileDown className="size-4" aria-hidden="true" />}
            {exportando ? 'Generando…' : 'Exportar PDF'}
          </button>
        </>
      )}
    >
      <style>{`
        @keyframes cdm-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .cdm-in { animation: cdm-in 240ms cubic-bezier(.2,.8,.2,1) both; }
        @media (prefers-reduced-motion: reduce) { .cdm-in { animation: none !important; } }
      `}</style>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {indicadores.map((it, i) => (
            <div key={it.label} className="cdm-in rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5" style={{ animationDelay: `${i * 40}ms` }}>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">{it.label}</p>
              <p className={`mt-0.5 text-base font-bold tabular-nums ${it.value === 'Pocos datos' ? 'text-ink-500' : 'text-ink-900'}`}>{it.value}</p>
              {it.pocos && it.value !== 'Pocos datos' && (
                <span className="mt-1 inline-flex rounded-full bg-neutral-200/70 px-1.5 py-0.5 text-[10px] font-medium text-ink-600">Pocos datos</span>
              )}
            </div>
          ))}
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold text-ink-900">Antecedentes</h3>
          {cargando ? (
            <div className="space-y-2" role="status" aria-label="Cargando antecedentes">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <AntecedentesComponente antecedentes={antecedentes} />
          )}
        </div>
      </div>
    </Modal>
  )
}
