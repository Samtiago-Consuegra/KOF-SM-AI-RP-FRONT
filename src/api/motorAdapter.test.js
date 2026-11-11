import { expect, it } from 'vitest'

import {
  adaptarAlertas,
  adaptarComponentesHistoria,
  adaptarCumplimientoSap,
  adaptarHistoria,
  adaptarIndicadores,
  adaptarParadasPlan,
  adaptarPlanSugerido,
  adaptarSinParada,
  POCOS_DATOS,
} from './motorAdapter.js'

it('los adaptadores entregan la forma que consumen los componentes y toleran {"status":"calculando"}', () => {
  // --- Una alerta (alertas.json)
  const alertas = adaptarAlertas({
    fecha_referencia: '2026-11-09',
    alertas: [{
      Id_alerta: 'AL-1', Tipo: 'Ciclo', Prioridad: 'Crítica', IPM: 0.91,
      Maquina: 'Llenadora', Componente: 'Válvula de llenado', Id_componente: 'LLE-001',
      Mensaje: 'La válvula falla cada 21 días.', Evidencia: '6 eventos', Confianza: 'Alta',
      Accion_sugerida: 'Ver componente', Enlace: 'componente', Mostrar: true,
    }],
  })
  expect(alertas.available).toBe(true)
  expect(alertas[0]).toMatchObject({
    id: 'AL-1', tipo: 'Ciclo', icon: 'RefreshCcw', prioridad: 'Crítica', color: 'primary-500',
    maquina: 'Llenadora', componente: 'Válvula de llenado', mensaje: 'La válvula falla cada 21 días.',
    disparado: '6 eventos · Alta', accion: 'Ver componente', mostrar: true,
    accionRuta: { to: '/historia-clinica', state: { maquina: 'Llenadora', componente: 'Válvula de llenado' } },
  })

  // --- Una parada y una tarea sugerida (plan_semanal.json, versión fusión)
  const planSemanal = {
    semana: '2026-W46',
    versiones: {
      fusion: {
        paradas: [{
          Id_parada: 'PAR-2026-11-12-01', Titulo: 'Parada Llenadora', Modalidad: 'Frío', Dia: 'Jueves',
          Fecha: '2026-11-12', Inicio: '06:00', Fin: '14:00', Horas: 8, Maquinas: ['Llenadora'],
          Capacidad_h: 8, Horas_asignadas: 1.5, Por_sistema: [],
          Tareas: [{
            Id_tarea: 'T-1', Maquina: 'Llenadora', Sistema: 'Llenado', Componente: 'Válvula de llenado',
            Id_componente: 'LLE-001', Tipo_tarea: 'Preventiva', Tarea: 'Cambiar juntas', Duracion_h: 1.5,
          }],
        }],
        tareas_sugeridas: [{
          Id_tarea: 'T-1', Prioridad: 'Alta', Maquina: 'Llenadora', Sistema: 'Llenado', Grupo: 'G1',
          Componente: 'Válvula de llenado', Id_componente: 'LLE-001', Tarea: 'Cambiar juntas',
          Tipo_tarea: 'Preventiva', Clase_orden: 'ZPM1', Plan: '1234', Orden: '', Id_parada: 'PAR-2026-11-12-01',
          Duracion_h: 1.5, Origen: 'Plan SAP', Estado: 'Enviada a la parada', Motivo: 'Ciclo', Con_contratista: false,
        }],
      },
    },
  }
  const [parada] = adaptarParadasPlan(planSemanal)
  expect(parada).toMatchObject({
    id: 'PAR-2026-11-12-01', titulo: 'Parada Llenadora', condicion: 'frio', fecha: '2026-11-12',
    horaInicio: '06:00', horaFin: '14:00', maquina: 'Llenadora', maquinas: ['Llenadora'], tareas: ['Cambiar juntas'],
  })
  expect(parada.tareasDetalle[0]).toMatchObject({ idTarea: 'T-1', componenteId: 'LLE-001', tipo: 'Preventiva', duracionH: 1.5 })

  const [tarea] = adaptarPlanSugerido(planSemanal)
  expect(tarea).toMatchObject({
    id: 'T-1', semana: '2026-W46', prioridad: 'Alta', maquina: 'Llenadora', componenteId: 'LLE-001',
    tarea: 'Cambiar juntas', idParada: 'PAR-2026-11-12-01', enCalendario: true, decidida: true, conContratista: false,
  })
  expect(tarea.parada).toMatchObject({ id: 'PAR-2026-11-12-01', titulo: 'Parada Llenadora', horaInicio: '06:00', condicion: 'frio' })

  // --- Un componente de historia_clinica.json
  const historia = adaptarHistoria({
    generado_con_datos_hasta: '2026-10-31',
    maquinas: [{
      Maquina: 'Llenadora', Eventos: 6, Minutos_paro: 300, Componente_principal: 'Válvula de llenado',
      sistemas: [{
        Sistema: 'Llenado',
        componentes: [{
          Id_componente: 'LLE-001', Componente: 'Válvula de llenado', Eventos: 6, Minutos_paro: 300,
          MTBF_mediana_dias: 21, Datos_suficientes: false, Ultimo_evento: '2026-10-20',
          Confianza: 'Media', Tendencia: 'En aumento', serie_mensual: [{ Mes: '2026-10', Eventos: 2, Minutos: 90 }],
        }],
      }],
    }],
  })
  expect(historia).toMatchObject({ available: true, calculando: false, datosHasta: '2026-10-31', maquinas: ['Llenadora'] })
  expect(historia.jerarquia.Llenadora[0]).toEqual({
    id: 'Llenado', nombre: 'Llenado', componentes: [{ id: 'LLE-001', nombre: 'Válvula de llenado' }],
  })
  expect(adaptarComponentesHistoria(historia, 'Llenadora')[0]).toMatchObject({
    id: 'LLE-001', sistemaId: 'Llenado', nombre: 'Válvula de llenado', fallas: 6, minutos: 300,
    mtbf: POCOS_DATOS, ultimoEvento: '2026-10-20', tendencia: 'En aumento',
  })

  // --- 202 {"status":"calculando"}: estado normal, nunca error
  const calculando = { status: 'calculando' }
  expect(() => {
    expect(adaptarAlertas(calculando)).toMatchObject({ length: 0, calculando: true, available: true })
    expect(adaptarParadasPlan(calculando)).toMatchObject({ length: 0, calculando: true })
    expect(adaptarPlanSugerido(calculando)).toMatchObject({ length: 0, calculando: true })
    expect(adaptarSinParada(calculando).porVerificar).toEqual([])
    expect(adaptarIndicadores(calculando)).toMatchObject({ calculando: true, disponible: false })
    expect(adaptarHistoria(calculando)).toMatchObject({ calculando: true, available: false, maquinas: [] })
    expect(adaptarComponentesHistoria(adaptarHistoria(calculando), 'Llenadora')).toEqual([])
    expect(adaptarCumplimientoSap(calculando)).toMatchObject({ calculando: true, maquinas: [], pendientes: [] })
  }).not.toThrow()
})
