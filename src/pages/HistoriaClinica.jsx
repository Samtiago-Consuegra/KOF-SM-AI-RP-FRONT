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
  getPeriodos,
  getFicha,
  getIndicadoresGeneral,
  getParosPorMesSector,
  getJerarquia,
  getResumenExportacion,
  invalidarHistoria,
} from '../services/historiaClinicaService'
import { useMotorEstado } from '../hooks/useMotorEstado.js'
import { resolveTimeRange } from '../utils/period.js'

// La página abre sobre los últimos 12 meses CON DATOS (el reporte diario va atrasado
// respecto a hoy). Los límites salen de GET /motor/historia/periodos.
function rangoPorDefecto(bounds) {
  const months = bounds?.months ?? []
  const ultimo = months[months.length - 1] ?? null
  return {
    period: 'meses',
    month: ultimo,
    from: null,
    to: null,
    fromMonth: months[Math.max(0, months.length - 12)] ?? null,
    toMonth: ultimo,
  }
}

// Parámetros del periodo guardados en la URL: pm, pmo, pf, pt, pfm, ptm
function rangoDesdeURL(sp, bounds) {
  const base = rangoPorDefecto(bounds)
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
  // undefined = cargando · null = el motor aún no tiene datos
  const [bounds, setBounds] = useState(undefined)
  const [jerarquia, setJerarquia] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  // Sube cuando termina una corrida del motor: todas las secciones se vuelven a pedir.
  const [version, setVersion] = useState(0)
  useMotorEstado(useCallback(() => { invalidarHistoria(); setVersion((v) => v + 1) }, []))

  const maquina = MAQUINAS.includes(searchParams.get('maquina')) ? searchParams.get('maquina') : 'Llenadora'
  const sistemaId = searchParams.get('sistema') ?? ''
  const componenteId = searchParams.get('componente') ?? ''

  // Si la URL ya trae un periodo se respeta; si no, se fija al llegar los límites reales.
  const [range, setRange] = useState(() => (searchParams.get('pm') ? rangoDesdeURL(searchParams, null) : null))
  const resolved = useMemo(
    () => (bounds && range ? resolveTimeRange(range, new Date(), bounds) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [range, bounds],
  )

  useEffect(() => {
    let alive = true
    getPeriodos()
      .then((b) => {
        if (!alive) return
        setBounds(b)
        if (b) setRange((r) => r ?? rangoPorDefecto(b))
      })
      .catch(() => { if (alive) setBounds(null) })
    return () => { alive = false }
  }, [version])

  const sistema = jerarquia.find((s) => s.id === sistemaId) ?? null
  const componente = sistema?.componentes.find((c) => c.id === componenteId) ?? null

  // Jerarquía de sistemas/componentes según la máquina seleccionada
  useEffect(() => {
    let alive = true
    setJerarquia([])
    getJerarquia(maquina).then((h) => { if (alive) setJerarquia(h) }).catch(() => {})
    return () => { alive = false }
  }, [maquina, version])

  // Cambiar de máquina: Sistema y Componente vuelven a "Todos" (se omiten del URL)
  const setMaquina = useCallback((m) => {
    setSearchParams({ maquina: m, ...(range ? rangoAParams(range) : {}) })
  }, [range, setSearchParams])

  // Cambiar de sistema: Componente vuelve a "Todos"
  const setSistema = useCallback((id) => {
    const next = { maquina, ...(range ? rangoAParams(range) : {}) }
    if (id) next.sistema = id
    setSearchParams(next)
  }, [maquina, range, setSearchParams])

  const setComponente = useCallback((id) => {
    const next = { maquina, ...(range ? rangoAParams(range) : {}) }
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
    () => (resolved ? { desde: resolved.start, hasta: resolved.end } : null),
    [resolved?.start, resolved?.end], // eslint-disable-line react-hooks/exhaustive-deps
  )
  const filtrosIndicadores = useMemo(
    () => (filtrosBase ? { ...filtrosBase, sistema: sistemaId || null, componente: componenteId || null } : null),
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
  const [cargandoBase, setCargandoBase] = useState(true)
  const [cargandoIndic, setCargandoIndic] = useState(true)

  useEffect(() => {
    if (!filtrosBase) return undefined
    let alive = true
    setCargandoBase(true)
    getFicha(maquina, filtrosBase)
      .catch(() => null)
      .then((r) => { if (alive) { setFicha(r); setCargandoBase(false) } })
    return () => { alive = false }
  }, [maquina, filtrosBase, version])

  useEffect(() => {
    if (!filtrosIndicadores) return undefined
    let alive = true
    setCargandoIndic(true)
    Promise.all([
      getIndicadoresGeneral(maquina, filtrosIndicadores),
      getParosPorMesSector(maquina, filtrosIndicadores),
    ])
      .catch(() => [null, null])
      .then(([ind, ppm]) => {
        if (alive) { setIndicadores(ind); setParosPorMes(ppm); setCargandoIndic(false) }
      })
    return () => { alive = false }
  }, [maquina, filtrosIndicadores, version])

  const handleExportar = useCallback(async ({ desde, hasta }) => {
    const resumen = await getResumenExportacion({
      maquina,
      desde,
      hasta,
      sistema: sistemaId || null,
      componente: componenteId || null,
    })
    // jsPDF + autotable pesan ~1 MB: se descargan recién al exportar. El modal
    // ya muestra su spinner mientras se resuelve esta promesa.
    const { exportHistoriaPdf } = await import('../utils/exportHistoriaPdf.js')
    await exportHistoriaPdf(resumen)
  }, [maquina, sistemaId, componenteId])

  const ctxTitulo = useMemo(() => ({
    maquina: `${maquina} ${SUFIJO_LINEA}`,
    sistemaNombre: sistema?.nombre ?? null,
    componenteNombre: componente?.nombre ?? null,
    periodoLabel: resolved?.label ?? '',
  }), [maquina, sistema, componente, resolved?.label])

  // El motor nunca ha corrido: no hay nada que filtrar ni mostrar todavía.
  if (bounds === null) {
    return (
      <div className="space-y-6 max-w-[1500px] mx-auto">
        <PageHeader
          title={`Historia clínica · ${maquina} ${SUFIJO_LINEA}`}
          subtitle="Todo lo que le ha pasado a la máquina: fallas, avisos, órdenes y mantenimientos"
        />
        <Card className="p-6">
          <p className="text-sm text-ink-500">Aún no hay resultados del motor. Sube los archivos de SAP en Mantenimiento.</p>
        </Card>
      </div>
    )
  }

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
          disabled={!resolved}
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
          {range && bounds && (
            <PeriodFilter value={range} onChange={setRango} bounds={bounds} tone="neutral" layout="spread" periodControl="dropdown" />
          )}
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
            key={version}
            maquina={maquina}
            desde={resolved?.start}
            hasta={resolved?.end}
            periodoKey={resolved?.seedKey}
            loading={!resolved}
          />
        </div>
        <div className="lg:col-span-1">
          {/* Lista del motor: los chips de máquina de la tarjeta no alteran el resto de la página. */}
          <ComponentesMaquina key={version} maquina={maquina} />
        </div>
      </div>

      {/* Modal de exportación */}
      {resolved && (
        <ExportarHistoriaModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          maquina={maquina}
          alcance={sistema || componente ? ctxTitulo : null}
          periodoInicial={{ range, resolved }}
          onExport={handleExportar}
        />
      )}
    </div>
  )
}
