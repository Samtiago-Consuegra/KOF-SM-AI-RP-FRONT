import { apiGet } from './client.js'

export const CRITICAL_GROUP = 'criticas'
export const ALL_GROUP = 'todas'

// El catálogo cambia muy rara vez (solo al subir un Excel nuevo), así que se resuelve
// una vez por sesión y se comparte entre el Sidebar y el Dashboard.
let pending = null

export function fetchMachines() {
  if (!pending) {
    pending = apiGet('/machines').catch((err) => {
      pending = null // un fallo no debe quedar cacheado
      throw err
    })
  }
  return pending
}

/** Se llama tras una subida: por si el archivo trae máquinas que aún no estaban. */
export function invalidateMachines() {
  pending = null
}

const nf = (n) => Number(n ?? 0).toLocaleString('es-CO')

/**
 * Opciones del filtro. Los valores son los que ya entiende `_parse_machines`
 * del backend: 'criticas' | 'todas' | <nombre real de la máquina>.
 */
export function machineOptions(machines) {
  const critical = machines.filter((m) => m.critical)
  return [
    { value: CRITICAL_GROUP, label: `${critical.length} máquinas críticas`, hint: 'Atención requerida', group: 'Grupos' },
    { value: ALL_GROUP, label: 'Todas las máquinas', hint: `${machines.length} equipos`, group: 'Grupos' },
    ...machines.map((m) => ({
      value: m.machine,
      label: m.machine,
      hint: `${m.critical ? 'Crítico · ' : ''}${nf(m.events_count)} paros`,
      group: 'Máquinas individuales',
    })),
  ]
}

/** Solo críticas: la matriz predictiva solo cubre esos equipos. */
export function criticalMachineOptions(machines) {
  const critical = machines.filter((m) => m.critical)
  return [
    { value: CRITICAL_GROUP, label: `${critical.length} máquinas críticas`, hint: 'Atención requerida', group: 'Grupo' },
    ...critical.map((m) => ({
      value: m.machine,
      label: m.machine,
      hint: `${nf(m.events_count)} paros`,
      group: 'Críticas por separado',
    })),
  ]
}

/** Valor del filtro -> lista de nombres de máquina. */
export function resolveMachineNames(value, machines) {
  if (value === CRITICAL_GROUP) return machines.filter((m) => m.critical).map((m) => m.machine)
  if (value === ALL_GROUP) return machines.map((m) => m.machine)
  return value ? [value] : []
}

export const findMachine = (name, machines) => machines.find((m) => m.machine === name)