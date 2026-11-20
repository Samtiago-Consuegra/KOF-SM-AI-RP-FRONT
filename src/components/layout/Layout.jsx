import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar.jsx'
import Sidebar from './Sidebar.jsx'
import AsistenteFab from '../asistente/AsistenteFab.jsx'
import { AsistenteProvider } from '../../context/AsistenteContext.jsx'

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <AsistenteProvider>
      <div className="min-h-full">
        <Navbar onMenu={() => setMenuOpen(true)} />
        <div className="flex">
          <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
          {/* Margen inferior: el botón flotante del asistente no tapa el final de la página. */}
          <main className="flex-1 min-w-0 p-4 pb-24 sm:p-6 sm:pb-24 lg:p-8 lg:pb-24">
            <Outlet />
          </main>
        </div>
        <AsistenteFab />
      </div>
    </AsistenteProvider>
  )
}
