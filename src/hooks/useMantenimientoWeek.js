import { useEffect, useMemo, useState } from 'react'
import { getWeekList } from '../utils/weeks.js'

export function useMantenimientoWeek() {
  const weeks = useMemo(() => getWeekList(52), [])
  const [idx, setIdx] = useState(0)
  const week = weeks[idx]
  const goPrev = () => setIdx((i) => Math.min(i + 1, weeks.length - 1))
  const goNext = () => setIdx((i) => Math.max(i - 1, 0))
  const goToday = () => setIdx(0)
  const [tick, setTick] = useState(0)
  useEffect(() => { setTick((t) => t + 1) }, [idx])
  return { week, weeks, idx, goPrev, goNext, goToday, tick }
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
