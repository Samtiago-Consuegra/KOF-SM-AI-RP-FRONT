import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertCircle, FileSearch, FileSpreadsheet, RotateCw, Search, Upload, X } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Skeleton from '../components/ui/Skeleton'
import Paginacion from '../components/ui/Paginacion'
import DateRangePicker from '../components/ui/Calendar'
import InfoTip from '../components/ui/InfoTip'
import SubirArchivoModal from '../components/mantenimiento/SubirArchivoModal'
import { ARCHIVOS } from '../services/mantenimientoService'
import { getHistorialArchivos } from '../api/motor'
import { useToast } from '../context/ToastContext'
import { toISODate } from '../utils/format'

const POR_PAGINA = 8
const REPORTE = 'reporte_diario'
// Los 6 Excel del motor + el reporte diario (se carga por /upload, no por el motor).
const TIPOS = [...ARCHIVOS, { clave: REPORTE, tipo: 'Reporte diario', Icon: FileSpreadsheet }]
const CLAVES = new Set(TIPOS.map((a) => a.clave))
const POR_CLAVE = Object.fromEntries(TIPOS.map((a) => [a.clave, a]))

const fechaCorta = (iso) => {
  if (!iso) return '—'
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '')
}
const num = (n) => (n == null ? '—' : Number(n).toLocaleString('es-CO'))

const fechaCarga = (iso) => {
  if (!iso) return '—'
  // El back guarda en UTC; sin zona explícita se interpreta como UTC.
  const d = new Date(/[zZ]|[+-]\d{2}:?\d{2}$/.test(iso) ? iso : iso + 'Z')
  return d.toLocaleString('es-CO', {
    timeZone: 'America/Bogota', day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).replace('.', '')
}

const tamano = (n) => {
  if (!n) return '—'
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

function Chip({ activo, onClick, children, conteo, delay }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={activo}
      onClick={onClick}
      style={{ animationDelay: `${delay}ms` }}
      className={`hx-up inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-sm font-medium whitespace-nowrap transition-[background-color,border-color,color,transform] duration-200 active:scale-[.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400 ${
        activo ? 'border-ink-900 bg-ink-900 text-white' : 'border-neutral-200 bg-white text-ink-700 hover:bg-neutral-50'
      }`}
    >
      {children}
      <span
        key={conteo ?? '-'}
        className={`hx-pop min-w-5 rounded-full px-1.5 text-xs tabular-nums transition-colors ${activo ? 'bg-white/15 text-white' : 'bg-neutral-100 text-ink-500'}`}
      >
        {conteo ?? '–'}
      </span>
    </button>
  )
}

export default function HistorialExcel() {
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const tipoUrl = params.get('tipo')
  const tipo = CLAVES.has(tipoUrl) ? tipoUrl : null

  const hoy = toISODate(new Date())
  const [mes, setMes] = useState(hoy.slice(0, 7))
  const [rango, setRango] = useState({ from: null, to: null })
  const [texto, setTexto] = useState('')
  const [buscar, setBuscar] = useState('')
  const [pagina, setPagina] = useState(1)
  const [recarga, setRecarga] = useState(0)
  const [modal, setModal] = useState(false)

  const [data, setData] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  // Espera 300 ms tras la última tecla antes de buscar.
  useEffect(() => {
    const id = setTimeout(() => { setBuscar(texto.trim()); setPagina(1) }, 300)
    return () => clearTimeout(id)
  }, [texto])

  // Mientras se elige el día final, el rango aún no filtra.
  const desde = rango.from && rango.to ? rango.from : null
  const hasta = rango.from && rango.to ? rango.to : null

  useEffect(() => {
    let cancelado = false
    setCargando(true)
    setError(null)
    getHistorialArchivos({ tipo, desde, hasta, buscar, pagina, por_pagina: POR_PAGINA })
      .then((res) => { if (!cancelado) setData(res) })
      .catch((e) => { if (!cancelado) setError(e?.message || 'No se pudo cargar el historial') })
      .finally(() => { if (!cancelado) setCargando(false) })
    return () => { cancelado = true }
  }, [tipo, desde, hasta, buscar, pagina, recarga])

  const elegirTipo = (clave) => {
    setPagina(1)
    setParams((p) => {
      const n = new URLSearchParams(p)
      if (clave) n.set('tipo', clave)
      else n.delete('tipo')
      return n
    }, { replace: true })
  }

  const conteo = data?.conteo_por_tipo || null
  const totalTodos = conteo ? Object.values(conteo).reduce((s, n) => s + (Number(n) || 0), 0) : null
  const items = data?.items || []
  const total = data?.total ?? 0
  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA))
  const hayFiltros = !!(desde || buscar)

  return (
    <div className="hx-page space-y-6 max-w-[1500px] mx-auto">
      <style>{`
        @keyframes hx-up { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @keyframes hx-slide { from { opacity: 0; transform: translateX(12px); } to { opacity: 1; transform: none; } }
        @keyframes hx-pop { 0% { transform: scale(.7); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes hx-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        .hx-page { animation: hx-up 320ms cubic-bezier(.2,.8,.2,1) both; }
        .hx-up { animation: hx-up 260ms ease-out both; }
        .hx-pop { animation: hx-pop 200ms ease-out both; }
        .hx-row { animation: hx-slide 260ms cubic-bezier(.2,.8,.2,1) both; }
        .hx-float { animation: hx-float 2.4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .hx-page, .hx-up, .hx-pop, .hx-row, .hx-float { animation: none !important; }
        }
      `}</style>

      <div className="space-y-4">
        <PageHeader title="Historial de Excel" subtitle="Archivos cargados al motor de planes">
          <button
            type="button"
            onClick={() => setModal(true)}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary-500 px-4 text-sm font-semibold text-white shadow-sm transition-[background-color,transform] duration-200 hover:bg-primary-600 active:scale-[.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400"
          >
            <Upload className="size-4" aria-hidden="true" />
            Subir archivo
          </button>
        </PageHeader>

        <div role="radiogroup" aria-label="Tipo de archivo" className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          <Chip activo={!tipo} onClick={() => elegirTipo(null)} conteo={totalTodos} delay={0}>Todos</Chip>
          {TIPOS.map((a, i) => (
            <Chip key={a.clave} activo={tipo === a.clave} onClick={() => elegirTipo(a.clave)} conteo={conteo ? conteo[a.clave] ?? 0 : null} delay={(i + 1) * 30}>
              <a.Icon className="size-4" aria-hidden="true" />
              {a.tipo}
            </Chip>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-2.5" role="group" aria-label="Filtros de fecha y nombre">
          <div>
            <span className="block text-xs font-medium text-ink-500 mb-1.5">Fecha de carga</span>
            <DateRangePicker
              from={rango.from}
              to={rango.to}
              month={mes}
              onChange={({ from, to }) => { setRango({ from, to }); setPagina(1) }}
              onMonthChange={setMes}
              min="2024-01-01"
              max={hoy}
              label="Fecha de carga"
            />
          </div>
          <div className="w-full sm:w-80">
            <label htmlFor="hx-buscar" className="block text-xs font-medium text-ink-500 mb-1.5">Nombre del archivo</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" aria-hidden="true" />
              <input
                id="hx-buscar"
                type="search"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Buscar por nombre…"
                className="h-10 w-full rounded-xl border border-neutral-200 bg-white pl-9 pr-9 text-sm text-ink-900 placeholder:text-ink-400 transition-colors focus:border-tertiary-500 focus:outline-none focus:ring-2 focus:ring-tertiary-400/40"
              />
              {texto && (
                <button type="button" onClick={() => setTexto('')} aria-label="Limpiar búsqueda" className="hx-pop absolute right-2 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-ink-400 hover:bg-neutral-100 hover:text-ink-700">
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-neutral-200 bg-white" aria-busy={cargando}>
        {error ? (
          <div className="hx-up flex flex-col items-center gap-3 px-6 py-14 text-center" role="alert">
            <AlertCircle className="size-8 text-primary-500" aria-hidden="true" />
            <p className="text-sm font-medium text-ink-900">No se pudo cargar el historial</p>
            <p className="text-xs text-ink-500 max-w-md">{error}</p>
            <button
              type="button"
              onClick={() => setRecarga((n) => n + 1)}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-medium text-ink-700 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400"
            >
              <RotateCw className="size-4" aria-hidden="true" />
              Reintentar
            </button>
          </div>
        ) : cargando && !data ? (
          <div className="space-y-3 p-5" role="status" aria-label="Cargando historial">
            <Skeleton className="h-8 w-full" />
            {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="hx-up flex flex-col items-center gap-3 px-6 py-16 text-center">
            <div className="hx-float grid size-14 place-items-center rounded-2xl bg-neutral-50 ring-1 ring-neutral-200">
              <FileSearch className="size-7 text-ink-400" aria-hidden="true" />
            </div>
            <p className="text-sm font-medium text-ink-900">No hay archivos de este tipo</p>
            {hayFiltros && <p className="text-xs text-ink-500">Prueba con otro rango de fechas o con otro nombre.</p>}
          </div>
        ) : (
          <>
            <div className={`overflow-x-auto transition-opacity duration-200 ${cargando ? 'opacity-60' : 'opacity-100'}`}>
              <table className="w-full min-w-[860px] text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
                    <th scope="col" className="px-5 py-3">Tipo</th>
                    <th scope="col" className="px-5 py-3">Nombre del archivo</th>
                    <th scope="col" className="px-5 py-3">Fecha de carga</th>
                    <th scope="col" className="px-5 py-3">Subido por</th>
                    <th scope="col" className="px-5 py-3 text-right">Tamaño</th>
                    <th scope="col" className="px-5 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody key={pagina} className="divide-y divide-neutral-100">
                  {items.map((it, i) => {
                    const meta = POR_CLAVE[it.tipo]
                    const Icon = meta?.Icon || FileSearch
                    return (
                      <tr key={`${it.tipo}-${it.id}`} className="hx-row transition-colors hover:bg-neutral-50" style={{ animationDelay: `${Math.min(i, 15) * 30}ms` }}>
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center gap-2 whitespace-nowrap text-ink-900">
                            <span className="grid size-7 place-items-center rounded-lg bg-neutral-50 ring-1 ring-neutral-200">
                              <Icon className="size-3.5 text-ink-700" aria-hidden="true" />
                            </span>
                            {meta?.tipo || it.tipo}
                          </span>
                        </td>
                        <td className="px-5 py-3 max-w-[320px]">
                          <span className="block truncate font-medium text-ink-900" title={it.nombre_archivo}>{it.nombre_archivo}</span>
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap tabular-nums text-ink-700">{fechaCarga(it.subido_en)}</td>
                        <td className="px-5 py-3 max-w-[220px]"><span className="block truncate text-ink-700" title={it.subido_por || ''}>{it.subido_por_nombre || it.subido_por || '—'}</span></td>
                        <td className="px-5 py-3 whitespace-nowrap text-right tabular-nums text-ink-700">{tamano(it.tamano_bytes)}</td>
                        <td className="px-5 py-3">
                          {it.tipo === REPORTE ? (
                            <span className="inline-flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-tertiary-50 px-2.5 py-1 text-xs font-semibold text-tertiary-700 ring-1 ring-tertiary-200">
                                <span className="size-1.5 rounded-full bg-tertiary-500" aria-hidden="true" />
                                Procesado
                              </span>
                              <InfoTip title="Detalle de la carga" placement={i >= items.length - 3 && i > 2 ? 'top' : 'bottom'}>
                                <span className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 tabular-nums">
                                  <span className="text-ink-500">Insertados</span><span className="font-semibold text-ink-900">{num(it.registros_insertados)}</span>
                                  <span className="text-ink-500">Duplicados</span><span className="font-semibold text-ink-900">{num(it.registros_duplicados)}</span>
                                  <span className="text-ink-500">Fechas</span><span className="font-semibold text-ink-900">{fechaCorta(it.fecha_desde)} – {fechaCorta(it.fecha_hasta)}</span>
                                </span>
                              </InfoTip>
                            </span>
                          ) : it.vigente ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-tertiary-50 px-2.5 py-1 text-xs font-semibold text-tertiary-700 ring-1 ring-tertiary-200">
                              <span className="size-1.5 rounded-full bg-tertiary-500" aria-hidden="true" />
                              En uso
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-ink-500">Reemplazado</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <Paginacion
              page={pagina}
              totalPages={totalPaginas}
              from={(pagina - 1) * POR_PAGINA + 1}
              to={Math.min(pagina * POR_PAGINA, total)}
              total={total}
              onPageChange={setPagina}
              label="Paginación del historial"
            />
          </>
        )}
      </section>

      <SubirArchivoModal
        open={modal}
        onClose={() => setModal(false)}
        onSuccess={() => setRecarga((n) => n + 1)}
        onToast={(msg) => toast(msg, 'success')}
      />
    </div>
  )
}
