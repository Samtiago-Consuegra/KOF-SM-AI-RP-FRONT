import { useMemo, useState } from 'react'
import { Activity, Eye, EyeOff, Loader2 } from 'lucide-react'
import { onGetMe, onGoogleLogin, onRegister } from '../../../services/authService.js'
import { useUser } from '../../../context/UserContext.jsx'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}

function strength(pw) {
  if (!pw) return 0
  let s = 0
  if (pw.length >= 8) s++
  if (/[A-Z]/.test(pw)) s++
  if (/[0-9]/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  return s
}

export default function RegisterForm({ onSwitch }) {
  const { login } = useUser()
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '', terms: false })
  const [show, setShow] = useState({ p: false, c: false })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const s = strength(form.password)
  const width = s === 0 ? '0%' : s === 1 ? '25%' : s === 2 ? '50%' : s === 3 ? '75%' : '100%'
  const color = s <= 2 ? 'bg-primary-500' : 'bg-tertiary-500'

  const validate = () => {
    const e = {}
    if (form.fullName.trim().length < 3) e.fullName = 'Ingresa tu nombre completo'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Ingresa un correo electrónico válido'
    if (form.password.length < 8) e.password = 'La contraseña debe tener al menos 8 caracteres'
    if (form.confirm !== form.password) e.confirm = 'Las contraseñas no coinciden'
    if (!form.terms) e.terms = 'Debes aceptar los términos y condiciones'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async (ev) => {
    ev.preventDefault()
    if (!validate()) return
    setLoading(true)
    setServerError('')
    try {
      await onRegister({ fullName: form.fullName, email: form.email, password: form.password })
      const me = await onGetMe()
      login(me)
    } catch (err) {
      setServerError(err?.message || 'Error al registrar usuario')
    } finally {
      setLoading(false)
    }
  }

  const memo = useMemo(() => ({ width, color }), [width, color])

  return (
    <div className="flex h-full w-full flex-col">
      <div className="mb-3 flex items-center justify-center gap-2.5 pt-1 lg:pt-1.5">
        <span className="grid size-10 place-items-center rounded-xl bg-primary-500 shadow-sm shadow-ink-900/20">
          <Activity className="size-5 text-white" />
        </span>
        <span className="text-base font-semibold text-ink-900">KOF-SMART Maintenance AI</span>
      </div>

      <div className="mb-4 text-center">
        <h1 className="text-3xl font-bold text-ink-900 sm:text-4xl">Crea tu cuenta</h1>
        <p className="mt-1.5 text-sm text-ink-500">Completa tus datos para registrarte</p>
      </div>

      <div className="flex flex-1 flex-col justify-center">
        <form onSubmit={submit} className="mx-auto w-full max-w-md space-y-4">
          <div>
            <label htmlFor="reg-name" className="mb-1 block text-xs font-medium text-ink-500">
              Nombre completo
            </label>
            <input
              id="reg-name"
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              className="w-full border-0 border-b border-neutral-300 bg-transparent px-0 py-1.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-primary-500 focus:outline-none focus:ring-0"
              placeholder="Tu nombre y apellidos"
              autoComplete="name"
            />
            {errors.fullName && <p className="mt-1 text-xs text-primary-600">{errors.fullName}</p>}
          </div>

          <div>
            <label htmlFor="reg-email" className="mb-1 block text-xs font-medium text-ink-500">
              Correo electrónico
            </label>
            <input
              id="reg-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full border-0 border-b border-neutral-300 bg-transparent px-0 py-1.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-primary-500 focus:outline-none focus:ring-0"
              placeholder="nombre@empresa.com"
              autoComplete="email"
            />
            {errors.email && <p className="mt-1 text-xs text-primary-600">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="reg-pass" className="mb-1 block text-xs font-medium text-ink-500">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="reg-pass"
                type={show.p ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="w-full border-0 border-b border-neutral-300 bg-transparent px-0 py-1.5 pr-9 text-sm text-ink-900 placeholder:text-ink-400 focus:border-primary-500 focus:outline-none focus:ring-0"
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
              />
              <button
                type="button"
                aria-label={show.p ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                onClick={() => setShow((s) => ({ ...s, p: !s.p }))}
                className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink-400 transition-colors hover:text-ink-700 focus-visible:ring-2 focus-visible:ring-tertiary-400"
              >
                {show.p ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-neutral-200">
              <div className={`h-full transition-all ${memo.color}`} style={{ width: memo.width }} />
            </div>
            {errors.password && <p className="mt-1 text-xs text-primary-600">{errors.password}</p>}
          </div>

          <div>
            <label htmlFor="reg-conf" className="mb-1 block text-xs font-medium text-ink-500">
              Confirmar contraseña
            </label>
            <div className="relative">
              <input
                id="reg-conf"
                type={show.c ? 'text' : 'password'}
                value={form.confirm}
                onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
                className="w-full border-0 border-b border-neutral-300 bg-transparent px-0 py-1.5 pr-9 text-sm text-ink-900 placeholder:text-ink-400 focus:border-primary-500 focus:outline-none focus:ring-0"
                placeholder="Repite tu contraseña"
                autoComplete="new-password"
              />
              <button
                type="button"
                aria-label={show.c ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                onClick={() => setShow((s) => ({ ...s, c: !s.c }))}
                className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink-400 transition-colors hover:text-ink-700 focus-visible:ring-2 focus-visible:ring-tertiary-400"
              >
                {show.c ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.confirm && <p className="mt-1 text-xs text-primary-600">{errors.confirm}</p>}
          </div>

          <label className="flex items-start gap-2 text-sm text-ink-600">
            <input
              type="checkbox"
              checked={form.terms}
              onChange={(e) => setForm((f) => ({ ...f, terms: e.target.checked }))}
              className="mt-0.5 size-4 rounded border-neutral-300 text-primary-500 focus:ring-tertiary-400"
            />
            Acepto los términos y condiciones
          </label>
          {errors.terms && <p className="-mt-2 text-xs text-primary-600">{errors.terms}</p>}

          {serverError && <p className="text-center text-xs text-primary-600">{serverError}</p>}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-ink-900 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-500 active:bg-primary-600 disabled:opacity-70"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            Crear cuenta
          </button>

          <button
            type="button"
            onClick={() => onGoogleLogin()}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-neutral-100 px-6 py-2.5 text-sm font-semibold text-ink-900 transition-colors hover:bg-neutral-200"
          >
            <GoogleIcon />
            Registrarse con Google
          </button>
        </form>
      </div>

      <p className="mt-4 pb-1 text-center text-sm text-ink-500 lg:pb-1.5">
        ¿Ya tienes una cuenta?{' '}
        <button type="button" onClick={onSwitch} className="font-bold text-ink-900 transition-colors hover:text-primary-500">
          Inicia sesión
        </button>
      </p>
    </div>
  )
}
