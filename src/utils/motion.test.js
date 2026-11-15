import { afterEach, describe, expect, it, vi } from 'vitest'
import { chartAnimation, prefersReducedMotion, staggerDelay, staggerStyle } from './motion.js'

const mockReducedMotion = (matches) =>
  vi.stubGlobal('window', { matchMedia: () => ({ matches }) })

afterEach(() => vi.unstubAllGlobals())

describe('motion helpers', () => {
  it('el retraso en cascada crece por elemento y respeta la base', () => {
    const delays = [0, 1, 2, 3].map((i) => staggerDelay(i, 50, 0, false))
    expect(delays).toEqual([0, 50, 100, 150])
    expect(staggerDelay(2, 40, 120, false)).toBe(200)
  })

  it('con prefers-reduced-motion el retraso es 0 y las gráficas no animan', () => {
    mockReducedMotion(true)
    expect(prefersReducedMotion()).toBe(true)
    expect(staggerDelay(3)).toBe(0)
    expect(staggerStyle(5, 50, 120)).toEqual({ animationDelay: '0ms' })
    expect(chartAnimation().isAnimationActive).toBe(false)
  })

  it('sin movimiento reducido las gráficas animan entre 600 y 800 ms con ease-out', () => {
    mockReducedMotion(false)
    const anim = chartAnimation()
    expect(anim.isAnimationActive).toBe(true)
    expect(anim.animationDuration).toBeGreaterThanOrEqual(600)
    expect(anim.animationDuration).toBeLessThanOrEqual(800)
    expect(anim.animationEasing).toBe('ease-out')
    expect(staggerDelay(1)).toBe(50)
  })
})
