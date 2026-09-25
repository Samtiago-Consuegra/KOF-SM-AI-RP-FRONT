import Logo from '../components/layout/Logo.jsx'
import { useUser } from '../context/UserContext.jsx'

// Pantalla temporal: el login real se conectará al backend en otra etapa
export default function SesionCerrada() {
  const { login } = useUser()
  return (
    <div className="min-h-full grid place-items-center p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white border border-neutral-200 p-8 text-center">
        <div className="flex justify-center"><Logo /></div>
        <h1 className="mt-6 text-xl font-bold text-ink-900">Cerraste sesión</h1>
        <p className="mt-1 text-sm text-ink-500">Vuelve a entrar para seguir monitoreando la línea.</p>
        <button onClick={login} className="mt-6 w-full rounded-xl bg-primary-500 hover:bg-primary-600 text-white py-2.5 text-sm font-semibold">
          Iniciar sesión
        </button>
      </div>
    </div>
  )
}
