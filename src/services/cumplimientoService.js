import { PARADAS, TAREAS_REPROGRAMADAS, getParadaById } from '../data/mock/cumplimiento'

function inRange(dateStr, from, to) {
  if (!from || !to || !dateStr) return false
  const d = dateStr.slice(0, 10)
  return d >= from && d <= to
}

function isCompleted(task) {
  return !!task.completada
}

function isReprogramada(tareaId) {
  return TAREAS_REPROGRAMADAS.some(tr => tr.tareaId === tareaId)
}

export async function getResumen(rango) {
  await new Promise(r => setTimeout(r, 150))
  if (!rango) return { cumplimiento: 0, ejecutadas: 0, programadas: 0, pospuestas: 0, vencidas: 0 }
  
  // Filtrar paradas por rango (inicio)
  const paradasEnRango = PARADAS.filter(p => inRange(p.inicio, rango.from, rango.to))
  
  let programadas = 0
  let ejecutadas = 0
  let pospuestas = 0
  
  for (const p of paradasEnRango) {
    for (const t of p.tareas || []) {
      programadas++
      if (isCompleted(t)) ejecutadas++
      if (isReprogramada(t.id)) pospuestas++
    }
  }
  
  // Vencidas: tareas no completadas de paradas en estado Vencida (sin filtrar por rango para cumplir especificación)
  let vencidas = 0
  for (const p of PARADAS) {
    if (p.estado === 'Vencida') {
      for (const t of p.tareas || []) {
        if (!isCompleted(t)) vencidas++
      }
    }
  }
  
  const cumplimiento = programadas === 0 ? 0 : Math.round((ejecutadas / programadas) * 100)
  
  return { cumplimiento, ejecutadas, programadas, pospuestas, vencidas }
}

function getWeekKeyFromDate(dateStr) {
  const d = new Date(dateStr)
  const dayNum = d.getDay() || 7
  const thu = new Date(d)
  thu.setDate(d.getDate() + 4 - dayNum)
  const yearStart = new Date(thu.getFullYear(), 0, 1)
  const weekNo = Math.ceil((((thu - yearStart) / 86400000) + 1) / 7)
  return `Sem ${weekNo}`
}

export async function getCumplimientoSemanal({ rango, maquina = 'todas' }) {
  await new Promise(r => setTimeout(r, 150))
  const maquinas = maquina === 'todas' ? ['Llenadora', 'Empacadora', 'Paletizadora', 'Envolvedora'] : [maquina]
  
  if (rango?.type === 'month') {
    // Agrupar por semanas del mes
    const weeks = {}
    for (const p of PARADAS) {
      if (!inRange(p.inicio, rango.from, rango.to)) continue
      if (!maquinas.includes(p.maquina)) continue
      const wk = getWeekKeyFromDate(p.inicio)
      if (!weeks[wk]) weeks[wk] = { semana: wk, maquinas: {} }
      if (!weeks[wk].maquinas[p.maquina]) weeks[wk].maquinas[p.maquina] = { programadas: 0, ejecutadas: 0 }
      for (const t of p.tareas || []) {
        weeks[wk].maquinas[p.maquina].programadas++
        if (isCompleted(t)) weeks[wk].maquinas[p.maquina].ejecutadas++
      }
    }
    const result = []
    Object.values(weeks).forEach(w => {
      maquinas.forEach(m => {
        const data = w.maquinas[m] || { programadas: 0, ejecutadas: 0 }
        const pct = data.programadas === 0 ? 0 : Math.round((data.ejecutadas / data.programadas) * 100)
        result.push({ semana: w.semana, maquina: m, cumplimiento: pct, ejecutadas: data.ejecutadas, programadas: data.programadas })
      })
    })
    return result
  } else {
    // Una semana
    const paradasEnRango = PARADAS.filter(p => inRange(p.inicio, rango.from, rango.to))
    const result = []
    for (const m of maquinas) {
      let programadas = 0
      let ejecutadas = 0
      for (const p of paradasEnRango.filter(x => x.maquina === m)) {
        for (const t of p.tareas || []) {
          programadas++
          if (isCompleted(t)) ejecutadas++
        }
      }
      const pct = programadas === 0 ? 0 : Math.round((ejecutadas / programadas) * 100)
      const wk = rango.from ? getWeekKeyFromDate(rango.from + 'T00:00:00') : 'Sem'
      result.push({ semana: wk, maquina: m, cumplimiento: pct, ejecutadas, programadas })
    }
    return result
  }
}

export async function getParadas({ estado = 'todos' } = {}) {
  await new Promise(r => setTimeout(r, 150))
  let list = [...PARADAS]
  if (estado && estado !== 'todos') {
    list = list.filter(p => p.estado === estado)
  }
  // Ordenar por fecha de inicio más próximas primero
  list.sort((a, b) => new Date(a.inicio) - new Date(b.inicio))
  return list
}

export async function registrarSeguimiento(paradaId, payload) {
  await new Promise(r => setTimeout(r, 300))
  const parada = getParadaById(paradaId)
  if (!parada) throw new Error('Parada no encontrada')
  
  // Actualizar tareas
  if (payload.tareas) {
    for (const t of parada.tareas) {
      if (payload.tareas[t.id] !== undefined) {
        t.completada = !!payload.tareas[t.id]
      }
    }
  }
  
  // Actualizar estado y duración
  if (payload.estado) parada.estado = payload.estado
  if (payload.finReal) parada.finReal = payload.finReal
  
  return { success: true, parada }
}
