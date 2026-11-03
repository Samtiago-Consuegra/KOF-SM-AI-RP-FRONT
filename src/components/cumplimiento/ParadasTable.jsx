import { useEffect, useState } from 'react'
import { ClipboardCheck } from 'lucide-react'
import Card from '../ui/Card.jsx'
import Dropdown from '../ui/Dropdown.jsx'
import EstadoBadge from './EstadoBadge.jsx'
import { getParadas } from '../../services/cumplimientoService.js'

const ESTADO_OPTIONS = [
  { value: 'todos', label: 'Todos los estados' },
  { value: 'Pendiente', label: 'Pendiente' },
  { value: 'Vencida', label: 'Vencida' },
  { value: 'En ejecución', label: 'En ejecución' }
]

function formatDateTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('es-CO', { weekday: 'short', day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
}

export default function ParadasTable({ selectedId, onSelect, onRegister }) {
  const [estado, setEstado] = useState('todos')
  const [paradas, setParadas] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    let ignore = false
    setLoading(true)
    getParadas({ estado }).then(res => {
      if (!ignore) {
        setParadas(res)
        setLoading(false)
      }
    })
    return () => { ignore = true }
  }, [estado])
  
  const calcularDuracion = (p) => {
    if (!p.finReal) return '—'
    const inicio = new Date(p.inicio)
    const fin = new Date(p.finReal)
    const diff = Math.round((fin - inicio) / 60000)
    return diff > 0 ? `${diff} min` : '—'
  }
  
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-5 py-4">
        <h2 className="text-lg font-bold text-ink-900">Seguimiento de paradas</h2>
        <div className="flex items-center gap-2">
          <Dropdown
            label=""
            value={estado}
            onChange={setEstado}
            options={ESTADO_OPTIONS}
            className="w-48"
          />
          <button
            type="button"
            onClick={onRegister}
            className="inline-flex items-center gap-2 rounded-xl bg-ink-900 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500"
          >
            <ClipboardCheck className="size-4" />
            Registrar seguimiento
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
            <tr>
              <th className="px-5 py-3">Máquina / Componente</th>
              <th className="px-5 py-3">Tarea</th>
              <th className="px-5 py-3">Parada</th>
              <th className="px-5 py-3">Orden SAP</th>
              <th className="px-5 py-3">Estado</th>
              <th className="px-5 py-3">Duración real</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {paradas.map(p => {
              const tareas = p.tareas || []
              const primera = tareas[0]
              const extra = tareas.length - 1
              const isSelected = selectedId === p.id
              return (
                <tr
                  key={p.id}
                  onClick={() => onSelect(p.id)}
                  className={`cursor-pointer transition-colors ${isSelected ? 'bg-primary-50 border-l-4 border-l-primary-500' : 'hover:bg-neutral-50'}`}
                >
                  <td className="px-5 py-4">
                    <p className="font-semibold text-ink-900">{p.maquina}</p>
                    <p className="text-xs text-ink-500">{p.componente}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-ink-700">{primera?.nombre || '—'}</p>
                    {extra > 0 && (
                      <span title={tareas.slice(1).map(t => t.nombre).join(', ')} className="text-xs text-primary-600">+{extra} tareas</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-xs text-ink-500">Inicio: <span className="text-ink-900">{formatDateTime(p.inicio)}</span></p>
                    <p className="text-xs text-ink-500">Fin: <span className="text-ink-900">{formatDateTime(p.finProg)}</span></p>
                  </td>
                  <td className="px-5 py-4 text-ink-700">{p.ordenSap}</td>
                  <td className="px-5 py-4"><EstadoBadge estado={p.estado} /></td>
                  <td className="px-5 py-4 text-ink-700">{calcularDuracion(p)}</td>
                </tr>
              )
            })}
            {!loading && paradas.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-sm text-ink-500">
                  No hay paradas en este estado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
