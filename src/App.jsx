import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/layout/Layout.jsx'
import Logo from './components/layout/Logo.jsx'
import ServerWakeBanner from './components/ui/ServerWakeBanner.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Predicciones from './pages/Predicciones.jsx'
import Cumplimiento from './pages/Cumplimiento.jsx'
import HistoriaClinica from './pages/HistoriaClinica.jsx'
import Mantenimiento from './pages/Mantenimiento.jsx'
import Proximamente from './pages/Proximamente.jsx'
import LoginPage from './pages/auth/LoginPage.jsx'
import { useUser } from './context/UserContext.jsx'

function SplashScreen() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-6 bg-neutral-50 px-6"
      role="status"
      aria-live="polite"
    >
      <div className="kof-splash-pulse rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-neutral-200">
        <Logo />
      </div>
      <div className="h-1.5 w-44 overflow-hidden rounded-full bg-neutral-200" aria-hidden="true">
        <div className="kof-splash-bar h-full w-1/2 rounded-full bg-tertiary-500" />
      </div>
      <p className="text-sm font-medium text-ink-500">Preparando tu panel…</p>
    </div>
  )
}

export default function App() {
  const { loggedIn, loading } = useUser()

  let content

  if (loading) {
    content = <SplashScreen />
  } else if (!loggedIn) {
    content = (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  } else {
    content = (
      <Routes>
        <Route path="/login" element={<Navigate to="/dashboard" replace />} />
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/predicciones" element={<Predicciones />} />
          <Route path="/cumplimiento" element={<Cumplimiento />} />
          <Route path="/historia-clinica" element={<HistoriaClinica />} />
          <Route path="/mantenimiento" element={<Mantenimiento />} />
          <Route path="/historial" element={<Proximamente title="Historial de Excel" />} />
          <Route path="/perfil" element={<Proximamente title="Perfil" />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    )
  }

  return (
    <>
      <ServerWakeBanner />
      {content}
    </>
  )
}
