import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const PRIMARY = [244, 0, 0] // primary-500
const INK = [17, 24, 39] // ink-900
const INK_500 = [107, 114, 135]
const NEUTRAL = [226, 228, 232] // neutral-200
const TERTIARY = [13, 148, 136] // tertiary-600

const fmtDMY = (iso) => {
  const d = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
}

const formaExplicacion = {
  'Por desgaste': 'Las fallas aumentan con el uso (β de Weibull > 1).',
  'Aleatoria': 'Las fallas ocurren sin patrón con el tiempo (β ≈ 1).',
  'En racha': 'Varias fallas seguidas en poco tiempo.',
}

function pieDePagina(doc, pageWidth, pageHeight) {
  const total = doc.internal.getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(...INK_500)
    doc.text(`Generado por KOF-SMART Maintenance AI · Página ${i} de ${total}`, pageWidth / 2, pageHeight - 24, { align: 'center' })
  }
}

export async function exportHistoriaPdf(resumen) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const M = 40

  // 1) Encabezado Coca-Cola FEMSA / KOF-SMART con línea roja
  doc.setFont('helvetica', 'bold').setFontSize(13).setTextColor(...PRIMARY)
  doc.text('Coca-Cola FEMSA', M, 40)
  doc.setTextColor(...INK)
  doc.text('KOF-SMART Maintenance AI', pageWidth - M, 40, { align: 'right' })
  doc.setDrawColor(...PRIMARY).setLineWidth(1.5)
  doc.line(M, 48, pageWidth - M, 48)

  // 2) Título
  doc.setFontSize(16).setTextColor(...INK)
  doc.text(`Historia clínica · ${resumen.nombreMaquina ?? resumen.maquina}`, M, 78)

  // Línea de alcance de indicadores (solo si hay sistema/componente seleccionado)
  let y = 92
  if (resumen.alcance?.length) {
    doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(...INK_500)
    doc.text(`Alcance de indicadores: ${resumen.alcance.join(' · ')}`, M, y)
    y += 16
  }

  // 3) Datos generales
  doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(...INK_500)
  doc.text(`Máquina: ${resumen.nombreMaquina ?? resumen.maquina}`, M, y)
  y += 14
  const fecha = resumen.fechaExportacion instanceof Date ? resumen.fechaExportacion : new Date()
  doc.text(`Fecha de exportación: ${fecha.toLocaleDateString('es-CO')} · ${fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`, M, y)
  y += 14
  doc.text(`Periodo: del ${fmtDMY(resumen.periodo.desde)} al ${fmtDMY(resumen.periodo.hasta)}`, M, y)
  y += 22

  // 4) Indicadores: 4 recuadros en fila
  const ind = resumen.indicadores
  doc.setFont('helvetica', 'bold').setFontSize(11).setTextColor(...INK)
  doc.text('Indicadores', M, y)
  y += 10
  const boxW = (pageWidth - M * 2 - 12 * 3) / 4
  const boxes = [
    { label: 'Paros', value: ind.paros },
    { label: 'Minutos de paro', value: ind.minutosParo },
    { label: 'MTTR (min)', value: ind.mttr },
    { label: 'MTBF (h)', value: ind.mtbf },
  ]
  boxes.forEach((b, i) => {
    const x = M + i * (boxW + 12)
    doc.setDrawColor(...NEUTRAL).setFillColor(248, 249, 250)
    doc.roundedRect(x, y, boxW, 46, 6, 6, 'FD')
    doc.setFont('helvetica', 'normal').setFontSize(7.5).setTextColor(...INK_500)
    doc.text(b.label.toUpperCase(), x + 10, y + 15)
    doc.setFont('helvetica', 'bold').setFontSize(13).setTextColor(...INK)
    doc.text(String(b.value), x + 10, y + 35)
  })
  y += 60

  // 5) Forma de falla con explicación
  doc.setFont('helvetica', 'bold').setFontSize(11).setTextColor(...INK)
  doc.text('Forma de falla', M, y)
  y += 5
  doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(...INK)
  doc.text(`${resumen.formaFalla} — ${formaExplicacion[resumen.formaFalla] ?? ''}`, M, y + 12)
  y += 26

  // 6) Avisos de falla en el periodo
  doc.setFont('helvetica', 'normal').setFontSize(10)
  doc.text(`Número de avisos de falla en el periodo: ${resumen.avisosFalla}`, M, y)
  y += 26

  // 7) Fallas que más se repiten (top 5)
  doc.setFont('helvetica', 'bold').setFontSize(11)
  doc.text('Fallas que más se repiten', M, y)
  autoTable(doc, {
    startY: y + 8,
    head: [['Componente / modo de falla', 'Número de veces', 'Minutos de paro acumulados']],
    body: resumen.topFallas.map((f) => [f.componenteModo, f.veces, f.minutos]),
    theme: 'grid',
    headStyles: { fillColor: PRIMARY, textColor: [255, 255, 255], font: 'helvetica', fontSize: 9 },
    styles: { font: 'helvetica', fontSize: 9, lineColor: NEUTRAL },
    margin: { left: M, right: M },
  })
  y = doc.lastAutoTable.finalY + 24

  // 8) Tareas pendientes (SOLO preventivas)
  doc.setFont('helvetica', 'bold').setFontSize(11)
  doc.text('Tareas pendientes (preventivas)', M, y)
  if (!resumen.tareasPendientes?.length) {
    doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(...INK_500)
    doc.text('No hay tareas preventivas pendientes', M, y + 16)
  } else {
    autoTable(doc, {
      startY: y + 8,
      head: [['Tarea', 'Componente', 'Orden SAP', 'Fecha programada']],
      body: resumen.tareasPendientes.map((t) => [t.tarea, t.componente, t.ordenSap, fmtDMY(t.fechaProgramada)]),
      theme: 'grid',
      headStyles: { fillColor: TERTIARY, textColor: [255, 255, 255], font: 'helvetica', fontSize: 9 },
      styles: { font: 'helvetica', fontSize: 9, lineColor: NEUTRAL },
      margin: { left: M, right: M },
    })
  }

  // 9) Pie de página en todas las páginas
  pieDePagina(doc, pageWidth, pageHeight)

  const hoyISO = fecha.toISOString().slice(0, 10)
  const nombreMaquina = (resumen.maquina ?? 'maquina').toLowerCase()
  doc.save(`historia-clinica-${nombreMaquina}-${hoyISO}.pdf`)
}
