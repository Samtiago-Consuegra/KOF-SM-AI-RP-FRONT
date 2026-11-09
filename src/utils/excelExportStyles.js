// Constantes de estilo para exportaciones Excel (exceljs). ARGB con prefijo FF.
// Usa EXCLUSIVAMENTE la paleta del proyecto (@theme): primary #F40000, ink #111827,
// tertiary #0D9488, blue (frío), orange (caliente), neutral #F8F9FA (y tonos 50-900).
// Definidos UNA sola vez aquí.
export const PALETTE = {
  primary50: 'FFFFF1F0',
  primary500: 'FFF40000',
  primary600: 'FFCC0000',
  primary700: 'FFA30000',
  ink100: 'FFDDE2F2',
  ink300: 'FFA6ADC4',
  ink500: 'FF6B7187',
  ink700: 'FF3F4556',
  ink900: 'FF111827',
  tertiary50: 'FFEFFEFB',
  tertiary500: 'FF13AB9C',
  tertiary600: 'FF0D9488',
  tertiary700: 'FF0A6B62',
  blue50: 'FFEFF6FF',
  blue500: 'FF3B82F6',
  blue600: 'FF2563EB',
  blue700: 'FF1D4ED8',
  orange50: 'FFFFF7ED',
  orange500: 'FFF97316',
  orange600: 'FFEA580C',
  orange700: 'FFC2410C',
  neutral50: 'FFF8F9FA',
  neutral100: 'FFEFF0F2',
  neutral200: 'FFE2E4E8',
  white: 'FFFFFFFF',
}

const FONT = 'Calibri'

export function setCell(ws, addr, value, style = {}) {
  const c = ws.getCell(addr)
  c.value = value
  if (style.font) c.font = { name: FONT, size: 11, ...style.font }
  if (style.fill) c.fill = style.fill
  if (style.alignment) c.alignment = style.alignment
  if (style.border) c.border = style.border
  if (style.numFmt) c.numFmt = style.numFmt
  return c
}

export function mergeTitle(ws, row, text, lastColLetter, { borderBottomColor = PALETTE.primary500 } = {}) {
  const c = ws.getCell(`A${row}`)
  c.value = text
  c.font = { name: FONT, bold: true, size: 14, color: { argb: PALETTE.ink900 } }
  c.alignment = { vertical: 'middle' }
  c.border = { bottom: { style: 'medium', color: { argb: borderBottomColor } } }
  ws.mergeCells(`A${row}:${lastColLetter}${row}`)
  ws.getRow(row).height = 26
  return c
}

export function writeMeta(ws, startRow, items, lastColLetter) {
  // items: [{ label, value }]
  items.forEach((it, i) => {
    const r = startRow + i
    setCell(ws, `A${r}`, it.label, { font: { bold: true } })
    setCell(ws, `B${r}`, it.value, {})
    if (lastColLetter && lastColLetter !== 'B') ws.mergeCells(`B${r}:${lastColLetter}${r}`)
  })
}

export function writeHeader(ws, row, headers) {
  const hr = ws.getRow(row)
  headers.forEach((h, i) => {
    const c = hr.getCell(i + 1)
    c.value = h
    c.font = { name: FONT, bold: true, color: { argb: PALETTE.white }, size: 11 }
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.ink900 } }
    c.alignment = { vertical: 'middle' }
  })
  hr.height = 22
}

export function styleDataBorders(ws, r1, r2, c1, c2, { dayBreakRows = [], dayBreakColor = PALETTE.ink300 } = {}) {
  const thin = { style: 'thin', color: { argb: PALETTE.neutral200 } }
  for (let r = r1; r <= r2; r++) {
    for (let c = c1; c <= c2; c++) {
      const cell = ws.getCell(r, c)
      const top = dayBreakRows.includes(r) ? { style: 'medium', color: { argb: dayBreakColor } } : thin
      cell.border = { top, left: thin, bottom: thin, right: thin }
      if (!cell.font?.name) cell.font = { name: FONT, size: 11, ...(cell.font || {}) }
      if (!cell.alignment) cell.alignment = { vertical: 'top' }
    }
  }
}

export function writeLegend(ws, row, title, entries) {
  // entries: [{ label, fill, fontColor }]
  setCell(ws, `A${row}`, title, { font: { bold: true } })
  let col = 2
  entries.forEach((e) => {
    const c = ws.getCell(row, col)
    c.value = e.label
    c.font = { name: FONT, bold: true, size: 11, color: { argb: e.fontColor } }
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: e.fill } }
    c.alignment = { vertical: 'middle', horizontal: 'center' }
    col += 2 // leave a gap column like Predicción
  })
}

export function setupSheet(ws, { freezeRow = 7, filterRange, colCount }) {
  if (freezeRow) ws.views = [{ state: 'frozen', ySplit: freezeRow }]
  if (filterRange) ws.autoFilter = filterRange
  ws.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
  // default font via columns isn't global; borders/helper sets font per cell
}

export function tipoParadaStyle(tipoRaw = '') {
  const t = String(tipoRaw)
  if (/predictiva|sugerida/i.test(t)) return { label: 'Predictiva', fill: PALETTE.ink100, fontColor: PALETTE.ink900 }
  if (/correctiva/i.test(t)) return { label: 'Correctiva', fill: PALETTE.primary50, fontColor: PALETTE.primary600 }
  if (/producci[oó]n|limpieza|formato/i.test(t)) return { label: 'Producción', fill: PALETTE.neutral100, fontColor: PALETTE.ink500 }
  return { label: 'Preventiva', fill: PALETTE.tertiary50, fontColor: PALETTE.tertiary700 }
}

export function tipoTareaStyle(tipoRaw = '') {
  const t = String(tipoRaw)
  if (/predictiva/i.test(t)) return { label: 'Predictiva', fill: PALETTE.ink100, fontColor: PALETTE.ink900 }
  if (/correctiva/i.test(t)) return { label: 'Correctiva', fill: PALETTE.primary50, fontColor: PALETTE.primary600 }
  return { label: 'Preventiva', fill: PALETTE.tertiary50, fontColor: PALETTE.tertiary700 }
}

export function condicionParadaStyle(condicion) {
  if (condicion === 'caliente') return { label: 'En caliente', fill: PALETTE.orange50, fontColor: PALETTE.orange700 }
  if (condicion === 'frio') return { label: 'En frío', fill: PALETTE.blue50, fontColor: PALETTE.blue700 }
  return { label: 'Sin definir', fill: PALETTE.neutral100, fontColor: PALETTE.ink500 }
}

export async function downloadWorkbook(wb, filename) {
  const buf = await wb.xlsx.writeBuffer()
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
