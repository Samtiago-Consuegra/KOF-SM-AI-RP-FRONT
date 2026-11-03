// Datos mock coherentes para Historia Clínica
// Se basan en la misma fuente de eventos para mantener coherencia

export const MAQUINAS = ['Llenadora', 'Empacadora', 'Paletizadora', 'Envolvedora']

const BASE_EVENTOS = {
  Llenadora: [
    { id: 'E-001', fecha: '2026-11-01', tipo: 'FALLA', titulo: 'Fuga en válvula de llenado', detalle: 'Turno 1 · 125 min de paro · Registrado en el Excel diario', turno: 1, minutosParo: 125 },
    { id: 'E-002', fecha: '2026-10-28', tipo: 'PREVENTIVO', orden: 'ZFI1', titulo: 'Cambio de sellos hidráulicos', detalle: 'Orden ZFI1 · Ejecutado en la parada programada · Duración real 240 min' },
    { id: 'E-003', fecha: '2026-10-25', tipo: 'CORRECTIVO', orden: 'ZFI3', titulo: 'Reparación de bomba', detalle: 'Orden ZFI3 · Tiempo de la orden marcado como atípico por cierre tardío' },
    { id: 'E-004', fecha: '2026-10-22', tipo: 'AVISO', orden: 'AV-105', titulo: 'Vibración anormal en cabezal', detalle: 'Aviso AV-105 · Vinculado a la orden ZFI3' },
    { id: 'E-005', fecha: '2026-10-18', tipo: 'FALLA', titulo: 'Desajuste de nivel', detalle: 'Turno 2 · 85 min de paro · Registrado en el Excel diario', turno: 2, minutosParo: 85 },
    { id: 'E-006', fecha: '2026-10-15', tipo: 'PREVENTIVO', orden: 'ZFI2', titulo: 'Inspección general', detalle: 'Orden ZFI2 · Ejecutado en la parada programada · Duración real 180 min' },
    { id: 'E-007', fecha: '2026-10-12', tipo: 'FALLA', titulo: 'Atasco en sistema de llenado', detalle: 'Turno 1 · 95 min de paro · Registrado en el Excel diario', turno: 1, minutosParo: 95 },
    { id: 'E-008', fecha: '2026-10-08', tipo: 'CORRECTIVO', orden: 'ZFI4', titulo: 'Cambio de sensor', detalle: 'Orden ZFI4 · Reparación menor' },
    { id: 'E-009', fecha: '2026-10-05', tipo: 'AVISO', orden: 'AV-106', titulo: 'Fuga menor detectada', detalle: 'Aviso AV-106 · Vinculado a la orden ZFI4' },
    { id: 'E-010', fecha: '2026-10-01', tipo: 'FALLA', titulo: 'Fallo en válvula solenoide', detalle: 'Turno 3 · 110 min de paro · Registrado en el Excel diario', turno: 3, minutosParo: 110 },
    { id: 'E-011', fecha: '2026-09-28', tipo: 'PREVENTIVO', orden: 'ZFI5', titulo: 'Lubricación', detalle: 'Orden ZFI5 · Ejecutado en la parada programada · Duración real 90 min' },
    { id: 'E-012', fecha: '2026-09-25', tipo: 'FALLA', titulo: 'Sobrecarga en motor', detalle: 'Turno 1 · 140 min de paro · Registrado en el Excel diario', turno: 1, minutosParo: 140 },
    { id: 'E-013', fecha: '2026-09-22', tipo: 'CORRECTIVO', orden: 'ZFI6', titulo: 'Ajuste de transmisión', detalle: 'Orden ZFI6 · Ajuste realizado' },
    { id: 'E-014', fecha: '2026-09-18', tipo: 'AVISO', orden: 'AV-107', titulo: 'Ruido anormal', detalle: 'Aviso AV-107 · Vinculado a la orden ZFI6' },
    { id: 'E-015', fecha: '2026-09-15', tipo: 'FALLA', titulo: 'Fuga en junta', detalle: 'Turno 2 · 75 min de paro · Registrado en el Excel diario', turno: 2, minutosParo: 75 },
    { id: 'E-016', fecha: '2026-09-12', tipo: 'PREVENTIVO', orden: 'ZFI7', titulo: 'Cambio de filtro', detalle: 'Orden ZFI7 · Ejecutado en la parada programada · Duración real 60 min' },
    { id: 'E-017', fecha: '2026-09-08', tipo: 'FALLA', titulo: 'Descalibración', detalle: 'Turno 1 · 65 min de paro · Registrado en el Excel diario', turno: 1, minutosParo: 65 },
    { id: 'E-018', fecha: '2026-09-05', tipo: 'CORRECTIVO', orden: 'ZFI8', titulo: 'Reemplazo de relé', detalle: 'Orden ZFI8 · Componente reemplazado' },
    { id: 'E-019', fecha: '2026-09-02', tipo: 'AVISO', orden: 'AV-108', titulo: 'Calentamiento excesivo', detalle: 'Aviso AV-108 · Vinculado a la orden ZFI8' },
    { id: 'E-020', fecha: '2026-08-28', tipo: 'FALLA', titulo: 'Fallo eléctrico', detalle: 'Turno 3 · 150 min de paro · Registrado en el Excel diario', turno: 3, minutosParo: 150 }
  ],
  Empacadora: [
    { id: 'E-101', fecha: '2026-11-02', tipo: 'FALLA', titulo: 'Fallo en cabezal sellador', detalle: 'Turno 1 · 98 min de paro · Registrado en el Excel diario', turno: 1, minutosParo: 98 },
    { id: 'E-102', fecha: '2026-10-29', tipo: 'PREVENTIVO', orden: 'ZFI10', titulo: 'Revisión de resistencias', detalle: 'Orden ZFI10 · Ejecutado en la parada programada · Duración real 120 min' },
    { id: 'E-103', fecha: '2026-10-26', tipo: 'CORRECTIVO', orden: 'ZFI11', titulo: 'Cambio de termostato', detalle: 'Orden ZFI11 · Ajuste térmico' },
    { id: 'E-104', fecha: '2026-10-23', tipo: 'AVISO', orden: 'AV-201', titulo: 'Temperatura irregular', detalle: 'Aviso AV-201 · Vinculado a la orden ZFI11' },
    { id: 'E-105', fecha: '2026-10-19', tipo: 'FALLA', titulo: 'Desalineación de banda', detalle: 'Turno 2 · 72 min de paro · Registrado en el Excel diario', turno: 2, minutosParo: 72 },
    { id: 'E-106', fecha: '2026-10-16', tipo: 'PREVENTIVO', orden: 'ZFI12', titulo: 'Alineación', detalle: 'Orden ZFI12 · Ejecutado en la parada programada · Duración real 100 min' },
    { id: 'E-107', fecha: '2026-10-13', tipo: 'FALLA', titulo: 'Fallo en motor reductor', detalle: 'Turno 1 · 88 min de paro · Registrado en el Excel diario', turno: 1, minutosParo: 88 },
    { id: 'E-108', fecha: '2026-10-09', tipo: 'CORRECTIVO', orden: 'ZFI13', titulo: 'Lubricación correctiva', detalle: 'Orden ZFI13 · Acción correctiva' },
    { id: 'E-109', fecha: '2026-10-06', tipo: 'AVISO', orden: 'AV-202', titulo: 'Ruido en reductor', detalle: 'Aviso AV-202 · Vinculado a la orden ZFI13' },
    { id: 'E-110', fecha: '2026-10-02', tipo: 'FALLA', titulo: 'Corte irregular', detalle: 'Turno 3 · 67 min de paro · Registrado en el Excel diario', turno: 3, minutosParo: 67 },
    { id: 'E-111', fecha: '2026-09-29', tipo: 'PREVENTIVO', orden: 'ZFI14', titulo: 'Revisión general', detalle: 'Orden ZFI14 · Ejecutado en la parada programada · Duración real 150 min' },
    { id: 'E-112', fecha: '2026-09-26', tipo: 'FALLA', titulo: 'Fallo neumático', detalle: 'Turno 1 · 82 min de paro · Registrado en el Excel diario', turno: 1, minutosParo: 82 },
    { id: 'E-113', fecha: '2026-09-23', tipo: 'CORRECTIVO', orden: 'ZFI15', titulo: 'Cambio de válvula', detalle: 'Orden ZFI15 · Válvula reemplazada' },
    { id: 'E-114', fecha: '2026-09-19', tipo: 'AVISO', orden: 'AV-203', titulo: 'Fuga neumática', detalle: 'Aviso AV-203 · Vinculado a la orden ZFI15' },
    { id: 'E-115', fecha: '2026-09-16', tipo: 'FALLA', titulo: 'Desajuste de sellado', detalle: 'Turno 2 · 76 min de paro · Registrado en el Excel diario', turno: 2, minutosParo: 76 },
    { id: 'E-116', fecha: '2026-09-13', tipo: 'PREVENTIVO', orden: 'ZFI16', titulo: 'Limpieza', detalle: 'Orden ZFI16 · Ejecutado en la parada programada · Duración real 80 min' },
    { id: 'E-117', fecha: '2026-09-09', tipo: 'FALLA', titulo: 'Fallo eléctrico', detalle: 'Turno 1 · 91 min de paro · Registrado en el Excel diario', turno: 1, minutosParo: 91 },
    { id: 'E-118', fecha: '2026-09-06', tipo: 'CORRECTIVO', orden: 'ZFI17', titulo: 'Revisión tablero', detalle: 'Orden ZFI17 · Acción correctiva' },
    { id: 'E-119', fecha: '2026-09-03', tipo: 'AVISO', orden: 'AV-204', titulo: 'Sobrecalentamiento', detalle: 'Aviso AV-204 · Vinculado a la orden ZFI17' },
    { id: 'E-120', fecha: '2026-08-29', tipo: 'FALLA', titulo: 'Fallo en sensor fotoeléctrico', detalle: 'Turno 3 · 64 min de paro · Registrado en el Excel diario', turno: 3, minutosParo: 64 }
  ],
  Paletizadora: [
    { id: 'E-201', fecha: '2026-11-01', tipo: 'FALLA', titulo: 'Fallo en brazo robótico', detalle: 'Turno 1 · 142 min de paro · Registrado en el Excel diario', turno: 1, minutosParo: 142 },
    { id: 'E-202', fecha: '2026-10-30', tipo: 'PREVENTIVO', orden: 'ZFI20', titulo: 'Lubricación de ejes', detalle: 'Orden ZFI20 · Ejecutado en la parada programada · Duración real 160 min' },
    { id: 'E-203', fecha: '2026-10-27', tipo: 'CORRECTIVO', orden: 'ZFI21', titulo: 'Revisión variador', detalle: 'Orden ZFI21 · Ajuste variador' },
    { id: 'E-204', fecha: '2026-10-24', tipo: 'AVISO', orden: 'AV-301', titulo: 'Vibración en eje', detalle: 'Aviso AV-301 · Vinculado a la orden ZFI21' },
    { id: 'E-205', fecha: '2026-10-20', tipo: 'FALLA', titulo: 'Fallo en gripper', detalle: 'Turno 2 · 118 min de paro · Registrado en el Excel diario', turno: 2, minutosParo: 118 },
    { id: 'E-206', fecha: '2026-10-17', tipo: 'PREVENTIVO', orden: 'ZFI22', titulo: 'Revisión baleros', detalle: 'Orden ZFI22 · Ejecutado en la parada programada · Duración real 140 min' },
    { id: 'E-207', fecha: '2026-10-14', tipo: 'FALLA', titulo: 'Error de posicionamiento', detalle: 'Turno 1 · 96 min de paro · Registrado en el Excel diario', turno: 1, minutosParo: 96 },
    { id: 'E-208', fecha: '2026-10-10', tipo: 'CORRECTIVO', orden: 'ZFI23', titulo: 'Calibración', detalle: 'Orden ZFI23 · Calibración realizada' },
    { id: 'E-209', fecha: '2026-10-07', tipo: 'AVISO', orden: 'AV-302', titulo: 'Desvío de posición', detalle: 'Aviso AV-302 · Vinculado a la orden ZFI23' },
    { id: 'E-210', fecha: '2026-10-03', tipo: 'FALLA', titulo: 'Fallo neumático', detalle: 'Turno 3 · 87 min de paro · Registrado en el Excel diario', turno: 3, minutosParo: 87 },
    { id: 'E-211', fecha: '2026-09-30', tipo: 'PREVENTIVO', orden: 'ZFI24', titulo: 'Inspección eléctrica', detalle: 'Orden ZFI24 · Ejecutado en la parada programada · Duración real 130 min' },
    { id: 'E-212', fecha: '2026-09-27', tipo: 'FALLA', titulo: 'Fallo en encoder', detalle: 'Turno 1 · 104 min de paro · Registrado en el Excel diario', turno: 1, minutosParo: 104 },
    { id: 'E-213', fecha: '2026-09-24', tipo: 'CORRECTIVO', orden: 'ZFI25', titulo: 'Cambio encoder', detalle: 'Orden ZFI25 · Encoder reemplazado' },
    { id: 'E-214', fecha: '2026-09-20', tipo: 'AVISO', orden: 'AV-303', titulo: 'Pérdida de señal', detalle: 'Aviso AV-303 · Vinculado a la orden ZFI25' },
    { id: 'E-215', fecha: '2026-09-17', tipo: 'FALLA', titulo: 'Fallo en reductora', detalle: 'Turno 2 · 126 min de paro · Registrado en el Excel diario', turno: 2, minutosParo: 126 },
    { id: 'E-216', fecha: '2026-09-14', tipo: 'PREVENTIVO', orden: 'ZFI26', titulo: 'Ajustes generales', detalle: 'Orden ZFI26 · Ejecutado en la parada programada · Duración real 110 min' },
    { id: 'E-217', fecha: '2026-09-10', tipo: 'FALLA', titulo: 'Fallo hidráulico', detalle: 'Turno 1 · 92 min de paro · Registrado en el Excel diario', turno: 1, minutosParo: 92 },
    { id: 'E-218', fecha: '2026-09-07', tipo: 'CORRECTIVO', orden: 'ZFI27', titulo: 'Reparación hidráulica', detalle: 'Orden ZFI27 · Acción correctiva' },
    { id: 'E-219', fecha: '2026-09-04', tipo: 'AVISO', orden: 'AV-304', titulo: 'Pérdida de presión', detalle: 'Aviso AV-304 · Vinculado a la orden ZFI27' },
    { id: 'E-220', fecha: '2026-08-30', tipo: 'FALLA', titulo: 'Fallo eléctrico', detalle: 'Turno 3 · 108 min de paro · Registrado en el Excel diario', turno: 3, minutosParo: 108 }
  ],
  Envolvedora: [
    { id: 'E-301', fecha: '2026-11-02', tipo: 'FALLA', titulo: 'Fallo en sistema film', detalle: 'Turno 1 · 76 min de paro · Registrado en el Excel diario', turno: 1, minutosParo: 76 },
    { id: 'E-302', fecha: '2026-10-31', tipo: 'PREVENTIVO', orden: 'ZFI30', titulo: 'Cambio de rodillos', detalle: 'Orden ZFI30 · Ejecutado en la parada programada · Duración real 100 min' },
    { id: 'E-303', fecha: '2026-10-28', tipo: 'CORRECTIVO', orden: 'ZFI31', titulo: 'Ajuste de tensión', detalle: 'Orden ZFI31 · Ajuste realizado' },
    { id: 'E-304', fecha: '2026-10-25', tipo: 'AVISO', orden: 'AV-401', titulo: 'Tensión irregular', detalle: 'Aviso AV-401 · Vinculado a la orden ZFI31' },
    { id: 'E-305', fecha: '2026-10-21', tipo: 'FALLA', titulo: 'Fallo en cuchilla', detalle: 'Turno 2 · 62 min de paro · Registrado en el Excel diario', turno: 2, minutosParo: 62 },
    { id: 'E-306', fecha: '2026-10-18', tipo: 'PREVENTIVO', orden: 'ZFI32', titulo: 'Cambio de cuchilla', detalle: 'Orden ZFI32 · Ejecutado en la parada programada · Duración real 85 min' },
    { id: 'E-307', fecha: '2026-10-15', tipo: 'FALLA', titulo: 'Desalineación de film', detalle: 'Turno 1 · 58 min de paro · Registrado en el Excel diario', turno: 1, minutosParo: 58 },
    { id: 'E-308', fecha: '2026-10-11', tipo: 'CORRECTIVO', orden: 'ZFI33', titulo: 'Reparación guía', detalle: 'Orden ZFI33 · Acción correctiva' },
    { id: 'E-309', fecha: '2026-10-08', tipo: 'AVISO', orden: 'AV-402', titulo: 'Desviación de film', detalle: 'Aviso AV-402 · Vinculado a la orden ZFI33' },
    { id: 'E-310', fecha: '2026-10-04', tipo: 'FALLA', titulo: 'Fallo en sellador', detalle: 'Turno 3 · 71 min de paro · Registrado en el Excel diario', turno: 3, minutosParo: 71 },
    { id: 'E-311', fecha: '2026-10-01', tipo: 'PREVENTIVO', orden: 'ZFI34', titulo: 'Revisión sellador', detalle: 'Orden ZFI34 · Ejecutado en la parada programada · Duración real 95 min' },
    { id: 'E-312', fecha: '2026-09-28', tipo: 'FALLA', titulo: 'Atasco de film', detalle: 'Turno 1 · 54 min de paro · Registrado en el Excel diario', turno: 1, minutosParo: 54 },
    { id: 'E-313', fecha: '2026-09-25', tipo: 'CORRECTIVO', orden: 'ZFI35', titulo: 'Limpieza sistema', detalle: 'Orden ZFI35 · Limpieza realizada' },
    { id: 'E-314', fecha: '2026-09-21', tipo: 'AVISO', orden: 'AV-403', titulo: 'Acumulación film', detalle: 'Aviso AV-403 · Vinculado a la orden ZFI35' },
    { id: 'E-315', fecha: '2026-09-18', tipo: 'FALLA', titulo: 'Fallo eléctrico', detalle: 'Turno 2 · 69 min de paro · Registrado en el Excel diario', turno: 2, minutosParo: 69 },
    { id: 'E-316', fecha: '2026-09-15', tipo: 'PREVENTIVO', orden: 'ZFI36', titulo: 'Revisión eléctrica', detalle: 'Orden ZFI36 · Ejecutado en la parada programada · Duración real 110 min' },
    { id: 'E-317', fecha: '2026-09-11', tipo: 'FALLA', titulo: 'Fallo en motor', detalle: 'Turno 1 · 77 min de paro · Registrado en el Excel diario', turno: 1, minutosParo: 77 },
    { id: 'E-318', fecha: '2026-09-08', tipo: 'CORRECTIVO', orden: 'ZFI37', titulo: 'Revisión motor', detalle: 'Orden ZFI37 · Acción correctiva' },
    { id: 'E-319', fecha: '2026-09-05', tipo: 'AVISO', orden: 'AV-404', titulo: 'Calentamiento motor', detalle: 'Aviso AV-404 · Vinculado a la orden ZFI37' },
    { id: 'E-320', fecha: '2026-08-31', tipo: 'FALLA', titulo: 'Fallo en variador', detalle: 'Turno 3 · 83 min de paro · Registrado en el Excel diario', turno: 3, minutosParo: 83 }
  ]
}

export const FICHAS = {
  Llenadora: { fallaPredominante: 'Por desgaste', componentePrincipal: { nombre: 'Válvula de llenado', paros: 12 }, planesPreventivosVigentes: 5, ordenesSinEjecutar: 2, criticidad: 'mas_danada' },
  Empacadora: { fallaPredominante: 'Aleatoria', componentePrincipal: { nombre: 'Cabezal sellador', paros: 9 }, planesPreventivosVigentes: 4, ordenesSinEjecutar: 1, criticidad: 'puesto_2' },
  Paletizadora: { fallaPredominante: 'En racha', componentePrincipal: { nombre: 'Brazo robótico', paros: 11 }, planesPreventivosVigentes: 6, ordenesSinEjecutar: 0, criticidad: 'puesto_3' },
  Envolvedora: { fallaPredominante: 'Por desgaste', componentePrincipal: { nombre: 'Sistema film', paros: 7 }, planesPreventivosVigentes: 3, ordenesSinEjecutar: 1, criticidad: 'puesto_4' }
}

export const INDICADORES = {
  Llenadora: { fallas: 12, minutosParo: 1185, mtbf: 245, mttr: 98, disponibilidad: 87.5, cumplimientoPlan: 92, promedioLinea: 9 },
  Empacadora: { fallas: 9, minutosParo: 798, mtbf: 312, mttr: 88, disponibilidad: 91.2, cumplimientoPlan: 94, promedioLinea: 9 },
  Paletizadora: { fallas: 11, minutosParo: 1167, mtbf: 268, mttr: 106, disponibilidad: 88.1, cumplimientoPlan: 90, promedioLinea: 9 },
  Envolvedora: { fallas: 8, minutosParo: 700, mtbf: 365, mttr: 87, disponibilidad: 93.4, cumplimientoPlan: 95, promedioLinea: 9 }
}

export const COMPONENTES = {
  Llenadora: [
    { nombre: 'Válvula de llenado', nivel: 'Crítico', fallas: 12, mtbf: 245, ultimoEvento: '2026-11-01' },
    { nombre: 'Bombas', nivel: 'Alto', fallas: 6, mtbf: 312, ultimoEvento: '2026-10-25' },
    { nombre: 'Sensores', nivel: 'Medio', fallas: 3, mtbf: 456, ultimoEvento: '2026-10-15' },
    { nombre: 'Conexiones', nivel: 'Sin nivel', fallas: 2, mtbf: null, ultimoEvento: '2026-09-28' }
  ],
  Empacadora: [
    { nombre: 'Cabezal sellador', nivel: 'Crítico', fallas: 9, mtbf: 312, ultimoEvento: '2026-11-02' },
    { nombre: 'Transportador', nivel: 'Alto', fallas: 5, mtbf: 398, ultimoEvento: '2026-10-19' },
    { nombre: 'Neumática', nivel: 'Medio', fallas: 3, mtbf: 523, ultimoEvento: '2026-10-09' },
    { nombre: 'Motor reductor', nivel: 'Alto', fallas: 4, mtbf: 342, ultimoEvento: '2026-10-13' }
  ],
  Paletizadora: [
    { nombre: 'Brazo robótico', nivel: 'Crítico', fallas: 11, mtbf: 268, ultimoEvento: '2026-11-01' },
    { nombre: 'Variador', nivel: 'Alto', fallas: 6, mtbf: 298, ultimoEvento: '2026-10-27' },
    { nombre: 'Encoder', nivel: 'Alto', fallas: 5, mtbf: 321, ultimoEvento: '2026-09-27' },
    { nombre: 'Hidráulica', nivel: 'Medio', fallas: 3, mtbf: 445, ultimoEvento: '2026-09-10' }
  ],
  Envolvedora: [
    { nombre: 'Sistema film', nivel: 'Crítico', fallas: 8, mtbf: 365, ultimoEvento: '2026-11-02' },
    { nombre: 'Cuchilla', nivel: 'Alto', fallas: 5, mtbf: 412, ultimoEvento: '2026-10-31' },
    { nombre: 'Sellador', nivel: 'Alto', fallas: 4, mtbf: 398, ultimoEvento: '2026-10-04' },
    { nombre: 'Variador', nivel: 'Medio', fallas: 2, mtbf: 567, ultimoEvento: '2026-08-31' }
  ]
}

export function getEventos(maquina) {
  return [...(BASE_EVENTOS[maquina] || [])].sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
}

export function getParosPorMes(maquina) {
  return [
    { mes: 'Dic 25', paros: 8, minutosParo: 720, mantenimientos: [{ orden: 'ZFI1', tarea: 'Cambio de válvulas', fecha: '14/12' }] },
    { mes: 'Ene 26', paros: 6, minutosParo: 580, mantenimientos: [] },
    { mes: 'Feb 26', paros: 7, minutosParo: 650, mantenimientos: [{ orden: 'ZFI2', tarea: 'Inspección general', fecha: '12/02' }] },
    { mes: 'Mar 26', paros: 9, minutosParo: 890, mantenimientos: [] },
    { mes: 'Abr 26', paros: 5, minutosParo: 480, mantenimientos: [{ orden: 'ZFI3', tarea: 'Lubricación', fecha: '18/04' }] },
    { mes: 'May 26', paros: 7, minutosParo: 720, mantenimientos: [] },
    { mes: 'Jun 26', paros: 8, minutosParo: 760, mantenimientos: [{ orden: 'ZFI4', tarea: 'Cambio de filtro', fecha: '10/06' }] },
    { mes: 'Jul 26', paros: 6, minutosParo: 590, mantenimientos: [] },
    { mes: 'Ago 26', paros: 9, minutosParo: 920, mantenimientos: [{ orden: 'ZFI5', tarea: 'Revisión general', fecha: '15/08' }] },
    { mes: 'Sep 26', paros: 10, minutosParo: 980, mantenimientos: [] },
    { mes: 'Oct 26', paros: 11, minutosParo: 1100, mantenimientos: [{ orden: 'ZFI6', tarea: 'Alineación', fecha: '20/10' }] },
    { mes: 'Nov 26', paros: 12, minutosParo: 1185, mantenimientos: [{ orden: 'ZFI1', tarea: 'Cambio de sellos hidráulicos', fecha: '28/10' }] }
  ]
}
