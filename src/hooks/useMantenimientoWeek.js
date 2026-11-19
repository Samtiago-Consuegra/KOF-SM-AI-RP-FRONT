import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getWeekList } from '../utils/weeks.js'

export function useMantenimientoWeek() {
  // Incluye la semana siguiente: el Dashboard puede enlazar a una parada programada allí.
  const weeks = useMemo(() => getWeekList(52, 1), [])
  const actual = Math.max(0, weeks.findIndex((w) => w.isCurrent))
  const [searchParams] = useSearchParams()
  // ?semana=AAAA-MM-DD solo se lee al montar; si no está en la lista se abre la actual.
  const [idx, setIdx] = useState(() => {
    const i = weeks.findIndex((w) => w.start === searchParams.get('semana'))
    return i >= 0 ? i : actual
  })
  const week = weeks[idx]
  const goPrev = () => setIdx((i) => Math.min(i + 1, weeks.length - 1))
  const goNext = () => setIdx((i) => Math.max(i - 1, 0))
  const goToday = () => setIdx(actual)
  /** Lleva el calendario a la semana que contiene la fecha ISO (si está en la lista). */
  const goToDate = (iso) => { const i = weeks.findIndex((w) => w.start <= iso && iso <= w.end); if (i >= 0) setIdx(i) }
  const [tick, setTick] = useState(0)
  useEffect(() => { setTick((t) => t + 1) }, [idx])
  // `week` es la semana del calendario; `weekActual` (la de hoy) la usa el resto de la página.
  return { week, weekActual: weeks[actual], weeks, idx, goPrev, goNext, goToday, goToDate, tick }
}

export function weekLegend(week) {
  if (!week) return ''
  const start = new Date(week.start + 'T00:00:00')
  const end = new Date(week.end + 'T00:00:00')
  const mesStart = start.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
  const mesEnd = end.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)
  const mesTxt = mesStart === mesEnd ? cap(mesStart) : cap(mesStart) + '–' + cap(mesEnd)
  const sM = start.toLocaleDateString('es-CO', { month: 'short' }).replace('.', '')
  const eM = end.toLocaleDateString('es-CO', { month: 'short' }).replace('.', '')
  return 'Semana ' + week.weekNum + ' · ' + week.start.slice(8, 10) + ' ' + sM + '–' + week.end.slice(8, 10) + ' ' + eM + ' · ' + mesTxt + ' · Las 4 máquinas críticas'
}
