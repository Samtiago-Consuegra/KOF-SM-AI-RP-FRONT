import { useRef, useState } from 'react'
import { FileUp, Loader2 } from 'lucide-react'
import { apiUpload } from '../../api/client.js'
import { fetchRunStatus } from '../../api/predictions.js'
import { invalidateMachines } from '../../api/machines.js'
import { useToast } from '../../context/ToastContext.jsx'

const ACCEPT = /\.(xlsx|xls|csv)$/i
const POLL_MS = 4000
const MAX_POLLS = 150 // ~10 min: el entrenamiento puede tardar si hay que reentrenar

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * Sube el reporte SAP al backend. Cuando el archivo trae registros nuevos, el backend
 * relanza el motor en segundo plano, así que aquí se sigue el estado de esa ejecución
 * y se avisa al terminar para que quien lo pidió refresque los datos.
 */
export default function UploadExcelButton({ onUploaded, onFinished }) {
  const input = useRef(null)
  const toast = useToast()
  const [busy, setBusy] = useState(false)

  const handle = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!ACCEPT.test(file.name)) {
      toast('El archivo debe ser .xlsx, .xls o .csv. Elige otro archivo.', 'error')
      return
    }

    setBusy(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const receipt = await apiUpload('/upload', form)

      invalidateMachines()
      const { records_inserted: ins, records_duplicated: dup, records_discarded: dis } = receipt
      toast(`${file.name}: ${ins} nuevos · ${dup} duplicados · ${dis} descartados`)
      onUploaded?.({ ...receipt, name: file.name })

      if (receipt.prediction_run_id) {
        toast('Datos cargados. Recalculando predicciones…')
        const status = await followRun(receipt.prediction_run_id)
        if (status === 'timeout') toast('El recálculo sigue en curso; se actualizará al terminar.')
        else if (status === 'error') toast('Falló el recálculo de predicciones.', 'error')
        else toast('Predicciones actualizadas')
        onFinished?.()
      } else {
        onFinished?.()
      }
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  async function followRun(runId) {
    for (let i = 0; i < MAX_POLLS; i++) {
      await sleep(POLL_MS)
      try {
        const run = await fetchRunStatus(runId)
        if (run.status === 'ok') return 'ok'
        if (run.status === 'error') return 'error'
      } catch {
        // el backend puede reiniciarse a mitad del entrenamiento: se sigue intentando
      }
    }
    return 'timeout'
  }

  return (
    <>
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-xl bg-primary-500 hover:bg-primary-600 active:bg-primary-700 disabled:opacity-60 text-white px-4 py-2.5 text-sm font-semibold shadow-sm shadow-primary-500/30 transition-colors"
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <FileUp className="size-4" />}
        {busy ? 'Procesando…' : 'Subir Excel'}
      </button>
      <input ref={input} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handle} />
    </>
  )
}