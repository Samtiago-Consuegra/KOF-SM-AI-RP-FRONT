// Cada catálogo viaja en su propio chunk: solo se descarga al abrir el asistente en esa vista.
const CARGADORES = {
  dashboard: () => import('./dashboard.js'),
  predicciones: () => import('./predicciones.js'),
  mantenimiento: () => import('./mantenimiento.js'),
  cumplimiento: () => import('./cumplimiento.js'),
  historiaClinica: () => import('./historiaClinica.js'),
  historialExcel: () => import('./historialExcel.js'),
}

export const VISTAS_CATALOGO = Object.keys(CARGADORES)

const cargados = new Map()

/** Catálogo de la vista ({ vista, titulo, secciones, preguntas }); se memoriza la promesa. */
export function cargarCatalogo(vista) {
  if (!CARGADORES[vista]) return Promise.resolve(null)
  if (!cargados.has(vista)) {
    const p = CARGADORES[vista]().then((m) => m.default)
    p.catch(() => cargados.delete(vista))
    cargados.set(vista, p)
  }
  return cargados.get(vista)
}
