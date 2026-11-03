// Helper para cálculo de semanas (lunes a domingo) y meses en español
// Usa fecha real del sistema

function startOfWeekMonday(date) {
  const d = new Date(date)
  const day = d.getDay() // 0 domingo, 1 lunes...
  const diff = (day === 0 ? -6 : 1) - day
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + diff)
  return d
}

function endOfWeekSunday(date) {
  const start = startOfWeekMonday(date)
  const d = new Date(start)
  d.setDate(d.getDate() + 6)
  d.setHours(23, 59, 59, 999)
  return d
}

function formatDayMonth(d) {
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }).replace('.', '')
}

function formatDayMonthYear(d) {
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '')
}

function toISODate(d) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getWeekList(count = 12) {
  const now = new Date()
  const weeks = []
  for (let i = 0; i < count; i++) {
    const ref = new Date(now)
    ref.setDate(ref.getDate() - i * 7)
    const start = startOfWeekMonday(ref)
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    const weekNum = getISOWeekNumber(start)
    const isCurrent = i === 0
    const label = `Semana ${weekNum} · ${formatDayMonth(start)} – ${formatDayMonthYear(end)}${isCurrent ? ' (actual)' : ''}`
    weeks.push({
      key: `week-${weekNum}-${toISODate(start)}`,
      weekNum,
      start: toISODate(start),
      end: toISODate(end),
      label,
      isCurrent,
      rangeLabel: `Del ${formatDayMonthYear(start)} al ${formatDayMonthYear(end)}`
    })
  }
  return weeks
}

function getISOWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}

export function getMonthList(count = 12) {
  const now = new Date()
  const months = []
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const label = d.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
    const labelCap = label.charAt(0).toUpperCase() + label.slice(1)
    const start = new Date(d.getFullYear(), d.getMonth(), 1)
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0)
    months.push({
      key: `month-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: labelCap,
      start: toISODate(start),
      end: toISODate(end),
      rangeLabel: `Del ${formatDayMonthYear(start)} al ${formatDayMonthYear(end)}`
    })
  }
  return months
}

export function getRangeForWeek(week) {
  return { type: 'week', from: week.start, to: week.end, label: week.rangeLabel }
}

export function getRangeForMonth(month) {
  return { type: 'month', from: month.start, to: month.end, label: month.rangeLabel }
}
