import { useState, useEffect } from 'react'
import { getEventos } from '../../services/historiaClinicaService'

const TIPOS = ['Todo', 'Fallas', 'Avisos', 'Órdenes', 'Preventivos']

export default function LineaTiempo({ maquina, loading }) {
  const [tipo, setTipo] = useState('Todo')
  const [eventos, setEventos] = useState([])
  const [pagina, setPagina] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [cargando, setCargando] = useState(false)
  
  useEffect(() => {
    async function load() {
      setCargando(true)
      const res = await getEventos({ maquina, tipo, pagina: 1 })
      setEventos(res.items)
      setHasMore(res.hasMore)
      setPagina(1)
      setCargando(false)
    }
    load()
  }, [maquina, tipo])
  
  const cargarMas = async () => {
    setCargando(true)
    const res = await getEventos({ maquina, tipo, pagina: pagina + 1 })
    setEventos([...eventos, ...res.items])
    setHasMore(res.hasMore)
    setPagina(pagina + 1)
    setCargando(false)
  }
  
  const getBadge = (evento) => {
    if (evento.tipo === 'PREVENTIVO') return { text: `PREVENTIVO · ${evento.orden || ''}`, class: 'bg-tertiary-50 text-tertiary-700' }
    if (evento.tipo === 'FALLA') return { text: 'FALLA', class: 'bg-primary-50 text-primary-600' }
    if (evento.tipo === 'CORRECTIVO') return { text: `CORRECTIVO · ${evento.orden || ''}`, class: 'bg-primary-100 text-primary-800' }
    if (evento.tipo === 'AVISO') return { text: 'AVISO', class: 'bg-ink-100 text-ink-700' }
    return { text: evento.tipo, class: 'bg-neutral-100 text-ink-500' }
  }
  
  if (loading) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="h-6 w-32 animate-pulse rounded bg-neutral-100" />
        <div className="mt-4 space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-16 w-full animate-pulse rounded bg-neutral-100" />)}
        </div>
      </div>
    )
  }
  
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-neutral-200 p-6 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold text-ink-900">Línea de tiempo</h3>
        <div className="flex flex-wrap gap-2">
          {TIPOS.map((t) => (
            <button
              key={t}
              onClick={() => setTipo(t)}
              className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                tipo === t ? 'bg-ink-900 text-white' : 'bg-white text-ink-700 border border-neutral-200 hover:bg-neutral-100'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="divide-y divide-neutral-200">
        {eventos.length === 0 ? (
          <div className="p-6 text-center text-sm text-ink-500">Esta máquina no tiene eventos de este tipo</div>
        ) : (
          eventos.map((evento) => {
            const badge = getBadge(evento)
            return (
              <div key={evento.id} className="flex gap-4 p-4 sm:p-6">
                <div className="w-24 shrink-0 text-sm text-ink-500">
                  {new Date(evento.fecha).toLocaleDateString('es-ES')}
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.class}`}>{badge.text}</span>
                    <span className="font-semibold text-ink-900">{evento.titulo}</span>
                  </div>
                  <p className="mt-1 text-sm text-ink-500">{evento.detalle}</p>
                </div>
              </div>
            )
          })
        )}
      </div>
      {hasMore && (
        <div className="border-t border-neutral-200 p-4 text-center">
          <button
            onClick={cargarMas}
            disabled={cargando}
            className="text-sm font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50"
          >
            {cargando ? 'Cargando...' : 'Ver más eventos'}
          </button>
        </div>
      )}
    </div>
  )
}
