// Helpers de animación compartidos por Dashboard y Predicciones.

export function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Retraso en cascada: con movimiento reducido es 0 (el CSS global no anula animation-delay).
export function staggerDelay(index, step = 50, base = 0, reduced = prefersReducedMotion()) {
  return reduced ? 0 : base + index * step
}

export const staggerStyle = (index, step, base) => ({ animationDelay: `${staggerDelay(index, step, base)}ms` })

// Animación nativa de Recharts (Bar, Line, Scatter).
export function chartAnimation(reduced = prefersReducedMotion()) {
  return { isAnimationActive: !reduced, animationDuration: 700, animationEasing: 'ease-out' }
}
