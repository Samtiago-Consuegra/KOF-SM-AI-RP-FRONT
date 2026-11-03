import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FileDown } from 'lucide-react'
import MaquinaSelector from '../components/historia/MaquinaSelector'
import FichaEquipo from '../components/historia/FichaEquipo'
import IndicadoresMaquina from '../components/historia/IndicadoresMaquina'
import LineaTiempo from '../components/historia/LineaTiempo'
import ComponentesMaquina from '../components/historia/ComponentesMaquina'
import ExportarHistoriaModal from '../components/historia/ExportarHistoriaModal'
import { getFicha, getIndicadores, getParosPorMes, getEventos, getComponentes, getResumenExportacion } from '../services/historiaClinicaService'
import { exportHistoriaPdf } from '../utils/exportHistoriaPdf'

const MAQUINAS = [
  { key: 'llenadora', label: 'Llenadora' },
  { key: 'empacadora', label: 'Empacadora' },
  { key: 'paletizadora', label: 'Paletizadora' },
  { key: 'envolvedora', label: 'Envolvedora' }
]

export default function HistoriaClinica() {
  const [searchParams, setSearchParams] = useSearchParams()
  const maquinaKey = searchParams.get('maquina') || 'llenadora'
  const maquina = MAQUINAS.find((m) => m.key === maquinaKey)?.label || 'Llenadora'
  
  const [ficha, setFicha] = useState(null)
  const [indicadores, setIndicadores] = useState(null)
  const [parosPorMes, setParosPorMes] = useState([])
  const [eventos, setEventos] = useState([])
  const [componentes, setComponentes] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  
  useEffect(() => {
    async function load() {
      setLoading(true)
      const [f, ind, ppm, ev, comp] = await Promise.all([
        getFicha(maquina),
        getIndicadores(maquina),
        getParosPorMes(maquina),
        getEventos({ maquina, tipo: 'Todo', pagina: 1 }),
        getComponentes(maquina)
      ])
      setFicha(f)
      setIndicadores(ind)
      setParosPorMes(ppm)
      setEventos(ev.items)
      setComponentes(comp)
      setLoading(false)
    }
    load()
  }, [maquina])
  
  const handleMaquinaChange = (key) => {
    setSearchParams({ maquina: key })
  }
  
  const handleExport = async (periodo) => {
    const resumen = await getResumenExportacion({ maquina, desde: periodo.desde, hasta: periodo.hasta })
    await exportHistoriaPdf(resumen)
  }
  
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 sm:text-3xl transition-all duration-300">Historia clínica · {maquina} L4</h1>
          <p className="mt-1 text-sm text-ink-500">Todo lo que le ha pasado a la máquina: fallas, avisos, órdenes y mantenimientos</p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-ink-900 transition-colors hover:border-primary-500 hover:text-primary-500"
        >
          <FileDown className="size-4" />
          Exportar historia (PDF)
        </button>
      </div>
      
      <div className="mb-6">
        <MaquinaSelector maquinas={MAQUINAS} value={maquinaKey} onChange={handleMaquinaChange} />
      </div>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
          <FichaEquipo ficha={ficha} maquina={maquina} maquinaKey={maquinaKey} loading={loading} />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <IndicadoresMaquina indicadores={indicadores} parosPorMes={parosPorMes} loading={loading} />
        </div>
      </div>
      
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <LineaTiempo maquina={maquina} loading={loading} />
        </div>
        <div className="lg:col-span-1">
          <ComponentesMaquina componentes={componentes} loading={loading} />
        </div>
      </div>
      
      <ExportarHistoriaModal open={modalOpen} onClose={() => setModalOpen(false)} maquina={maquina} onExport={handleExport} />
    </div>
  )
}
