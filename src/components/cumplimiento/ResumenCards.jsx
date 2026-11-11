import { useEffect, useState } from 'react'
import Card from '../ui/Card.jsx'
import Skeleton from '../ui/Skeleton.jsx'
import MotorVacio from '../ui/MotorVacio.jsx'
import useCountUp from '../../hooks/useCountUp.js'
import { getResumen } from '../../services/cumplimientoService.js'

export default function ResumenCards({ rango, maquina = 'todas', refreshKey = 0 }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    let ignore = false
    setLoading(true)
    getResumen(rango, maquina).then(res => {
      if (!ignore) {
        setData(res)
        setLoading(false)
      }
    })
    return () => { ignore = true }
  }, [rango, maquina, refreshKey])
  
  const c1 = useCountUp(data?.cumplimiento || 0)
  const c2a = useCountUp(data?.ejecutadas || 0)
  const c2b = useCountUp(data?.programadas || 0)
  const c3 = useCountUp(data?.pospuestas || 0)
  const c4 = useCountUp(data?.vencidas || 0)
  
  if (loading || !data) {
    return (
      <div className="grid gap-3 sm:gap-4 grid-cols-2 xl:grid-cols-4">
        {[0,1,2,3].map(i => <Skeleton key={i} className="h-[104px]" />)}
      </div>
    )
  }
  
  if (data.available === false) {
    return <MotorVacio message={data.message || 'Aún no hay paradas registradas en el servidor.'} />
  }

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-2 xl:grid-cols-4">
      <Card className="p-5 flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-ink-500">Cumplimiento del plan</p>
        <p className="text-3xl font-bold tracking-tight text-primary-500 tabular-nums">{c1}%</p>
        <p className="text-xs text-ink-500">Tareas ejecutadas sobre tareas programadas</p>
      </Card>
      <Card className="p-5 flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-ink-500">Ejecutadas</p>
        <p className="text-3xl font-bold tracking-tight text-ink-900 tabular-nums">{c2a} <span className="text-lg text-ink-500">de {c2b}</span></p>
        <p className="text-xs text-ink-500">En la parada asignada o antes</p>
      </Card>
      <Card className="p-5 flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-ink-500">Pospuestas</p>
        <p className="text-3xl font-bold tracking-tight text-primary-700 tabular-nums">{c3}</p>
        <p className="text-xs text-ink-500">Reprogramadas a otra parada</p>
      </Card>
      <Card className="p-5 flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-ink-500">Vencidas</p>
        <p className="text-3xl font-bold tracking-tight text-primary-600 tabular-nums">{c4}</p>
        <p className="text-xs text-ink-500">Pasó la parada y no se registró ejecución</p>
      </Card>
    </div>
  )
}
