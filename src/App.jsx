import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/layout/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Predicciones from './pages/Predicciones.jsx'
import Proximamente from './pages/Proximamente.jsx'
import LoginPage from './pages/auth/LoginPage.jsx'
import { useUser } from './context/UserContext.jsx'

export default function App() {
  const { loggedIn, loading } = useUser()

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-neutral-50 text-sm text-ink-500">Cargando...</div>
  }

  if (!loggedIn) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/dashboard" replace />} />
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/predicciones" element={<Predicciones />} />
        <Route path="/mantenimiento" element={<Proximamente title="Planes de mantenimiento" />} />
        <Route path="/maquinas" element={<Proximamente title="Máquinas" />} />
        <Route path="/historial" element={<Proximamente title="Historial de Excel" />} />
        <Route path="/perfil" element={<Proximamente title="Perfil" />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}
