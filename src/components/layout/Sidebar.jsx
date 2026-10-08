import { NavLink } from 'react-router-dom'
import { Activity, CalendarCog, FileSpreadsheet, LayoutDashboard, LogOut, Factory, UserRound, X } from 'lucide-react'
import Avatar from '../ui/Avatar.jsx'
import Logo from './Logo.jsx'
import { useUser } from '../../context/UserContext.jsx'
import { useMachines } from '../../hooks/useMachines.js'

const ITEMS = [
  { to: '/dashboard', label: 'Dashboard (EDA)', icon: LayoutDashboard },
  { to: '/predicciones', label: 'Predicciones de falla', icon: Activity },
  { to: '/mantenimiento', label: 'Planes de mantenimiento', icon: CalendarCog },
  { to: '/maquinas', label: 'Máquinas', icon: Factory, countBadge: true },
  { to: '/historial', label: 'Historial de Excel', icon: FileSpreadsheet },
  { to: '/perfil', label: 'Perfil', icon: UserRound },
]

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useUser()
  const { machines } = useMachines()

  return (
    <>
      {/* Fondo en móvil */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-ink-900/40 lg:hidden transition-opacity ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        aria-hidden="true"
      />
      <aside
        className={`fixed z-50 inset-y-0 left-0 w-72 bg-white border-r border-neutral-200 flex flex-col transition-transform
          lg:sticky lg:top-16 lg:z-10 lg:h-[calc(100vh-4rem)] lg:w-64 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
        aria-label="Navegación principal"
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-neutral-200 lg:hidden">
          <Logo />
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-neutral-100" aria-label="Cerrar menú"><X className="size-5" /></button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          <p className="px-3 pt-2 pb-2 text-xs font-semibold text-ink-400">Operaciones y monitoreo</p>
          <ul className="space-y-1">
            {ITEMS.map(({ to, label, icon: Icon, countBadge }) => {
              const badge = countBadge && machines.length ? machines.length : 0
              return (
                <li key={to}>
                  <NavLink
                    to={to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                        isActive
                          ? 'bg-primary-50 text-primary-700 font-semibold before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-r before:bg-primary-500'
                          : 'text-ink-700 hover:bg-neutral-100'
                      }`
                    }
                  >
                    <Icon className="size-[18px]" />
                    <span className="flex-1">{label}</span>
                    {badge > 0 && <span className="rounded-full bg-ink-50 text-ink-700 text-xs font-semibold px-2 py-0.5">{badge}</span>}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="p-3">
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
            <div className="flex items-center gap-3">
              <Avatar user={user} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink-900 truncate">{user.name}</p>
                <p className="text-xs text-primary-600 font-medium">{user.role}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-neutral-200 hover:border-primary-200 hover:text-primary-600 px-3 py-2 text-sm font-medium text-ink-700 transition-colors"
            >
              <LogOut className="size-4" /> Cerrar sesión
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
