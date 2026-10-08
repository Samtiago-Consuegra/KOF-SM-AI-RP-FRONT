export const fmtNumber = (n, d = 0) =>
  Number(n).toLocaleString('es-CO', { minimumFractionDigits: d, maximumFractionDigits: d })

export const fmtDateLong = (date) =>
  date.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

export const fmtDateShort = (date) =>
  date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })

export const fmtDateIntl = (date) =>
  date.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })

export const toISODate = (date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export const fromISODate = (iso) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const addDays = (date, n) => {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

export const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

export function downloadCSV(filename, rows) {
  const csv = rows
    .map((r) => r.map((c) => `"${String(c ?? '').replaceAll('"', '""')}"`).join(','))
    .join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
