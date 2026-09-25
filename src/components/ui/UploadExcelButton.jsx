import { useRef } from 'react'
import { FileUp } from 'lucide-react'
import { useToast } from '../../context/ToastContext.jsx'

// Solo frontend: valida el archivo y avisa. En la etapa de integración aquí va el POST al backend.
export default function UploadExcelButton({ onUploaded }) {
  const input = useRef(null)
  const toast = useToast()

  const handle = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      toast('El archivo debe ser .xlsx o .xls. Elige otro archivo.', 'error')
      return
    }
    toast(`Excel subido: ${file.name}`)
    onUploaded?.(file)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => input.current?.click()}
        className="inline-flex items-center gap-2 rounded-xl bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white px-4 py-2.5 text-sm font-semibold shadow-sm shadow-primary-500/30 transition-colors"
      >
        <FileUp className="size-4" />
        Subir Excel
      </button>
      <input ref={input} type="file" accept=".xlsx,.xls" className="hidden" onChange={handle} />
    </>
  )
}
