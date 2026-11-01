import { CalendarDays, Menu } from 'lucide-react'
import Logo from './Logo.jsx'
import ProfileMenu from './ProfileMenu.jsx'
import { fmtDateLong } from '../../utils/format.js'
import cocaCola from '../../assets/coca-cola.svg'
import femsa from '../../assets/femsa.svg'

export default function Navbar({ onMenu }) {
  const now = new Date()
  const today = fmtDateLong(now)
  const short = now.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur border-b border-neutral-200 relative">
      <div className="h-full flex items-center gap-3 px-4 lg:px-6">
        <button type="button" onClick={onMenu} className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-neutral-100" aria-label="Abrir menú">
          <Menu className="size-5" />
        </button>
        <div className="lg:w-60 shrink-0"><Logo /></div>

        <div className="pointer-events-none select-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden lg:flex items-center">
          <img src={cocaCola} alt="Coca-Cola" className="h-12 w-auto" />
          <img src={femsa} alt="FEMSA" className="h-12 w-auto" />
        </div>

        <div className="ml-auto flex items-center gap-4">
          <p className="flex items-center gap-2 rounded-full bg-neutral-100 px-3 sm:px-3.5 py-1.5 text-xs sm:text-sm text-ink-700">
            <CalendarDays className="size-4 text-primary-500" />
            <time dateTime={now.toISOString().slice(0, 10)}>
              <span className="hidden sm:inline-block first-letter:uppercase">{today}</span>
              <span className="sm:hidden">{short}</span>
            </time>
          </p>
          <ProfileMenu />
        </div>
      </div>
    </header>
  )
}
