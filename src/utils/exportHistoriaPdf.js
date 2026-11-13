import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import cocaColaSvg from '../assets/coca-cola.svg'
import femsaSvg from '../assets/femsa.svg'

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

// ---------------------------------------------------------------------------------------------
// Antecedentes de un componente (modal de Componentes de la máquina)
// ---------------------------------------------------------------------------------------------
const ROJO_SUAVE = [254, 226, 226]

/** Logos SVG → PNG (jsPDF no dibuja SVG). Sin navegador (pruebas) devuelve null y se usa texto. */
async function svgAPng(url) {
  if (typeof document === 'undefined' || typeof Image === 'undefined' || !url) return null
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    const w = img.naturalWidth || img.width
    const h = img.naturalHeight || img.height
    if (!w || !h) return null
    const canvas = document.createElement('canvas')
    canvas.width = w * 3
    canvas.height = h * 3
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
    return { data: canvas.toDataURL('image/png'), w, h }
  } catch {
    return null
  }
}

const slug = (s) => String(s ?? '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'componente'

const hoyLocalISO = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const fmtNum = (v) => (v == null ? '—' : Math.round(v).toLocaleString('es-CO'))

/**
 * PDF con los antecedentes de un componente.
 * componente: { nombre, maquina, sistema, id } · indicadores: [{ label, value }] · antecedentes: objeto del servicio o null.
 * Devuelve el nombre del archivo generado.
 */
export async function exportAntecedentesComponentePdf(componente, indicadores = [], antecedentes = null) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const M = 40
  const tabla = (opts) => autoTable(doc, {
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 8.5, lineColor: NEUTRAL, cellPadding: 4 },
    margin: { left: M, right: M },
    ...opts,
  })
  let y = 0
  const asegurar = (espacio) => { if (y + espacio > pageHeight - 50) { doc.addPage(); y = 50 } }
  const titulo = (texto) => {
    asegurar(40)
    doc.setFont('helvetica', 'bold').setFontSize(11).setTextColor(...INK)
    doc.text(texto, M, y)
    y += 8
  }
  const tras = () => { y = (doc.lastAutoTable?.finalY ?? y) + 20 }

  // 1) Encabezado: logos (o texto si no se pueden dibujar) + KOF-SMART y línea roja
  const [logoCoca, logoFemsa] = await Promise.all([svgAPng(cocaColaSvg), svgAPng(femsaSvg)])
  if (logoCoca && logoFemsa) {
    const alto = 20
    const wCoca = (logoCoca.w / logoCoca.h) * alto
    doc.addImage(logoCoca.data, 'PNG', M, 24, wCoca, alto)
    doc.addImage(logoFemsa.data, 'PNG', M + wCoca + 10, 24, (logoFemsa.w / logoFemsa.h) * alto, alto)
  } else {
    doc.setFont('helvetica', 'bold').setFontSize(13).setTextColor(...PRIMARY)
    doc.text('Coca-Cola FEMSA', M, 40)
  }
  doc.setFont('helvetica', 'bold').setFontSize(13).setTextColor(...INK)
  doc.text('KOF-SMART Maintenance AI', pageWidth - M, 40, { align: 'right' })
  doc.setDrawColor(...PRIMARY).setLineWidth(1.5)
  doc.line(M, 50, pageWidth - M, 50)

  // 2) Título y datos generales
  doc.setFontSize(16).setTextColor(...INK)
  doc.text(`Antecedentes · ${componente.nombre}`, M, 80)
  y = 96
  doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(...INK_500)
  const fecha = new Date()
  const datos = [
    `Máquina: ${componente.maquina ?? '—'}`,
    `Sistema: ${componente.sistema ?? '—'}${componente.id ? ` · ID ${componente.id}` : ''}`,
    `Generado: ${fecha.toLocaleDateString('es-CO')} · ${fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`,
  ]
  datos.forEach((linea) => { doc.text(linea, M, y); y += 14 })
  y += 8

  // 3) Indicadores: recuadros de 3 en 3
  if (indicadores.length) {
    titulo('Indicadores')
    const porFila = 3
    const boxW = (pageWidth - M * 2 - 12 * (porFila - 1)) / porFila
    indicadores.forEach((b, i) => {
      const x = M + (i % porFila) * (boxW + 12)
      const yy = y + Math.floor(i / porFila) * 54
      doc.setDrawColor(...NEUTRAL).setFillColor(248, 249, 250)
      doc.roundedRect(x, yy, boxW, 44, 6, 6, 'FD')
      doc.setFont('helvetica', 'normal').setFontSize(7.5).setTextColor(...INK_500)
      doc.text(String(b.label).toUpperCase(), x + 10, yy + 15)
      doc.setFont('helvetica', 'bold').setFontSize(12).setTextColor(...INK)
      doc.text(String(b.value ?? '—'), x + 10, yy + 34)
    })
    y += Math.ceil(indicadores.length / porFila) * 54 + 14
  }

  if (!antecedentes) {
    asegurar(30)
    doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(...INK_500)
    doc.text('Sin fallas mayores ni ACR registrados para este componente.', M, y)
  } else {
    const { fallasMayores, acr = [], repuestoCritico, prePost = [] } = antecedentes

    // 4) Fallas mayores
    if (fallasMayores?.lista?.length) {
      titulo(`Fallas mayores (${fallasMayores.n} · ${fmtNum(fallasMayores.minutos)} min)`)
      tabla({
        startY: y,
        head: [['Fecha', 'Minutos', 'Causa de falla', 'Causa de alto tiempo', 'Detalle']],
        body: fallasMayores.lista.map((f) => [fmtDMY(f.fecha), fmtNum(f.minutos), f.causaFalla || '—', f.causaAltoTiempo || '—', f.detalle || '—']),
        headStyles: { fillColor: PRIMARY, textColor: [255, 255, 255], fontSize: 8.5 },
      })
      tras()
    }

    // 5) ACR con acciones (vencidas sin cierre en rojo)
    if (acr.length) {
      titulo('Análisis de causa raíz (ACR)')
      y += 6
      acr.forEach((a) => {
        asegurar(60)
        doc.setFont('helvetica', 'bold').setFontSize(9.5).setTextColor(...INK)
        const cab = `${fmtDMY(a.fecha)} · ${a.falla || 'Falla sin descripción'}${a.duracionMin != null ? ` · ${fmtNum(a.duracionMin)} min` : ''}`
        doc.text(doc.splitTextToSize(cab, pageWidth - M * 2), M, y)
        y += 13
        if (a.causaRaiz) {
          doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(...INK_500)
          const lineas = doc.splitTextToSize(`Causa raíz: ${a.causaRaiz}`, pageWidth - M * 2)
          doc.text(lineas, M, y)
          y += lineas.length * 11
        }
        if (a.acciones?.length) {
          tabla({
            startY: y + 2,
            head: [['Actividad', 'Responsable', 'Fecha fin', 'Estado']],
            body: a.acciones.map((x) => [x.actividad || '—', x.responsable || '—', fmtDMY(x.fechaFin), x.vencida ? 'Vencida sin cierre' : (x.estado || '—')]),
            headStyles: { fillColor: INK, textColor: [255, 255, 255], fontSize: 8.5 },
            didParseCell: (data) => {
              if (data.section === 'body' && a.acciones[data.row.index]?.vencida) {
                data.cell.styles.fillColor = ROJO_SUAVE
                data.cell.styles.textColor = PRIMARY
              }
            },
          })
          tras()
        } else {
          y += 10
        }
      })
    }

    // 6) Repuesto crítico
    if (repuestoCritico) {
      titulo('Repuesto crítico')
      tabla({
        startY: y,
        head: [['Nivel', 'Motivo']],
        body: [[repuestoCritico.nivel || '—', repuestoCritico.motivo || '—']],
        headStyles: { fillColor: PRIMARY, textColor: [255, 255, 255], fontSize: 8.5 },
        columnStyles: { 0: { cellWidth: 70 } },
      })
      tras()
    }

    // 7) Antes y después de mantenimientos mayores
    if (prePost.length) {
      titulo('Antes y después de mantenimientos mayores (30 días)')
      tabla({
        startY: y,
        head: [['Fecha', 'Orden', 'Tarea', 'Horas', 'Min antes', 'Min después', 'Cambio']],
        body: prePost.map((p) => [
          fmtDMY(p.fecha), p.orden ?? '—', p.tarea || '—', fmtNum(p.horas), fmtNum(p.antes), fmtNum(p.despues),
          p.cambioPct == null ? '—' : `${p.cambioPct > 0 ? '+' : ''}${Math.round(p.cambioPct)} %`,
        ]),
        headStyles: { fillColor: TERTIARY, textColor: [255, 255, 255], fontSize: 8.5 },
      })
      tras()
    }
  }

  pieDePagina(doc, pageWidth, pageHeight)
  const nombre = `Antecedentes_${slug(componente.maquina)}_${slug(componente.nombre)}_${hoyLocalISO(fecha)}.pdf`
  doc.save(nombre)
  return nombre
}
