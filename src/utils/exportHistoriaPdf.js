import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export async function exportHistoriaPdf(resumen) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  
  // Header
  doc.setTextColor(244, 0, 0)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Coca-Cola FEMSA', 40, 40)
  doc.setTextColor(17, 24, 39)
  doc.text('KOF-SMART Maintenance AI', pageWidth - 40, 40, { align: 'right' })
  doc.setDrawColor(244, 0, 0)
  doc.setLineWidth(1)
  doc.line(40, 50, pageWidth - 40, 50)
  
  // Título
  doc.setFontSize(16)
  doc.setTextColor(17, 24, 39)
  doc.text(`Historia clínica · ${resumen.maquina} L4`, 40, 80)
  
  // Datos generales
  doc.setFontSize(10)
  doc.setTextColor(107, 114, 128)
  doc.text(`Máquina: ${resumen.maquina}`, 40, 100)
  const fecha = resumen.fechaExportacion
  doc.text(`Fecha de exportación: ${fecha.toLocaleDateString('es-ES')} ${fecha.toLocaleTimeString('es-ES')}`, 40, 115)
  doc.text(`Periodo: Del ${resumen.periodo.desde} al ${resumen.periodo.hasta}`, 40, 130)
  
  // Indicadores
  doc.setFontSize(12)
  doc.setTextColor(17, 24, 39)
  doc.setFont('helvetica', 'bold')
  doc.text('Indicadores', 40, 160)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  
  const ind = resumen.indicadores
  const boxes = [
    { label: 'Paros', value: ind.fallas },
    { label: 'Minutos de paro', value: ind.minutosParo },
    { label: 'MTTR (min)', value: ind.mttr },
    { label: 'MTBF (h)', value: ind.mtbf }
  ]
  
  boxes.forEach((box, i) => {
    const x = 40 + i * 130
    doc.setDrawColor(229, 231, 235)
    doc.rect(x, 170, 120, 40)
    doc.setTextColor(107, 114, 128)
    doc.text(box.label, x + 10, 185)
    doc.setTextColor(17, 24, 39)
    doc.setFont('helvetica', 'bold')
    doc.text(String(box.value), x + 10, 200)
    doc.setFont('helvetica', 'normal')
  })
  
  // Forma de falla
  doc.setTextColor(17, 24, 39)
  doc.setFont('helvetica', 'bold')
  doc.text('Forma de falla', 40, 235)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(107, 114, 128)
  let expl = ''
  if (resumen.formaFalla === 'Por desgaste') expl = 'Las fallas aumentan con el uso (β de Weibull > 1).'
  else if (resumen.formaFalla === 'Aleatoria') expl = 'Las fallas ocurren sin patrón con el tiempo (β ≈ 1).'
  else expl = 'Varias fallas seguidas en poco tiempo.'
  doc.text(`${resumen.formaFalla} · ${expl}`, 40, 250)
  
  // Avisos
  doc.setTextColor(17, 24, 39)
  doc.text(`Número de avisos de falla en el periodo: ${resumen.avisosFalla}`, 40, 275)
  
  // Fallas que más se repiten
  doc.setFont('helvetica', 'bold')
  doc.text('Fallas que más se repiten', 40, 305)
  autoTable(doc, {
    startY: 315,
    head: [['Componente/Modo de falla', 'Número de veces', 'Minutos de paro acumulados']],
    body: resumen.topFallas.map((f) => [f.componenteModo, f.veces, f.minutos]),
    theme: 'grid',
    headStyles: { fillColor: [244, 0, 0], textColor: [255, 255, 255] },
    styles: { font: 'helvetica', fontSize: 9 }
  })
  
  // Tareas pendientes
  const finalY = doc.lastAutoTable.finalY + 30
  doc.setFont('helvetica', 'bold')
  doc.text('Tareas pendientes (SOLO preventivas)', 40, finalY)
  if (!resumen.tareasPendientes || resumen.tareasPendientes.length === 0) {
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(107, 114, 128)
    doc.text('No hay tareas preventivas pendientes', 40, finalY + 20)
  } else {
    autoTable(doc, {
      startY: finalY + 10,
      head: [['Tarea', 'Componente', 'Orden SAP', 'Fecha programada']],
      body: resumen.tareasPendientes.map((t) => [t.tarea, t.componente, t.ordenSap, t.fechaProgramada]),
      theme: 'grid',
      headStyles: { fillColor: [244, 0, 0], textColor: [255, 255, 255] },
      styles: { font: 'helvetica', fontSize: 9 }
    })
  }
  
  // Pie de página
  const totalPages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(107, 114, 128)
    doc.text(`Generado por KOF-SMART Maintenance AI · Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 30, { align: 'center' })
  }
  
  const fileName = `historia-clinica-${resumen.maquina.toLowerCase()}-${fecha.toISOString().split('T')[0]}.pdf`
  doc.save(fileName)
}
