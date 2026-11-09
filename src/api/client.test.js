import { afterEach, describe, expect, it, vi } from 'vitest'

import { apiGet, apiUpload } from './client.js'

describe('caché GET de client.js', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('reutiliza una respuesta dentro del TTL y la descarta tras un upload', async () => {
    const fetchMock = vi.fn(async (url) => {
      const payload = String(url).includes('/upload') ? { ok: true } : [{ machine: 'Llenadora' }]
      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    const first = await apiGet('/machines')
    const second = await apiGet('/machines')

    expect(first).toEqual(second)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    await apiUpload('/upload', new FormData())
    expect(fetchMock).toHaveBeenCalledTimes(2)

    await apiGet('/machines')
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })
})
