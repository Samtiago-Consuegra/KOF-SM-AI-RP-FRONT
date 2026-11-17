import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import Avatar from '../ui/Avatar.jsx'
import Popover from '../ui/Popover.jsx'
import { useUser } from '../../context/UserContext.jsx'

export default function ProfileMenu() {
  const { user, logout } = useUser()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <Popover
        open={open}
        onOpenChange={setOpen}
        role="menu"
        label="Menú de perfil"
        placement="bottom-end"
        offset={12}
        maxHeight={null}
        className="w-72 rounded-2xl border border-neutral-200 bg-white shadow-xl p-2"
        trigger={(props) => (
          <button
            type="button"
            {...props}
            aria-label="Abrir menú de perfil"
            className="rounded-full ring-offset-2 hover:ring-2 hover:ring-primary-200 transition"
          >
            <Avatar user={user} />
          </button>
        )}
      >
        {({ close }) => (<>
          <div className="flex items-center gap-3 p-3">
            <Avatar user={user} size="lg" />
            <div className="min-w-0">
              <p className="font-semibold text-ink-900 truncate">{user.name}</p>
              <p className="text-xs text-ink-500">{user.role}</p>
              <p className="text-xs text-ink-400 truncate">{user.email}</p>
            </div>
          </div>
          <div className="h-px bg-neutral-200 my-1" />
          <button
            role="menuitem"
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-800 hover:bg-neutral-100 text-primary-600 hover:bg-primary-50"
            onClick={() => {
              logout()
              close(false)
              navigate('/login', { replace: true })
            }}
          >
            <LogOut className="size-4" /> Cerrar sesión
          </button>
        </>)}
      </Popover>
    </div>
  )
}
