// Semáforo de riesgo de la matriz predictiva — solo tres niveles:
// bajo (verde), medio (amarillo), crítico (rojo). El backend del motor trae
// cuatro niveles (incluye "alto"); el adaptador lo fusiona en "crítico".
export const RISK_LEVELS = {
  critico: { label: 'Crítico', dot: 'bg-primary-500', badge: 'bg-primary-500 text-white', bar: 'bg-primary-500', text: 'text-primary-600' },
  medio: { label: 'Medio', dot: 'bg-yellow-400', badge: 'bg-yellow-100 text-yellow-800', bar: 'bg-yellow-400', text: 'text-yellow-700' },
  bajo: { label: 'Bajo', dot: 'bg-tertiary-500', badge: 'bg-tertiary-100 text-tertiary-800', bar: 'bg-tertiary-500', text: 'text-tertiary-700' },
}

// Colores propios por nivel para las tendencias en la matriz.
export const RISK_COLORS = {
  critico: '#f40000',
  medio: '#eab308',
  bajo: '#0d9488',
}