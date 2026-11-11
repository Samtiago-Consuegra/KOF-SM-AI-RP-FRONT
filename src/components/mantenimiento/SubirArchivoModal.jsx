import { useRef, useState } from 'react'
import { UploadCloud, FileSpreadsheet, X, AlertTriangle, ClipboardList, CalendarCheck, Layers, FileSearch, FileCheck2, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { subirArchivo } from '../../services/mantenimientoService.js'
import { TIPOS_ARCHIVO } from '../../api/motorAdapter.js'

const ICONS = { AlertTriangle, ClipboardList, CalendarCheck, Layers, FileSearch, FileCheck2 }
const MAX_MB = 50
const EXTS = ['xlsx', 'xls']

const ESTILOS = `
  @keyframes sam-backdrop { from { opacity: 0; } to { opacity: 1; } }
  @keyframes sam-in { from { opacity: 0; transform: translateY(8px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
  @keyframes sam-row { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes sam-pop { 0% { transform: scale(0.6); opacity: 0; } 60% { transform: scale(1.12); opacity: 1; } 100% { transform: scale(1); } }
  .sam-backdrop { animation: sam-backdrop 200ms cubic-bezier(0.22,1,0.36,1) both; }
  .sam-dialog { animation: sam-in 220ms cubic-bezier(0.22,1,0.36,1) both; }
  .sam-row { animation: sam-row 200ms cubic-bezier(0.22,1,0.36,1) both; }
  .sam-pop { animation: sam-pop 260ms cubic-bezier(0.22,1,0.36,1) both; }
  .sam-tipo { transition: border-color 160ms ease, background-color 160ms ease, transform 120ms cubic-bezier(0.25,0.46,0.45,0.94); touch-action: manipulation; }
  .sam-tipo:active { transform: scale(0.98); }
  .sam-bar { transition: transform 220ms cubic-bezier(0.25,1,0.5,1); transform-origin: left; }
  .sam-drop { transition: border-color 160ms ease, background-color 160ms ease; }
  @media (prefers-reduced-motion: reduce) {
    .sam-dialog, .sam-row, .sam-pop { animation: sam-backdrop 150ms ease both; }
    .sam-tipo { transition: border-color 160ms ease, background-color 160ms ease; }
    .sam-tipo:active { transform: none; }
    .sam-bar { transition: none; }
  }
`

function validar(f) {
  const ext = f.name.split('.').pop().toLowerCase()
  if (!EXTS.includes(ext)) return 'Solo se aceptan archivos .xlsx o .xls'
  if (f.size > MAX_MB * 1024 * 1024) return `El archivo supera ${MAX_MB} MB`
  return ''
}

export default function SubirArchivoModal({ open, onClose, onSuccess, onToast }) {
  const [tipo, setTipo] = useState('')
  const [items, setItems] = useState([]) // [{ file, estado: pendiente|subiendo|ok|error, error }]
  const [drag, setDrag] = useState(false)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [actual, setActual] = useState(0)
  const inputRef = useRef(null)

  if (!open) return null

  const def = TIPOS_ARCHIVO.find((t) => t.clave === tipo)
  const multiple = !!def?.multiple

  const reset = () => { setTipo(''); setItems([]); setErr(''); setProgress(0); setActual(0); setDrag(false) }
  const cerrar = () => { if (loading) return; reset(); onClose() }

  const elegirTipo = (clave) => {
    if (loading) return
    setTipo(clave)
    const nuevo = TIPOS_ARCHIVO.find((t) => t.clave === clave)
    if (!nuevo?.multiple) setItems((prev) => prev.slice(0, 1))
  }

  const pick = (fileList) => {
    setErr('')
    const files = Array.from(fileList || [])
    if (!files.length) return
    const errores = []
    const validos = []
    for (const f of files) {
      const e = validar(f)
      if (e) errores.push(`${f.name}: ${e}`)
      else validos.push({ file: f, estado: 'pendiente', error: '' })
    }
    if (errores.length) setErr(errores.join(' · '))
    if (!validos.length) return
    setItems((prev) => {
      if (!multiple) return validos.slice(0, 1)
      const nombres = new Set(prev.map((it) => it.file.name))
      return [...prev, ...validos.filter((v) => !nombres.has(v.file.name))]
    })
  }

  const onDrop = (e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files) }
  const quitar = (nombre) => setItems((prev) => prev.filter((it) => it.file.name !== nombre))
  const marcar = (idx, cambios) => setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...cambios } : it)))

  const submit = async () => {
    if (!tipo || !items.length || loading) return
    setLoading(true)
    setProgress(0)
    const total = items.length
    let okCount = 0
    let ultimo = null
    // Uno por uno: el back encola una corrida por cada archivo recibido.
    for (let i = 0; i < total; i++) {
      if (items[i].estado === 'ok') { okCount++; continue }
      setActual(i + 1)
      marcar(i, { estado: 'subiendo', error: '' })
      const base = i / total
      setProgress(base + 0.1 / total)
      const iv = setInterval(() => setProgress((p) => Math.min(base + 0.9 / total, p + 0.12 / total)), 150)
      try {
        ultimo = await subirArchivo({ tipo, file: items[i].file })
        okCount++
        marcar(i, { estado: 'ok' })
      } catch (e) {
        marcar(i, { estado: 'error', error: e?.message || 'Error al subir' })
      } finally {
        clearInterval(iv)
        setProgress((i + 1) / total)
      }
    }
    setLoading(false)
    const fallidos = total - okCount
    if (okCount > 0) onSuccess?.(ultimo)
    if (fallidos === 0) {
      onToast?.({ message: total > 1 ? `${total} archivos de ${def.label} cargados` : `Archivo de ${def.label.toLowerCase()} cargado` })
      setTimeout(() => { reset(); onClose() }, 350)
    } else {
      onToast?.({ message: `${fallidos} de ${total} archivos no se pudieron subir`, variant: 'error' })
    }
  }

  const pendientes = items.filter((it) => it.estado !== 'ok').length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <style>{ESTILOS}</style>
      <div className="sam-backdrop absolute inset-0 bg-ink-900/60 backdrop-blur-sm" onClick={cerrar} />
      <div role="dialog" aria-modal="true" aria-labelledby="sam-title" className="sam-dialog relative w-full max-w-[600px] max-h-[90vh] overflow-y-auto bg-white rounded-2xl border border-neutral-200 shadow-xl mx-4">
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <h2 id="sam-title" className="text-lg font-semibold text-ink-900">Subir archivo</h2>
          <button onClick={cerrar} disabled={loading} aria-label="Cerrar" className="h-8 w-8 grid place-items-center rounded-lg hover:bg-neutral-100 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400"><X className="size-4" /></button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <p className="text-sm font-medium text-ink-900 mb-2">Tipo de archivo</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" role="radiogroup" aria-label="Tipo de archivo">
              {TIPOS_ARCHIVO.map((t) => {
                const Icon = ICONS[t.icon] || FileSpreadsheet
                const active = tipo === t.clave
                return (
                  <button
                    key={t.clave}
                    role="radio"
                    aria-checked={active}
                    disabled={loading}
                    onClick={() => elegirTipo(t.clave)}
                    className={'sam-tipo text-left rounded-xl border p-3 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400 ' + (active ? 'border-primary-500 bg-primary-50' : 'border-neutral-200 hover:bg-neutral-50')}
                  >
                    <Icon className={'size-5 ' + (active ? 'text-primary-600' : 'text-ink-700')} aria-hidden="true" />
                    <p className="mt-1 text-sm font-medium text-ink-900 leading-tight">{t.label}</p>
                    <p className="text-xs text-ink-500">{t.desc}</p>
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-ink-900 mb-2">{multiple ? 'Archivos' : 'Archivo'}</p>
            <div
              onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
              onDragLeave={() => setDrag(false)}
              onDrop={onDrop}
              className={'sam-drop rounded-xl border-2 border-dashed p-6 text-center ' + (drag ? 'border-primary-500 bg-primary-50' : 'border-neutral-300')}
            >
              <UploadCloud className="mx-auto size-6 text-ink-500" aria-hidden="true" />
              <p className="mt-1 text-sm text-ink-700">
                Arrastra {multiple ? 'tus archivos' : 'tu archivo'} aquí o{' '}
                <button onClick={() => inputRef.current?.click()} disabled={loading} className="text-primary-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400 rounded">busca en tu equipo</button>
              </p>
              <p className="text-xs text-ink-500">.xlsx, .xls · máx {MAX_MB} MB{multiple ? ' · nombre DD-MM-AAAA_….xlsx' : ''}</p>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls"
                multiple={multiple}
                className="hidden"
                onChange={(e) => { pick(e.target.files); e.target.value = '' }}
              />
            </div>
            {err && <p role="alert" className="sam-row mt-1 text-xs text-primary-600">{err}</p>}
            {items.length > 0 && (
              <ul className="mt-2 space-y-1.5">
                {items.map((it, i) => (
                  <li key={it.file.name} className="sam-row flex items-center justify-between gap-2 rounded-lg border border-neutral-200 p-2" style={{ animationDelay: `${Math.min(i, 6) * 30}ms` }}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="grid place-items-center size-4 shrink-0">
                        {it.estado === 'subiendo' && <Loader2 className="size-4 text-tertiary-600 animate-spin" aria-hidden="true" />}
                        {it.estado === 'ok' && <CheckCircle2 className="sam-pop size-4 text-tertiary-600" aria-hidden="true" />}
                        {it.estado === 'error' && <XCircle className="sam-pop size-4 text-primary-600" aria-hidden="true" />}
                        {it.estado === 'pendiente' && <FileSpreadsheet className="size-4 text-ink-600" aria-hidden="true" />}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm text-ink-900 truncate max-w-[380px]" title={it.file.name}>{it.file.name}</p>
                        <p className={'text-xs truncate ' + (it.estado === 'error' ? 'text-primary-600' : 'text-ink-500')} title={it.error || undefined}>
                          {it.estado === 'error' ? it.error : it.estado === 'ok' ? 'Subido' : it.estado === 'subiendo' ? 'Subiendo…' : `${Math.round(it.file.size / 1024)} KB`}
                        </p>
                      </div>
                    </div>
                    {!loading && it.estado !== 'ok' && (
                      <button onClick={() => quitar(it.file.name)} className="text-sm text-ink-600 hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400 rounded">Quitar</button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {(loading || progress > 0) && (
            <div className="sam-row" aria-live="polite">
              {items.length > 1 && <p className="mb-1 text-xs text-ink-500">{loading ? `Subiendo ${actual} de ${items.length}` : 'Carga terminada'}</p>}
              <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
                <div className="sam-bar h-full w-full bg-tertiary-500" style={{ transform: `scaleX(${progress})` }} />
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 p-4 border-t border-neutral-200">
          <button onClick={cerrar} disabled={loading} className="h-9 px-3 rounded-lg border border-neutral-200 text-sm hover:bg-neutral-50 active:scale-[0.97] transition-[background-color,transform] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400">Cancelar</button>
          <button
            disabled={!tipo || !pendientes || loading}
            onClick={submit}
            aria-busy={loading}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-primary-500 text-white text-sm disabled:opacity-50 hover:bg-primary-600 active:scale-[0.97] transition-[background-color,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400"
          >
            {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {loading ? 'Subiendo…' : multiple && pendientes > 1 ? `Subir ${pendientes} archivos` : 'Subir'}
          </button>
        </div>
      </div>
    </div>
  )
}
