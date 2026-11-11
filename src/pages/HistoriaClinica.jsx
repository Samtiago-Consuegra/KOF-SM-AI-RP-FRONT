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
import AntecedentesComponente from '../components/historia/AntecedentesComponente.jsx'
import MotorVacio from '../components/ui/MotorVacio.jsx'
import {
  MAQUINAS,
  SUFIJO_LINEA,
  getFicha,
  getIndicadoresGeneral,
  getParosPorMesSector,
  getComponentesOrdenados,
  getJerarquia,
  getResumenExportacion,
  getAntecedentes,
} from '../services/historiaClinicaService'
import { resolveTimeRange } from '../utils/period.js'
import { toISODate } from '../utils/format.js'

// Últimos 12 meses como límites del filtro de periodo. Los indicadores del motor
// son de todo el histórico; el periodo filtra la línea de tiempo (en el back).
function boundsPeriodo() {
  const hoy = new Date()
  const months = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return { months, min: `${months[0]}-01`, max: toISODate(hoy) }
}

// La página abre sobre los últimos 12 meses.
function rangoPorDefecto() {
  const { months } = boundsPeriodo()
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
  const bounds = useMemo(() => boundsPeriodo(), [])
  const [jerarquia, setJerarquia] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  // Estado del motor: {available:false} o "calculando" muestran MotorVacio en lugar de los datos
  const [motor, setMotor] = useState({ available: true, message: '' })

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
    getJerarquia(maquina).then((h) => {
      if (!alive) return
      setJerarquia(h)
      setMotor({ available: h.available !== false, message: h.message || '' })
    })
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

  // Antecedentes del motor (fallas mayores, ACR, repuestos, antes/después)
  const [antecedentes, setAntecedentes] = useState(null)
  useEffect(() => {
    let alive = true
    getAntecedentes(maquina, componenteId || null).then((a) => { if (alive) setAntecedentes(a) })
    return () => { alive = false }
  }, [maquina, componenteId])

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

      {!motor.available ? (
        <div className="animate-[fade-swap-in_280ms_cubic-bezier(0.22,1,0.36,1)_both]">
          <MotorVacio
            message={motor.message || 'Aún no hay resultados del motor. Sube los archivos de SAP en Mantenimiento.'}
            className="min-h-[360px]"
          />
        </div>
      ) : (
      <>
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

      {/* Fila 3: Antecedentes (solo si el motor trae algo) */}
      {antecedentes && (antecedentes.componentes.length > 0 || antecedentes.causasFalla.length > 0 || antecedentes.causasAltoTiempo.length > 0) && (
        <Card key={`ant-${maquina}-${componenteId}`} className="p-6 motion-safe:animate-[fade-swap-in_280ms_cubic-bezier(0.22,1,0.36,1)_both]">
          <h2 className="text-lg font-semibold text-ink-900">Antecedentes</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {[
              { titulo: 'Causas de falla', items: antecedentes.causasFalla, chip: 'border-neutral-200 bg-[#F8F9FA] text-[#111827]', badge: 'bg-[#111827] text-white' },
              { titulo: 'Causas de alto tiempo', items: antecedentes.causasAltoTiempo, chip: 'border-[#0D9488]/20 bg-[#0D9488]/5 text-[#111827]', badge: 'bg-[#0D9488] text-white' },
            ].filter((g) => g.items.length > 0).map((g) => (
              <div key={g.titulo}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#111827]/60">{g.titulo}</h3>
                <ul className="flex flex-wrap gap-2">
                  {g.items.map(([causa, n], i) => (
                    <li
                      key={causa}
                      className={`inline-flex items-center gap-2 rounded-full border py-1 pl-3 pr-1 text-sm ${g.chip} motion-safe:animate-[fade-swap-in_220ms_cubic-bezier(0.22,1,0.36,1)_both]`}
                      style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}
                    >
                      {causa}
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${g.badge}`}>{n}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {antecedentes.componentes.length > 0 && (
            <div className="mt-6 space-y-4">
              {antecedentes.componentes.map((c) => <AntecedentesComponente key={c.Id_componente} componente={c} />)}
            </div>
          )}
        </Card>
      )}
      </>
      )}

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
