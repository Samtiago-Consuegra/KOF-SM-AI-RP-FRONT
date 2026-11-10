import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { apiGet, apiUpload, clearApiCache } from './client.js'

function jsonResponse(payload) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('client.js: aviso de lentitud y caché', () => {
  let dispatchEvent

  beforeEach(() => {
    vi.useFakeTimers()
    // Vitest corre en entorno node: simulamos solo lo que client.js necesita.
    dispatchEvent = vi.fn()
    vi.stubGlobal('window', { dispatchEvent })
  })

  afterEach(() => {
    clearApiCache()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('apiUpload no avisa lentitud aunque tarde más de 4 s y clearApiCache() fuerza un GET nuevo', async () => {
    let releaseUpload
    let uploadRequested = false

    const fetchMock = vi.fn((input) => {
      const url = String(input)
      if (url.includes('/upload')) {
        uploadRequested = true
        return new Promise((resolve) => {
          releaseUpload = () => resolve(jsonResponse({ ok: true }))
        })
      }
      return Promise.resolve(jsonResponse([{ machine: 'Llenadora' }]))
    })
    vi.stubGlobal('fetch', fetchMock)

    const upload = apiUpload('/upload', new FormData())
    expect(uploadRequested).toBe(true)

    // Pasados los 4 s la subida sigue pendiente: no debe salir kof:slow-api.
    await vi.advanceTimersByTimeAsync(5000)
    const emitted = dispatchEvent.mock.calls.map(([event]) => event?.type)
    expect(emitted).not.toContain('kof:slow-api')

    releaseUpload()
    await upload
    expect(fetchMock).toHaveBeenCalledTimes(1)

    // Dos GET seguidos: el segundo sale de la caché.
    await apiGet('/machines')
    await apiGet('/machines')
    expect(fetchMock).toHaveBeenCalledTimes(2)

    // clearApiCache() obliga a repetir la petición.
    clearApiCache()
    await apiGet('/machines')
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })
})
