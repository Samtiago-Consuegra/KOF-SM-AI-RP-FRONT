import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { UploadCloud, FileSpreadsheet, X, CheckCircle2, XCircle } from 'lucide-react'
import { ARCHIVOS, subirArchivo } from '../../services/mantenimientoService.js'
import { isTopLayer, pushLayer } from '../../utils/modalLayer.js'

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
const SALIDA_MS = 180
const sinMovimiento = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const MAX_MB = 50
const EXT_OK = ['xlsx', 'xls']

function validar(f) {
  const ext = f.name.split('.').pop().toLowerCase()
  if (!EXT_OK.includes(ext)) return `${f.name}: solo se aceptan .xlsx o .xls`
  if (f.size > MAX_MB * 1024 * 1024) return `${f.name}: supera los ${MAX_MB} MB`
  return null
}

const kb = (n) => (n >= 1024 * 1024 ? (n / 1024 / 1024).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB')

export default function SubirArchivoModal({ open, onClose, onSuccess, onToast }) {
  const [clave, setClave] = useState('')
  const [files, setFiles] = useState([])
  const [drag, setDrag] = useState(false)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [avance, setAvance] = useState({ i: 0, n: 0 })
  const [resumen, setResumen] = useState(null)
  const inputRef = useRef(null)
  const panelRef = useRef(null)
  const closeRef = useRef(null)
  const onCloseRef = useRef(onClose)
  const loadingRef = useRef(false)
  const layerRef = useRef(`subir-${Math.random().toString(36).slice(2)}`)
  // Sigue montado durante la animación de salida; al terminar se desmonta y se limpia.
  const [montado, setMontado] = useState(open)
  const [saliendo, setSaliendo] = useState(false)

  useEffect(() => { onCloseRef.current = onClose }, [onClose])
  useEffect(() => { loadingRef.current = loading }, [loading])

  useEffect(() => {
    if (open) { setMontado(true); setSaliendo(false); return }
    if (!montado) return
    setSaliendo(true)
    const t = setTimeout(() => {
      setMontado(false); setSaliendo(false)
      setClave(''); setFiles([]); setErr(''); setDrag(false); setAvance({ i: 0, n: 0 }); setResumen(null)
    }, sinMovimiento() ? 0 : SALIDA_MS)
    return () => clearTimeout(t)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // Igual que Modal.jsx: capa, Escape, focus trap, scroll bloqueado y foco devuelto.
  useEffect(() => {
    if (!open) return
    const id = layerRef.current
    const previous = document.activeElement
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const popLayer = pushLayer(id)
    closeRef.current?.focus()

    const onKey = (e) => {
      if (!isTopLayer(id)) return
      if (e.key === 'Escape') {
        if (!loadingRef.current) onCloseRef.current?.()
        return
      }
      if (e.key !== 'Tab') return
      const items = [...(panelRef.current?.querySelectorAll(FOCUSABLE) ?? [])]
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      popLayer()
      document.body.style.overflow = overflow
      previous?.focus?.()
    }
  }, [open])

  if (!montado) return null

  const multiple = clave === 'acr'
  const tipoSel = ARCHIVOS.find((a) => a.clave === clave)

  const cerrar = () => { if (!loading) onClose() }

  const elegirTipo = (c) => {
    setClave(c); setErr(''); setResumen(null)
    // Al pasar a un tipo de un solo archivo se conserva solo el primero.
    if (c !== 'acr') setFiles((fs) => fs.slice(0, 1))
  }

  const pick = (lista) => {
    setErr(''); setResumen(null)
    const arr = Array.from(lista || [])
    if (!arr.length) return
    const elegidos = multiple ? arr : arr.slice(0, 1)
    const errores = elegidos.map(validar).filter(Boolean)
    const validos = elegidos.filter((f) => !validar(f))
    if (errores.length) setErr(errores.join(' · '))
    setFiles((prev) => {
      if (!multiple) return validos
      const vistos = new Set(prev.map((f) => f.name))
      return [...prev, ...validos.filter((f) => !vistos.has(f.name))]
    })
  }

  const onDrop = (e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files) }

  const submit = async () => {
    if (!clave || !files.length || loading) return
    setLoading(true); setErr(''); setResumen(null)
    const fallidos = []
    let ok = 0
    for (let i = 0; i < files.length; i++) {
      setAvance({ i: i + 1, n: files.length })
      try {
        await subirArchivo({ tipo: clave, file: files[i] })
        ok++
      } catch (e) {
        fallidos.push({ nombre: files[i].name, motivo: e?.message || 'Error al subir' })
      }
    }
    setLoading(false)
    if (ok) onSuccess?.()

    if (files.length === 1 && ok === 1) {
      onToast?.('Archivo de ' + tipoSel.tipo.toLowerCase() + ' cargado')
      onClose()
      return
    }
    if (files.length === 1) {
      setErr(fallidos[0]?.motivo || 'Error al subir archivo')
      return
    }
    setResumen({ ok, total: files.length, fallidos })
    setFiles([])
    onToast?.(`Se cargaron ${ok} de ${files.length} archivos`)
  }

  const pct = avance.n ? Math.round((avance.i / avance.n) * 100) : 0

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6" data-saliendo={saliendo || undefined}>
      <style>{`
        @keyframes sam-in { from { opacity: 0; transform: scale(.96); } to { opacity: 1; transform: none; } }
        @keyframes sam-out { from { opacity: 1; transform: none; } to { opacity: 0; transform: scale(.97); } }
        @keyframes sam-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes sam-fade-out { from { opacity: 1; } to { opacity: 0; } }
        @keyframes sam-up { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .sam-panel { animation: sam-in 220ms cubic-bezier(0.22,1,0.36,1) both; }
        .sam-backdrop { animation: sam-fade 200ms ease-out both; }
        [data-saliendo] .sam-panel { animation: sam-out ${SALIDA_MS}ms ease-in both; }
        [data-saliendo] .sam-backdrop { animation: sam-fade-out ${SALIDA_MS}ms ease-in both; }
        .sam-up { animation: sam-up 220ms ease-out both; }
        @media (prefers-reduced-motion: reduce) {
          .sam-panel, .sam-backdrop, .sam-up, [data-saliendo] .sam-panel, [data-saliendo] .sam-backdrop { animation: none !important; }
          .sam-bar { transition: none !important; }
        }
      `}</style>
      <div className="sam-backdrop absolute inset-0 bg-ink-900/60" onClick={cerrar} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sam-title"
        className="sam-panel relative flex w-full max-w-[640px] max-h-[calc(100dvh-2rem)] flex-col overflow-y-auto scroll-thin rounded-2xl border border-neutral-200 bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-neutral-100">
          <h2 id="sam-title" className="text-lg font-bold text-ink-900">Subir archivo</h2>
          <button
            ref={closeRef}
            type="button"
            onClick={cerrar}
            disabled={loading}
            aria-label="Cerrar"
            title="Cerrar (Esc)"
            className="size-9 grid place-items-center rounded-lg border border-neutral-200 text-ink-500 transition-colors hover:bg-neutral-50 hover:text-ink-900 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <p className="text-sm font-medium text-ink-900 mb-2">Tipo de archivo</p>
            <div role="radiogroup" aria-label="Tipo de archivo" className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ARCHIVOS.map((t, idx) => {
                const Icon = t.Icon
                const active = clave === t.clave
                return (
                  <button
                    key={t.clave}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    disabled={loading}
                    onClick={() => elegirTipo(t.clave)}
                    style={{ animationDelay: `${idx * 30}ms` }}
                    className={'sam-up text-left rounded-xl border p-3 transition-[background-color,border-color,transform] duration-200 active:scale-[.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400 disabled:opacity-60 ' + (active ? 'border-primary-500 bg-primary-50' : 'border-neutral-200 hover:bg-neutral-50')}
                  >
                    <Icon className={'size-5 transition-colors ' + (active ? 'text-primary-600' : 'text-ink-700')} />
                    <p className="mt-1 text-sm font-medium text-ink-900">{t.tipo}</p>
                    <p className="text-xs text-ink-500">{t.desc}</p>
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-ink-900 mb-2">{multiple ? 'Archivos' : 'Archivo'}</p>
            <div onDragOver={(e) => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)} onDrop={onDrop} className={'rounded-xl border-2 border-dashed p-6 text-center transition-colors duration-200 ' + (drag ? 'border-primary-500 bg-primary-50' : 'border-neutral-300')}>
              <UploadCloud className="mx-auto size-6 text-ink-500" />
              <p className="mt-1 text-sm text-ink-700">
                {multiple ? 'Arrastra uno o varios ACR aquí o ' : 'Arrastra tu archivo aquí o '}
                <button type="button" disabled={loading} onClick={() => inputRef.current?.click()} className="text-primary-600 hover:underline">busca en tu equipo</button>
              </p>
              <p className="text-xs text-ink-500">.xlsx, .xls · máx {MAX_MB} MB por archivo</p>
              <input
                key={multiple ? 'm' : 's'}
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls"
                multiple={multiple}
                className="hidden"
                onChange={(e) => { pick(e.target.files); e.target.value = '' }}
              />
            </div>
            {err && <p role="alert" className="sam-up mt-1 text-xs text-primary-600">{err}</p>}
            {files.length > 0 && (
              <ul className="mt-2 space-y-1.5 max-h-48 overflow-y-auto">
                {files.map((f, idx) => (
                  <li key={f.name} style={{ animationDelay: `${idx * 25}ms` }} className="sam-up flex items-center justify-between gap-2 rounded-lg border border-neutral-200 p-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileSpreadsheet className="size-4 text-ink-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm text-ink-900 truncate">{f.name}</p>
                        <p className="text-xs text-ink-500">{kb(f.size)}</p>
                      </div>
                    </div>
                    <button type="button" disabled={loading} onClick={() => setFiles((fs) => fs.filter((x) => x !== f))} className="text-sm text-ink-600 hover:text-primary-600 shrink-0">Quitar</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {loading && (
            <div className="sam-up space-y-1" role="status" aria-live="polite">
              <p className="text-xs text-ink-600">Subiendo {avance.i} de {avance.n}…</p>
              <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
                <div className="sam-bar h-full bg-tertiary-500 rounded-full transition-[width] duration-300 ease-out" style={{ width: pct + '%' }} />
              </div>
            </div>
          )}
          {resumen && (
            <div className="sam-up rounded-xl border border-neutral-200 bg-neutral-50 p-3 space-y-1.5" role="status" aria-live="polite">
              <p className="flex items-center gap-1.5 text-sm font-medium text-ink-900">
                <CheckCircle2 className="size-4 text-tertiary-600" />
                Se cargaron {resumen.ok} de {resumen.total} archivos
              </p>
              {resumen.fallidos.length > 0 && (
                <ul className="space-y-1">
                  {resumen.fallidos.map((f) => (
                    <li key={f.nombre} className="flex items-start gap-1.5 text-xs text-primary-600">
                      <XCircle className="size-3.5 shrink-0 mt-px" />
                      <span className="min-w-0 break-words"><span className="font-medium">{f.nombre}</span> · {f.motivo}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-neutral-100">
          <button type="button" onClick={cerrar} disabled={loading} className="h-9 px-3 rounded-lg border border-neutral-200 text-sm hover:bg-neutral-50 disabled:opacity-50">{resumen ? 'Cerrar' : 'Cancelar'}</button>
          <button type="button" disabled={!clave || !files.length || loading} onClick={submit} className="h-9 px-3 rounded-lg bg-primary-500 text-white text-sm transition-colors disabled:opacity-50 hover:bg-primary-600">
            {loading ? 'Subiendo…' : files.length > 1 ? `Subir ${files.length} archivos` : 'Subir'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
