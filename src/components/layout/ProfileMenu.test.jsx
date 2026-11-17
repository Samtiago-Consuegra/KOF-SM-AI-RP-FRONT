// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ProfileMenu from './ProfileMenu.jsx'

vi.mock('../../context/UserContext.jsx', () => ({
  useUser: () => ({
    user: { name: 'Ana Pérez', role: 'Admin', email: 'ana@kof.com', photo: null },
    logout: vi.fn(),
  }),
}))

describe('ProfileMenu', () => {
  it('solo muestra el encabezado y "Cerrar sesión"', async () => {
    render(<MemoryRouter><ProfileMenu /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menú de perfil' }))
    expect(await screen.findByText('Ana Pérez')).toBeTruthy()
    expect(screen.getByText('ana@kof.com')).toBeTruthy()
    expect(screen.getByText('Cerrar sesión')).toBeTruthy()
    expect(screen.queryByText('Cambiar foto')).toBeNull()
    expect(screen.queryByText('Ver perfil')).toBeNull()
  })
})
