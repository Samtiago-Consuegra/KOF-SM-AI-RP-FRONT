// Catálogo de la línea 4 — 17 máquinas monitoreadas.
// critical = equipo crítico de la línea (filtro por defecto)
export const MACHINES = [
  { id: 'M01', name: 'Máquina 01', type: 'Despaletizadora de cajas', critical: false },
  { id: 'M02', name: 'Máquina 02', type: 'Lavadora de botellas', critical: false },
  { id: 'M03', name: 'Máquina 03', type: 'Inspector electrónico de envases', critical: false },
  { id: 'M04', name: 'Máquina 04', type: 'Llenadora rotativa', critical: true },
  { id: 'M05', name: 'Máquina 05', type: 'Mezclador de jarabe', critical: false },
  { id: 'M06', name: 'Máquina 06', type: 'Carbonatador', critical: false },
  { id: 'M07', name: 'Máquina 07', type: 'Etiquetadora alta velocidad', critical: true },
  { id: 'M08', name: 'Máquina 08', type: 'Codificadora láser', critical: false },
  { id: 'M09', name: 'Máquina 09', type: 'Transportador principal', critical: false },
  { id: 'M10', name: 'Máquina 10', type: 'Empacadora termoencogible', critical: false },
  { id: 'M11', name: 'Máquina 11', type: 'Paletizadora', critical: false },
  { id: 'M12', name: 'Máquina 12', type: 'Tapadora neumática', critical: true },
  { id: 'M13', name: 'Máquina 13', type: 'Sopladora PET', critical: false },
  { id: 'M14', name: 'Máquina 14', type: 'Compresor de aire', critical: false },
  { id: 'M15', name: 'Máquina 15', type: 'Enfriador de jarabe', critical: true },
  { id: 'M16', name: 'Máquina 16', type: 'Envolvedora stretch', critical: false },
  { id: 'M17', name: 'Máquina 17', type: 'Caldera de vapor', critical: false },
]

export const CRITICAL_IDS = MACHINES.filter((m) => m.critical).map((m) => m.id)

export const getMachine = (id) => MACHINES.find((m) => m.id === id)

// Valor del filtro -> lista de ids
export function resolveMachineFilter(value) {
  if (value === 'criticas') return CRITICAL_IDS
  if (value === 'todas') return MACHINES.map((m) => m.id)
  return [value]
}

export const MACHINE_FILTER_OPTIONS = [
  { value: 'criticas', label: '4 máquinas críticas', hint: 'Atención requerida', group: 'Grupos' },
  { value: 'todas', label: 'Todas las máquinas', hint: '17 equipos', group: 'Grupos' },
  ...MACHINES.map((m) => ({ value: m.id, label: m.name, hint: m.type, group: 'Máquinas individuales' })),
]
