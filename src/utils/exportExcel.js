import ExcelJS from 'exceljs'
import {
  PALETTE,
  setCell,
  mergeTitle,
  writeMeta,
  writeHeader,
  styleDataBorders,
  writeLegend,
  setupSheet,
  tipoParadaStyle,
  tipoTareaStyle,
  downloadWorkbook,
} from './excelExportStyles.js'

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const FONT = 'Calibri'

function parseDuracionHoras(horaInicio, horaFin) {
  if (!horaInicio || !horaFin) return 0
  const [h1, m1] = String(horaInicio).split(':').map(Number)
  const [h2, m2] = String(horaFin).split(':').map(Number)
  if ([h1, m1, h2, m2].some((n) => Number.isNaN(n))) return 0
  let mins = h2 * 60 + m2 - (h1 * 60 + m1)
  if (mins < 0) mins += 24 * 60
  return Math.round((mins / 60) * 10) / 10
}

function fmtGenerado(d) {
  return d.toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace('.', '')
}

function fmtPeriodo(week) {
  const start = new Date(week.start + 'T00:00:00')
  const end = new Date(week.end + 'T00:00:00')
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()
  const sDay = start.getDate()
  const eDay = end.getDate()
  const eMonth = end.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
  if (sameMonth) return `Semana ${week.weekNum} · Del ${sDay} al ${eDay} de ${eMonth}`
  const sMonth = start.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
  return `Semana ${week.weekNum} · Del ${sDay} de ${sMonth} al ${eDay} de ${eMonth}`
}

function tareasDeParada(p) {
  if (Array.isArray(p.tareasDetalle) && p.tareasDetalle.length) {
    return p.tareasDetalle.map((t) => ({
      descripcion: t.descripcion || '',
      tipo: t.tipo || (String(p.tipo || '').includes('Predictiva') ? 'Predictiva' : 'Preventiva'),
      maquina: t.maquina || p.maquina || '',
      sistema: t.sistema || t.sistemaId || '',
      componente: t.componente || t.componenteId || '',
    }))
  }
  const tipo = String(p.tipo || '').includes('Predictiva') ? 'Predictiva' : /correctiva/i.test(p.tipo || '') ? 'Correctiva' : 'Preventiva'
  return (p.tareas || []).map((desc) => ({ descripcion: desc, tipo, maquina: p.maquina || '', sistema: '', componente: '' }))
}

export function buildParadasSemanaWorkbook(paradas = [], week, { now = new Date() } = {}) {
  if (!week || !week.weekNum || !week.start) throw new Error('Semana inválida')
  const rows = [...(paradas || [])].sort((a, b) => (a.fecha || '').localeCompare(b.fecha || '') || (a.horaInicio || '').localeCompare(b.horaInicio || ''))
  const totalTareas = rows.reduce((s, p) => s + tareasDeParada(p).length, 0)
  const totalHoras = Math.round(rows.reduce((s, p) => s + parseDuracionHoras(p.horaInicio, p.horaFin), 0) * 10) / 10

  const wb = new ExcelJS.Workbook()
  wb.creator = 'KOF SMART'
  const lastCol = 'J'
  const sheetName = `Paradas semana ${week.weekNum}`.slice(0, 31)
  const ws = wb.addWorksheet(sheetName, { views: [{ state: 'frozen', ySplit: 7 }] })

  mergeTitle(ws, 1, `Programación de paradas · Semana ${week.weekNum}`, lastCol)
  ws.getRow(2).height = 6
  writeMeta(ws, 3, [
    { label: 'Generado', value: fmtGenerado(now) },
    { label: 'Período', value: fmtPeriodo(week) },
    { label: 'Resumen', value: `${rows.length} paradas · ${totalTareas} tareas · ${totalHoras} h de parada programadas · 4 máquinas críticas` },
  ], lastCol)
  ws.getRow(6).height = 6

  const headers = ['Fecha', 'Día', 'Hora de inicio', 'Hora de fin', 'Duración (h)', 'Máquina', 'Tipo de parada', 'Título', 'Tareas', 'Lista de tareas']
  writeHeader(ws, 7, headers)

  const dataStart = 8
  const dayBreakRows = []
  let prevFecha = null
  rows.forEach((p, i) => {
    const r = dataStart + i
    if (prevFecha && p.fecha !== prevFecha) dayBreakRows.push(r)
    prevFecha = p.fecha
    const tareas = tareasDeParada(p)
    const d = p.fecha ? new Date(p.fecha + 'T00:00:00') : null
    const dur = parseDuracionHoras(p.horaInicio, p.horaFin)
    const tipo = tipoParadaStyle(p.tipo)
    const lista = tareas.map((t) => `• ${t.descripcion}`).join('\n')

    setCell(ws, `A${r}`, d, { numFmt: 'dd/mm/yyyy', alignment: { vertical: 'top' } })
    setCell(ws, `B${r}`, d ? DIAS[d.getDay()] : '', { alignment: { vertical: 'top', horizontal: 'center' } })
    setCell(ws, `C${r}`, p.horaInicio || '', { alignment: { vertical: 'top' }, numFmt: '@' })
    setCell(ws, `D${r}`, p.horaFin || '', { alignment: { vertical: 'top' }, numFmt: '@' })
    setCell(ws, `E${r}`, dur, { alignment: { vertical: 'top' }, numFmt: '0.0' })
    setCell(ws, `F${r}`, p.maquina || '', { alignment: { vertical: 'top' } })
    setCell(ws, `G${r}`, tipo.label, {
      alignment: { vertical: 'top', horizontal: 'center' },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: tipo.fill } },
      font: { bold: true, color: { argb: tipo.fontColor } },
    })
    setCell(ws, `H${r}`, p.titulo || '', { alignment: { vertical: 'top', wrapText: true } })
    setCell(ws, `I${r}`, tareas.length, { alignment: { vertical: 'top', horizontal: 'center' } })
    setCell(ws, `J${r}`, lista, { alignment: { vertical: 'top', wrapText: true } })
    if (tareas.length > 1) ws.getRow(r).height = Math.max(20, 15 * tareas.length)
  })

  const dataEnd = rows.length ? dataStart + rows.length - 1 : dataStart - 1
  if (rows.length) styleDataBorders(ws, 7, dataEnd, 1, 10, { dayBreakRows })

  // Totales
  const totR = (rows.length ? dataEnd : 7) + 1
  ws.mergeCells(`A${totR}:D${totR}`)
  setCell(ws, `A${totR}`, 'Total', { font: { bold: true }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.neutral100 } }, alignment: { vertical: 'middle' } })
  setCell(ws, `E${totR}`, totalHoras, { font: { bold: true }, numFmt: '0.0', fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.neutral100 } }, alignment: { vertical: 'middle' } })
  ;['F','G','H'].forEach(col => setCell(ws, `${col}${totR}`, '', { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.neutral100 } } }))
  setCell(ws, `I${totR}`, totalTareas, { font: { bold: true }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.neutral100 } }, alignment: { vertical: 'middle', horizontal: 'center' } })
  setCell(ws, `J${totR}`, '', { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.neutral100 } } })
  // top border ink-900 on totals row
  for (let c = 1; c <= 10; c++) {
    const cell = ws.getCell(totR, c)
    cell.border = { ...(cell.border || {}), top: { style: 'medium', color: { argb: PALETTE.ink900 } } }
  }

  // Leyenda
  const legR = totR + 2
  writeLegend(ws, legR, 'Leyenda · tipo de parada', [
    { label: 'Preventiva', ...(() => { const s = tipoParadaStyle('Preventiva'); return { fill: s.fill, fontColor: s.fontColor } })() },
    { label: 'Correctiva', ...(() => { const s = tipoParadaStyle('Correctiva'); return { fill: s.fill, fontColor: s.fontColor } })() },
    { label: 'Predictiva', ...(() => { const s = tipoParadaStyle('Predictiva'); return { fill: s.fill, fontColor: s.fontColor } })() },
    { label: 'Producción', ...(() => { const s = tipoParadaStyle('Parada de producción'); return { fill: s.fill, fontColor: s.fontColor } })() },
  ])

  ws.autoFilter = { from: 'A7', to: `J${Math.max(7, dataEnd)}` }
  ;[12, 6, 10, 10, 11, 14, 14, 34, 8, 48].forEach((w, i) => { ws.getColumn(i + 1).width = w })
  ws.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }

  // Hoja 2: Tareas
  buildTareasSheet(wb, rows, week, now)

  const filename = `paradas-semana-${week.weekNum}-${week.start}.xlsx`
  return { wb, filename, stats: { paradas: rows.length, tareas: totalTareas, horas: totalHoras } }
}

function buildTareasSheet(wb, paradas, week, now) {
  const ws = wb.addWorksheet('Tareas', { views: [{ state: 'frozen', ySplit: 7 }] })
  const lastCol = 'H'
  mergeTitle(ws, 1, `Tareas programadas · Semana ${week.weekNum}`, lastCol)
  ws.getRow(2).height = 6
  const tareasAll = paradas.flatMap((p) => tareasDeParada(p).map((t) => ({ ...t, fecha: p.fecha, titulo: p.titulo })))
  writeMeta(ws, 3, [
    { label: 'Generado', value: fmtGenerado(now) },
    { label: 'Período', value: fmtPeriodo(week) },
    { label: 'Resumen', value: `${paradas.length} paradas · ${tareasAll.length} tareas · 4 máquinas críticas` },
  ], lastCol)
  ws.getRow(6).height = 6

  const headers = ['Fecha', 'Día', 'Parada (título)', 'Máquina', 'Sistema', 'Componente', 'Tipo de tarea', 'Tarea']
  writeHeader(ws, 7, headers)
  const dataStart = 8
  tareasAll.forEach((t, i) => {
    const r = dataStart + i
    const d = t.fecha ? new Date(t.fecha + 'T00:00:00') : null
    const tipo = tipoTareaStyle(t.tipo)
    setCell(ws, `A${r}`, d, { numFmt: 'dd/mm/yyyy', alignment: { vertical: 'top' } })
    setCell(ws, `B${r}`, d ? DIAS[d.getDay()] : '', { alignment: { vertical: 'top', horizontal: 'center' } })
    setCell(ws, `C${r}`, t.titulo || '', { alignment: { vertical: 'top', wrapText: true } })
    setCell(ws, `D${r}`, t.maquina || '', { alignment: { vertical: 'top' } })
    setCell(ws, `E${r}`, t.sistema || '', { alignment: { vertical: 'top' } })
    setCell(ws, `F${r}`, t.componente || '', { alignment: { vertical: 'top' } })
    setCell(ws, `G${r}`, tipo.label, {
      alignment: { vertical: 'top', horizontal: 'center' },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: tipo.fill } },
      font: { bold: true, color: { argb: tipo.fontColor } },
    })
    setCell(ws, `H${r}`, t.descripcion || '', { alignment: { vertical: 'top', wrapText: true } })
  })
  const dataEnd = tareasAll.length ? dataStart + tareasAll.length - 1 : 7
  if (tareasAll.length) styleDataBorders(ws, 7, dataEnd, 1, 8)
  ws.autoFilter = { from: 'A7', to: `H${Math.max(7, dataEnd)}` }
  ;[12, 6, 30, 14, 18, 20, 14, 44].forEach((w, i) => { ws.getColumn(i + 1).width = w })
  ws.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
}

export async function exportarParadasSemana(paradas, week, opts = {}) {
  if (!paradas || !paradas.length) return { ok: false, reason: 'empty' }
  const { wb, filename } = buildParadasSemanaWorkbook(paradas, week, opts)
  await downloadWorkbook(wb, filename)
  return { ok: true, filename }
}


