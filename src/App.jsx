import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/layout/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Predicciones from './pages/Predicciones.jsx'
import Proximamente from './pages/Proximamente.jsx'
import SesionCerrada from './pages/SesionCerrada.jsx'
import { useUser } from './context/UserContext.jsx'

export default function App() {
  const { loggedIn } = useUser()
  if (!loggedIn) return <SesionCerrada />

  return (
    <Routes>
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
