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

const SIN_CIERRE = 'Fecha cumplida sin cierre registrado'
const txt = (v) => (v === null || v === undefined || v === '' ? '—' : String(v))
const fmtFecha = (v) => (v ? fmtDMY(String(v).slice(0, 10)) : '—')

// Tabla autoTable con el estilo del informe; devuelve la Y siguiente
function tabla(doc, y, M, head, body, color, extra = {}) {
  autoTable(doc, {
    startY: y,
    head: [head],
    body,
    theme: 'grid',
    headStyles: { fillColor: color, textColor: [255, 255, 255], font: 'helvetica', fontSize: 8.5 },
    styles: { font: 'helvetica', fontSize: 8.5, lineColor: NEUTRAL },
    margin: { left: M, right: M },
    ...extra,
  })
  return doc.lastAutoTable.finalY + 12
}

// Salta de página si no queda espacio para un título + algo de contenido
function espacio(doc, y, pageHeight, necesario = 60) {
  if (y + necesario < pageHeight - 50) return y
  doc.addPage()
  return 50
}

function bloqueAntecedentes(doc, ant, y, M, pageWidth, pageHeight) {
  const hayCausas = ant.causasFalla.length || ant.causasAltoTiempo.length
  if (!hayCausas && !ant.componentes.length) return y

  y = espacio(doc, y, pageHeight)
  doc.setFont('helvetica', 'bold').setFontSize(13).setTextColor(...INK)
  doc.text('Antecedentes', M, y)
  y += 16

  const lineaCausas = (titulo, items) => {
    if (!items.length) return
    doc.setFont('helvetica', 'bold').setFontSize(9.5).setTextColor(...INK)
    doc.text(`${titulo}:`, M, y)
    doc.setFont('helvetica', 'normal')
    const lineas = doc.splitTextToSize(items.map(([c, n]) => `${c} (${n})`).join(' · '), pageWidth - M * 2)
    doc.text(lineas, M, y + 12)
    y += 12 + lineas.length * 11 + 6
  }
  lineaCausas('Causas de falla', ant.causasFalla)
  lineaCausas('Causas de alto tiempo', ant.causasAltoTiempo)

  for (const c of ant.componentes) {
    y = espacio(doc, y + 4, pageHeight, 80)
    doc.setFont('helvetica', 'bold').setFontSize(11).setTextColor(...INK)
    doc.text(`${txt(c.Componente)}${c.Sistema ? ` · ${c.Sistema}` : ''}`, M, y)
    y += 12

    if (c.Repuesto_critico) {
      doc.setFont('helvetica', 'bold').setFontSize(9).setTextColor(...PRIMARY)
      const aviso = doc.splitTextToSize(
        `Repuesto crítico · ${txt(c.Repuesto_critico.Nivel)}${c.Repuesto_critico.Motivo ? ` — ${c.Repuesto_critico.Motivo}` : ''}`,
        pageWidth - M * 2,
      )
      doc.text(aviso, M, y + 2)
      y += aviso.length * 11 + 6
    }

    const fm = c.Fallas_mayores
    if (fm?.N > 0) {
      doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(...INK)
      doc.text(`Fallas mayores: ${txt(fm.N)} · ${txt(fm.Minutos)} minutos`, M, y + 2)
      y += 8
      if (fm.Lista?.length) {
        y = tabla(doc, y, M, ['Fecha', 'Minutos', 'Causa de falla', 'Causa de alto tiempo', 'Detalle'],
          fm.Lista.map((f) => [fmtFecha(f.Fecha), txt(f.Minutos), txt(f.Causa_falla), txt(f.Causa_alto_tiempo), txt(f.Detalle)]), PRIMARY)
      } else {
        y += 10
      }
    }

    for (const a of c.ACR ?? []) {
      y = espacio(doc, y, pageHeight)
      doc.setFont('helvetica', 'bold').setFontSize(9).setTextColor(...INK)
      doc.text(`ACR ${fmtFecha(a.Fecha)} · ${txt(a.Falla)} · ${txt(a.Duracion_min)} min`, M, y + 2)
      y += 12
      if (a.Causa_raiz) {
        doc.setFont('helvetica', 'normal')
        const cr = doc.splitTextToSize(`Causa raíz: ${a.Causa_raiz}`, pageWidth - M * 2)
        doc.text(cr, M, y + 2)
        y += cr.length * 11
      }
      if (a.Acciones?.length) {
        y = tabla(doc, y, M, ['Actividad', 'Responsable', 'Fecha fin', 'Estado'],
          a.Acciones.map((ac) => [txt(ac.Actividad), txt(ac.Responsable), fmtFecha(ac.Fecha_fin), txt(ac.Estado)]), INK, {
            didParseCell: (d) => {
              if (d.section === 'body' && d.column.index === 3 && d.cell.raw === SIN_CIERRE) {
                d.cell.styles.textColor = PRIMARY
                d.cell.styles.fontStyle = 'bold'
              }
            },
          })
      } else {
        y += 6
      }
    }

    if (c.Pre_post_mantenimientos?.length) {
      y = espacio(doc, y, pageHeight)
      doc.setFont('helvetica', 'bold').setFontSize(9).setTextColor(...INK)
      doc.text('Antes y después de mantenimientos mayores', M, y + 2)
      y = tabla(doc, y + 8, M, ['Fecha', 'Orden', 'Tarea', 'Min. 30 d antes', 'Min. 30 d después', 'Cambio %'],
        c.Pre_post_mantenimientos.map((p) => [fmtFecha(p.Fecha), txt(p.Orden), txt(p.Tarea), txt(p.Minutos_30d_antes), txt(p.Minutos_30d_despues), txt(p.Cambio_pct)]), TERTIARY)
    }
  }
  return y
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
    doc.text(txt(b.value), x + 10, y + 35)
  })
  y += 60

  // 5) Forma de falla con explicación
  doc.setFont('helvetica', 'bold').setFontSize(11).setTextColor(...INK)
  doc.text('Forma de falla', M, y)
  y += 5
  doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(...INK)
  const forma = doc.splitTextToSize(
    resumen.formaFalla ? `${resumen.formaFalla}${resumen.explicacionFalla ? ` — ${resumen.explicacionFalla}` : ''}` : 'Sin forma de falla del motor',
    pageWidth - M * 2,
  )
  doc.text(forma, M, y + 12)
  y += 14 + forma.length * 12

  // 6) Avisos de falla en el periodo
  doc.setFont('helvetica', 'normal').setFontSize(10)
  doc.text(`Número de avisos de falla en el periodo: ${txt(resumen.avisosFalla)}`, M, y)
  y += 26

  // 7) Fallas que más se repiten (top 5)
  doc.setFont('helvetica', 'bold').setFontSize(11)
  doc.text('Fallas que más se repiten', M, y)
  autoTable(doc, {
    startY: y + 8,
    head: [['Componente / modo de falla', 'Número de veces', 'Minutos de paro acumulados']],
    body: (resumen.topFallas ?? []).map((f) => [txt(f.componenteModo), txt(f.veces), txt(f.minutos)]),
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
    y += 36
  } else {
    autoTable(doc, {
      startY: y + 8,
      head: [['Tarea', 'Componente', 'Orden SAP', 'Fecha programada']],
      body: resumen.tareasPendientes.map((t) => [txt(t.tarea), txt(t.componente), txt(t.ordenSap), fmtFecha(t.fechaProgramada)]),
      theme: 'grid',
      headStyles: { fillColor: TERTIARY, textColor: [255, 255, 255], font: 'helvetica', fontSize: 9 },
      styles: { font: 'helvetica', fontSize: 9, lineColor: NEUTRAL },
      margin: { left: M, right: M },
    })
    y = doc.lastAutoTable.finalY + 24
  }

  // 8b) Antecedentes del motor (fallas mayores, ACR, repuestos, antes/después)
  if (resumen.antecedentes) bloqueAntecedentes(doc, resumen.antecedentes, y, M, pageWidth, pageHeight)

  // 9) Pie de página en todas las páginas
  pieDePagina(doc, pageWidth, pageHeight)

  const hoyISO = fecha.toISOString().slice(0, 10)
  const nombreMaquina = (resumen.maquina ?? 'maquina').toLowerCase()
  doc.save(`historia-clinica-${nombreMaquina}-${hoyISO}.pdf`)
}
