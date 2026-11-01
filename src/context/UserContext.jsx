import { createContext, useContext, useEffect, useState } from 'react'
import { clearAuthToken, getAuthToken } from '../api/client'
import { onGetMe } from '../services/authService'

const UserContext = createContext(null)

export function UserProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loggedIn, setLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false
    const init = async () => {
      const token = getAuthToken()
      if (!token) {
        if (!ignore) {
          setUser(null)
          setLoggedIn(false)
          setLoading(false)
        }
        return
      }
      try {
        const me = await onGetMe()
        if (ignore) return
        setUser({
          id: me.id,
          name: me.full_name || me.email,
          email: me.email,
          role: me.role || 'Usuario',
          photo: null,
        })
        setLoggedIn(true)
      } catch {
        if (ignore) return
        clearAuthToken()
        setUser(null)
        setLoggedIn(false)
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    init()
    return () => {
      ignore = true
    }
  }, [])

  useEffect(
    () => () => {
      if (user?.photo) URL.revokeObjectURL(user.photo)
    },
    [user?.photo]
  )

  const updatePhoto = (file) => {
    if (!file || !file.type.startsWith('image/')) return false
    setUser((u) => (u ? { ...u, photo: URL.createObjectURL(file) } : u))
    return true
  }
  const removePhoto = () => setUser((u) => (u ? { ...u, photo: null } : u))
  const logout = () => {
    clearAuthToken()
    setUser(null)
    setLoggedIn(false)
  }
  const login = (userData) => {
    if (userData) {
      setUser({
        id: userData.id,
        name: userData.full_name || userData.name || userData.email,
        email: userData.email,
        role: userData.role || 'Usuario',
        photo: null,
      })
    }
    setLoggedIn(true)
  }
  const setAuthUser = (userData) => login(userData)

  return (
    <UserContext.Provider value={{ user, loggedIn, loading, updatePhoto, removePhoto, logout, login, setAuthUser }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => useContext(UserContext)
