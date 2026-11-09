export const CONDICION_PARADA = {
  frio: {
    value: 'frio',
    label: 'En frío',
    short: 'Frío',
    descripcion: 'Parada con el equipo detenido y frío',
    badge: 'border-blue-300 bg-blue-50 text-blue-700',
    iconWrap: 'bg-blue-50 text-blue-700',
  },
  caliente: {
    value: 'caliente',
    label: 'En caliente',
    short: 'Caliente',
    descripcion: 'Parada con el equipo aún en temperatura de operación',
    badge: 'border-orange-300 bg-orange-50 text-orange-700',
    iconWrap: 'bg-orange-50 text-orange-700',
  },
}

export const CONDICION_OPTIONS = [CONDICION_PARADA.frio, CONDICION_PARADA.caliente]

export function condicionDeParada(parada) {
  return CONDICION_PARADA[parada?.condicion] || null
}

export function maquinasDeParada(parada) {
  if (!parada) return []
  const explicitas = Array.isArray(parada.maquinas) ? parada.maquinas : []
  const desdeTareas = Array.isArray(parada.tareasDetalle) ? parada.tareasDetalle.map((t) => t.maquina) : []
  const legado = parada.maquina ? [parada.maquina] : []
  return [...new Set([...explicitas, ...desdeTareas, ...legado].filter(Boolean))]
}

export function resumenMaquinas(parada) {
  const maquinas = maquinasDeParada(parada)
  if (!maquinas.length) return 'Sin máquina'
  return maquinas.length === 1 ? maquinas[0] : `${maquinas[0]} +${maquinas.length - 1}`
}

export function textoMaquinas(parada) {
  return maquinasDeParada(parada).join(', ')
}
