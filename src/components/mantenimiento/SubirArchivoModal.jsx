import { useRef, useState } from 'react'
import { UploadCloud, FileSpreadsheet, X, AlertTriangle } from 'lucide-react'
import { subirArchivo } from '../../services/mantenimientoService.js'

const TIPOS = [
  { id: 'Avisos de daño', icon: AlertTriangle, desc: 'Archivos con avisos de daño' },
  { id: 'Órdenes de trabajo', icon: FileSpreadsheet, desc: 'Órdenes de trabajo SAP' },
  { id: 'Plan preventivo', icon: FileSpreadsheet, desc: 'Plan preventivo' },
]

export default function SubirArchivoModal({ open, onClose, onSuccess, onToast }) {
  const [tipo, setTipo] = useState('')
  const [file, setFile] = useState(null)
  const [drag, setDrag] = useState(false)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const inputRef = useRef(null)

  if (!open) return null

  const pick = (f) => {
    setErr('')
    if (!f) return
    const ext = f.name.split('.').pop().toLowerCase()
    if (!['xlsx','xls','csv'].includes(ext) || f.size > 20*1024*1024) {
      setErr('Solo se aceptan archivos .xlsx, .xls o .csv de hasta 20 MB')
      setFile(null)
      return
    }
    setFile(f)
  }

  const onDrop = (e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files?.[0]) }

  const submit = async () => {
    if (!tipo || !file) return
    setLoading(true)
    setProgress(10)
    const iv = setInterval(() => setProgress((p) => Math.min(95, p + 15)), 120)
    try {
      await subirArchivo({ tipo, file })
      clearInterval(iv); setProgress(100)
      setTimeout(() => {
        setLoading(false); setProgress(0); setFile(null); setTipo('')
        onClose(); onSuccess?.()
        onToast?.('Archivo de ' + tipo.toLowerCase() + ' cargado')
      }, 200)
    } catch {
      clearInterval(iv); setLoading(false); setProgress(0); onToast?.('Error al subir archivo')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-ink-900/60 backdrop-blur-sm" onClick={onClose} />
      <div role="dialog" aria-modal="true" className="relative w-full max-w-[560px] bg-white rounded-2xl border border-neutral-200 shadow-xl mx-4">
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-ink-900">Subir archivo</h2>
          <button onClick={onClose} aria-label="Cerrar" className="h-8 w-8 grid place-items-center rounded-lg hover:bg-neutral-100"><X className="size-4" /></button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <p className="text-sm font-medium text-ink-900 mb-2">Tipo de archivo</p>
            <div className="grid sm:grid-cols-3 gap-2">
              {TIPOS.map((t) => {
                const Icon = t.icon
                const active = tipo === t.id
                return (
                  <button key={t.id} onClick={() => setTipo(t.id)} className={"text-left rounded-xl border p-3 " + (active ? 'border-primary-500 bg-primary-50' : 'border-neutral-200 hover:bg-neutral-50')}>
                    <Icon className="size-5 text-ink-700" />
                    <p className="mt-1 text-sm font-medium text-ink-900">{t.id}</p>
                    <p className="text-xs text-ink-500">{t.desc}</p>
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-ink-900 mb-2">Archivo</p>
            <div onDragOver={(e)=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)} onDrop={onDrop} className={"rounded-xl border-2 border-dashed p-6 text-center " + (drag ? 'border-primary-500 bg-primary-50' : 'border-neutral-300')}>
              <UploadCloud className="mx-auto size-6 text-ink-500" />
              <p className="mt-1 text-sm text-ink-700">Arrastra tu archivo aquí o <button onClick={()=>inputRef.current?.click()} className="text-primary-600 hover:underline">busca en tu equipo</button></p>
              <p className="text-xs text-ink-500">.xlsx, .xls, .csv · máx 20 MB</p>
              <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e)=>pick(e.target.files?.[0])} />
            </div>
            {err && <p className="mt-1 text-xs text-primary-600">{err}</p>}
            {file && !err && (
              <div className="mt-2 flex items-center justify-between rounded-lg border border-neutral-200 p-2">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="size-4 text-ink-600" />
                  <div>
                    <p className="text-sm text-ink-900 truncate max-w-[360px]">{file.name}</p>
                    <p className="text-xs text-ink-500">{Math.round(file.size/1024)} KB</p>
                  </div>
                </div>
                <button onClick={()=>setFile(null)} className="text-sm text-ink-600 hover:text-primary-600">Quitar</button>
              </div>
            )}
          </div>
          {loading && <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden"><div className="h-full bg-tertiary-500" style={{width: progress+'%'}} /></div>}
        </div>
        <div className="flex items-center justify-end gap-2 p-4 border-t border-neutral-200">
          <button onClick={onClose} className="h-9 px-3 rounded-lg border border-neutral-200 text-sm hover:bg-neutral-50">Cancelar</button>
          <button disabled={!tipo || !file || loading} onClick={submit} className="h-9 px-3 rounded-lg bg-primary-500 text-white text-sm disabled:opacity-50 hover:bg-primary-600">Subir</button>
        </div>
      </div>
    </div>
  )
}
