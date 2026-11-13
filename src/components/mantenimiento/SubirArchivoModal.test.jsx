// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'

import SubirArchivoModal from './SubirArchivoModal.jsx'

vi.mock('../../services/mantenimientoService.js', async () => {
  const { FileSpreadsheet } = await import('lucide-react')
  return {
    ARCHIVOS: [{ clave: 'avisos', tipo: 'Avisos de daño', desc: 'Avisos de daño SAP', Icon: FileSpreadsheet }],
    subirArchivo: vi.fn(),
  }
})

afterEach(cleanup)

it('se monta como hijo directo de document.body y Escape llama onClose', () => {
  const onClose = vi.fn()
  const { container } = render(<SubirArchivoModal open onClose={onClose} />)

  const dialog = screen.getByRole('dialog')
  expect(container.contains(dialog)).toBe(false)
  // La raíz del modal (fondo + panel) cuelga directamente de body, fuera de la página.
  expect(dialog.parentElement.parentElement).toBe(document.body)
  expect(document.body.style.overflow).toBe('hidden')
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cerrar' }))

  fireEvent.keyDown(document, { key: 'Escape' })
  expect(onClose).toHaveBeenCalledTimes(1)
})
