const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

const partes = (iso) => {
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number)
  return { y, m: MESES[m - 1], d }
}

/**
 * Leyenda corta del periodo de una semana:
 * "Semana 46 · 9 – 15 nov 2026", "Semana 44 · 27 oct – 2 nov 2026",
 * "Semana 1 · 29 dic 2025 – 4 ene 2026".
 */
export function semanaPeriodo(week) {
  if (!week?.start || !week?.end) return ''
  const a = partes(week.start)
  const b = partes(week.end)
  const desde = a.y !== b.y ? `${a.d} ${a.m} ${a.y}` : a.m !== b.m ? `${a.d} ${a.m}` : `${a.d}`
  return `Semana ${week.weekNum} · ${desde} – ${b.d} ${b.m} ${b.y}`
}
