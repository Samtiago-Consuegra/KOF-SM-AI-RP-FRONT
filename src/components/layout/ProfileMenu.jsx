import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, LogOut, Trash2, UserRound } from 'lucide-react'
import Avatar from '../ui/Avatar.jsx'
import { useUser } from '../../context/UserContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'

export default function ProfileMenu() {
  const { user, updatePhoto, removePhoto, logout } = useUser()
  const toast = useToast()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const fileRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    const esc = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc) }
  }, [open])

  const onFile = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (updatePhoto(file)) toast('Foto de perfil actualizada')
    else toast('Elige una imagen (JPG, PNG o WebP).', 'error')
    setOpen(false)
  }

  const item = 'w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-800 hover:bg-neutral-100'

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Abrir menú de perfil"
        className="rounded-full ring-offset-2 hover:ring-2 hover:ring-primary-200 transition"
      >
        <Avatar user={user} />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 mt-3 w-72 rounded-2xl border border-neutral-200 bg-white shadow-xl p-2 z-40">
          <div className="flex items-center gap-3 p-3">
            <div className="relative">
              <Avatar user={user} size="lg" />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 size-7 rounded-full bg-primary-500 text-white grid place-items-center ring-2 ring-white hover:bg-primary-600"
                aria-label="Cambiar foto de perfil"
              >
                <Camera className="size-3.5" />
              </button>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-ink-900 truncate">{user.name}</p>
              <p className="text-xs text-ink-500">{user.role}</p>
              <p className="text-xs text-ink-400 truncate">{user.email}</p>
            </div>
          </div>
          <div className="h-px bg-neutral-200 my-1" />
          <button role="menuitem" className={item} onClick={() => fileRef.current?.click()}>
            <Camera className="size-4 text-ink-500" /> Cambiar foto
          </button>
          {user.photo && (
            <button role="menuitem" className={item} onClick={() => { removePhoto(); toast('Foto de perfil eliminada'); setOpen(false) }}>
              <Trash2 className="size-4 text-ink-500" /> Quitar foto
            </button>
          )}
          <button role="menuitem" className={item} onClick={() => { navigate('/perfil'); setOpen(false) }}>
            <UserRound className="size-4 text-ink-500" /> Ver perfil
          </button>
          <div className="h-px bg-neutral-200 my-1" />
          <button role="menuitem" className={`${item} text-primary-600 hover:bg-primary-50`} onClick={logout}>
            <LogOut className="size-4" /> Cerrar sesión
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
        </div>
      )}
    </div>
  )
}
