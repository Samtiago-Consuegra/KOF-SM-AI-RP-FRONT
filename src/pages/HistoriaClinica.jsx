import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FileDown } from 'lucide-react'
import MachineFilter from '../components/ui/MachineFilter.jsx'
import PeriodFilter from '../components/ui/PeriodFilter.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import Dropdown from '../components/ui/Dropdown.jsx'
import Card from '../components/ui/Card.jsx'
import FichaEquipo from '../components/historia/FichaEquipo.jsx'
import IndicadoresMaquina from '../components/historia/IndicadoresMaquina.jsx'
import LineaTiempo from '../components/historia/LineaTiempo.jsx'
import ComponentesMaquina from '../components/historia/ComponentesMaquina.jsx'
import ExportarHistoriaModal from '../components/historia/ExportarHistoriaModal.jsx'
import ComponenteSelect from '../components/historia/ComponenteSelect.jsx'
import {
  MAQUINAS,
  SUFIJO_LINEA,
  getFicha,
  getIndicadoresGeneral,
  getParosPorMesSector,
  getComponentesOrdenados,
  getJerarquia,
  getResumenExportacion,
} from '../services/historiaClinicaService'
import { resolveTimeRange } from '../utils/period.js'
import { exportHistoriaPdf } from '../utils/exportHistoriaPdf.js'
import { toISODate } from '../utils/format.js'

// Últimos 12 meses como límites del filtro de periodo (mock local, sin backend).
// Cuando exista API se reemplaza por los periodos reales.
function boundsMock() {
  const hoy = new Date()
  const months = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return { months, min: `${months[0]}-01`, max: toISODate(hoy) }
}

// La página abre sobre los últimos 12 meses (todo el histórico simulado).
function rangoPorDefecto() {
  const { months } = boundsMock()
  return {
    period: 'meses',
    month: months[months.length - 1],
    from: null,
    to: null,
    fromMonth: months[0],
    toMonth: months[months.length - 1],
  }
}

// Parámetros del periodo guardados en la URL: pm, pmo, pf, pt, pfm, ptm
function rangoDesdeURL(sp) {
  const base = rangoPorDefecto()
  return {
    period: sp.get('pm') ?? base.period,
    month: sp.get('pmo') ?? base.month,
    from: sp.get('pf') ?? null,
    to: sp.get('pt') ?? null,
    fromMonth: sp.get('pfm') ?? base.fromMonth,
    toMonth: sp.get('ptm') ?? base.toMonth,
  }
}

function rangoAParams(range) {
  return {
    pm: range.period,
    pmo: range.month ?? '',
    pf: range.from ?? '',
    pt: range.to ?? '',
    pfm: range.fromMonth ?? '',
    ptm: range.toMonth ?? '',
  }
}

export default function HistoriaClinica() {
  const [searchParams, setSearchParams] = useSearchParams()
  const bounds = useMemo(() => boundsMock(), [])
  const [jerarquia, setJerarquia] = useState([])
  const [modalOpen, setModalOpen] = useState(false)

  const maquina = MAQUINAS.includes(searchParams.get('maquina')) ? searchParams.get('maquina') : 'Llenadora'
  const sistemaId = searchParams.get('sistema') ?? ''
  const componenteId = searchParams.get('componente') ?? ''

  const [range, setRange] = useState(() => rangoDesdeURL(searchParams))
  const resolved = useMemo(
    () => resolveTimeRange(range, new Date(), bounds),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [range, bounds],
  )

  const sistema = jerarquia.find((s) => s.id === sistemaId) ?? null
  const componente = sistema?.componentes.find((c) => c.id === componenteId) ?? null

  // Jerarquía de sistemas/componentes según la máquina seleccionada
  useEffect(() => {
    let alive = true
    setJerarquia([])
    getJerarquia(maquina).then((h) => { if (alive) setJerarquia(h) })
    return () => { alive = false }
  }, [maquina])

  // Cambiar de máquina: Sistema y Componente vuelven a "Todos" (se omiten del URL)
  const setMaquina = useCallback((m) => {
    setSearchParams({ maquina: m, ...rangoAParams(range) })
  }, [range, setSearchParams])

  // Cambiar de sistema: Componente vuelve a "Todos"
  const setSistema = useCallback((id) => {
    const next = { maquina, ...rangoAParams(range) }
    if (id) next.sistema = id
    setSearchParams(next)
  }, [maquina, range, setSearchParams])

  const setComponente = useCallback((id) => {
    const next = { maquina, ...rangoAParams(range) }
    if (sistemaId) next.sistema = sistemaId
    if (id) next.componente = id
    setSearchParams(next)
  }, [maquina, sistemaId, range, setSearchParams])

  const setRango = useCallback((r) => {
    setRange(r)
    const next = { maquina, ...rangoAParams(r) }
    if (sistemaId) next.sistema = sistemaId
    if (componenteId) next.componente = componenteId
    setSearchParams(next)
  }, [maquina, sistemaId, componenteId, setSearchParams])

  // Alcance de los filtros
  const filtrosBase = useMemo(
    () => ({ desde: resolved.start, hasta: resolved.end }),
    [resolved.start, resolved.end],
  )
  const filtrosIndicadores = useMemo(
    () => ({ ...filtrosBase, sistema: sistemaId || null, componente: componenteId || null }),
    [filtrosBase, sistemaId, componenteId],
  )

  // Opciones de los filtros en cascada
  const opcionesMaquinas = useMemo(
    () => MAQUINAS.map((m) => ({ value: m, label: m, hint: SUFIJO_LINEA })),
    [],
  )
  const opcionesSistemas = useMemo(() => [
    { value: '', label: 'Todos los sistemas' },
    ...jerarquia.map((s) => ({ value: s.id, label: s.nombre })),
  ], [jerarquia])

  // Carga de secciones
  const [ficha, setFicha] = useState(null)
  const [indicadores, setIndicadores] = useState(null)
  const [parosPorMes, setParosPorMes] = useState(null)
  const [componentes, setComponentes] = useState(null)
  const [cargandoBase, setCargandoBase] = useState(true)
  const [cargandoIndic, setCargandoIndic] = useState(true)
  const [cargandoAbajo, setCargandoAbajo] = useState(true)

  useEffect(() => {
    let alive = true
    setCargandoBase(true)
    getFicha(maquina, filtrosBase).then((r) => {
      if (alive) { setFicha(r); setCargandoBase(false) }
    })
    return () => { alive = false }
  }, [maquina, filtrosBase])

  useEffect(() => {
    let alive = true
    setCargandoIndic(true)
    Promise.all([
      getIndicadoresGeneral(maquina, filtrosIndicadores),
      getParosPorMesSector(maquina, filtrosIndicadores),
    ]).then(([ind, ppm]) => {
      if (alive) { setIndicadores(ind); setParosPorMes(ppm); setCargandoIndic(false) }
    })
    return () => { alive = false }
  }, [maquina, filtrosIndicadores])

  useEffect(() => {
    let alive = true
    setCargandoAbajo(true)
    getComponentesOrdenados(maquina, filtrosBase).then((comp) => {
      if (alive) { setComponentes(comp); setCargandoAbajo(false) }
    })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maquina, filtrosBase, resolved.seedKey])

  const handleExportar = useCallback(async ({ desde, hasta }) => {
    const resumen = await getResumenExportacion({
      maquina,
      desde,
      hasta,
      sistema: sistemaId || null,
      componente: componenteId || null,
    })
    await exportHistoriaPdf(resumen)
  }, [maquina, sistemaId, componenteId])

  const ctxTitulo = useMemo(() => ({
    maquina: `${maquina} ${SUFIJO_LINEA}`,
    sistemaNombre: sistema?.nombre ?? null,
    componenteNombre: componente?.nombre ?? null,
    periodoLabel: resolved.label,
  }), [maquina, sistema, componente, resolved.label])

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto">
      {/* Encabezado: mismo componente que el resto de vistas */}
      <PageHeader
        title={`Historia clínica · ${maquina} ${SUFIJO_LINEA}`}
        subtitle="Todo lo que le ha pasado a la máquina: fallas, avisos, órdenes y mantenimientos"
      >
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 text-sm font-medium text-ink-900 transition-colors hover:border-primary-500 hover:text-primary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400"
        >
          <FileDown className="size-4" aria-hidden="true" />
          Exportar historia (PDF)
        </button>
      </PageHeader>

      {/* Filtros: mismos componentes del EDA + cascada Sistema → Componente.
          Dos grupos centrados y repartidos con justify-content (3 de máquina y
          3 de periodo) para que quepan en una sola línea y, si no cabe, bajen
          juntos como 3 + 3. */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end md:justify-center md:gap-x-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-x-3">
            <MachineFilter
              label="Máquina"
              variant="toolbar"
              value={maquina}
              onChange={setMaquina}
              options={opcionesMaquinas}
              className="w-full md:w-44"
            />
            <Dropdown
              label="Sistema"
              variant="toolbar"
              value={sistemaId}
              onChange={setSistema}
              options={opcionesSistemas}
              className="w-full md:w-48"
              renderValue={(o) => <span className="font-medium">{o?.label ?? 'Todos los sistemas'}</span>}
            />
            <ComponenteSelect options={sistema?.componentes ?? []} value={componenteId} onChange={setComponente} />
          </div>
          <PeriodFilter value={range} onChange={setRango} bounds={bounds} tone="neutral" layout="spread" periodControl="dropdown" />
        </div>
      </Card>

      {/* Fila 1: Ficha (1/3) + Indicadores (2/3), misma altura */}
      <div className="grid gap-6 lg:grid-cols-3 items-stretch">
        <FichaEquipo ficha={ficha} maquina={maquina} loading={cargandoBase} />
        <div className="lg:col-span-2">
          <IndicadoresMaquina
            indicadores={indicadores}
            parosPorMes={parosPorMes}
            loading={cargandoIndic}
            alcance={ctxTitulo}
          />
        </div>
      </div>

      {/* Fila 2: Línea de tiempo (2/3) + Componentes (1/3) */}
      <div className="grid gap-6 lg:grid-cols-3 items-start">
        <div className="lg:col-span-2">
          <LineaTiempo
            maquina={maquina}
            desde={resolved.start}
            hasta={resolved.end}
            periodoKey={resolved.seedKey}
            loading={cargandoAbajo}
          />
        </div>
        <div className="lg:col-span-1">
          <ComponentesMaquina
            componentes={componentes}
            loading={cargandoAbajo}
            maquina={maquina}
            periodoKey={resolved.seedKey}
          />
        </div>
      </div>

      {/* Modal de exportación */}
      <ExportarHistoriaModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maquina={maquina}
        alcance={sistema || componente ? ctxTitulo : null}
        periodoInicial={{ range, resolved }}
        onExport={handleExportar}
      />
    </div>
  )
}
