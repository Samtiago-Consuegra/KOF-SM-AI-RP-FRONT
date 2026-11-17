// @vitest-environment jsdom
import { useState } from 'react'
import { afterEach, beforeAll, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

import Popover from './Popover.jsx'
import Modal from './Modal.jsx'

beforeAll(() => {
  // jsdom no trae ResizeObserver (lo usa autoUpdate de Floating UI)
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} }
})
afterEach(cleanup)

function Menu() {
  const [open, setOpen] = useState(false)
  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      trigger={(props) => <button type="button" {...props}>Máquina</button>}
    >
      {({ close }) => (
        <button type="button" role="option" aria-selected="false" onClick={() => close()}>L1</button>
      )}
    </Popover>
  )
}

it('se monta en body, fuera del contenedor con overflow-hidden, y Escape lo cierra devolviendo el foco', async () => {
  render(<div data-testid="clip" style={{ overflow: 'hidden' }}><Menu /></div>)
  const trigger = screen.getByRole('button', { name: 'Máquina' })
  fireEvent.click(trigger)

  const panel = screen.getByRole('listbox')
  expect(panel.parentElement).toBe(document.body)
  expect(screen.getByTestId('clip').contains(panel)).toBe(false)
  expect(trigger.getAttribute('aria-expanded')).toBe('true')
  expect(trigger.getAttribute('aria-controls')).toBe(panel.id)

  fireEvent.keyDown(document.activeElement, { key: 'Escape' })
  await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull())
  expect(document.activeElement).toBe(trigger)
})

it('dentro de un modal, Escape cierra el menú sin cerrar el modal', async () => {
  const onClose = vi.fn()
  render(<Modal open onClose={onClose} title="Editar"><Menu /></Modal>)
  fireEvent.click(screen.getByRole('button', { name: 'Máquina' }))
  expect(screen.getByRole('listbox').className).toContain('z-popover-modal')

  fireEvent.keyDown(document.activeElement, { key: 'Escape' })
  await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull())
  expect(onClose).not.toHaveBeenCalled()
  expect(screen.getByRole('dialog', { name: 'Editar' })).toBeTruthy()
})
