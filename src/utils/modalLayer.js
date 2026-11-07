// Pila de capas modales: garantiza que solo la capa superior responda a
// Escape y al focus trap cuando hay diálogos anidados (p. ej. seguimiento →
// faltan tareas → confirmación).
const layers = []

export function pushLayer(id) {
  layers.push(id)
  return () => {
    const index = layers.lastIndexOf(id)
    if (index !== -1) layers.splice(index, 1)
  }
}

export function isTopLayer(id) {
  return layers.length > 0 && layers[layers.length - 1] === id
}
