/**
 * Servicio de autenticación conectado al backend FastAPI.
 */
import { apiGet, apiPost, clearAuthToken, setAuthToken } from '../api/client'

export async function onLogin(credentials) {
  const { email, password, remember = true } = credentials || {}
  const res = await apiPost('/auth/login', { email, password }, { auth: false })
  if (res?.access_token) {
    setAuthToken(res.access_token, remember)
  }
  return res
}

export async function onRegister(data) {
  const { fullName, full_name, email, password } = data || {}
  const payload = {
    full_name: fullName || full_name || email?.split('@')[0] || 'Usuario',
    email,
    password,
  }
  const res = await apiPost('/auth/register', payload, { auth: false })
  if (res?.access_token) {
    setAuthToken(res.access_token, true)
  }
  return res
}

export async function onGetMe() {
  return apiGet('/auth/me')
}

export async function onLogout() {
  clearAuthToken()
}

export async function onGoogleLogin() {
  // Pendiente de integración OAuth
  throw new Error('Inicio de sesión con Google no disponible aún')
}
