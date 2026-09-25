import { createContext, useContext, useEffect, useState } from 'react'

const UserContext = createContext(null)

const DEFAULT_USER = {
  name: 'Ing. Carlos Mendoza',
  role: 'Supervisor de Planta',
  email: 'carlos.mendoza@kof.com.mx',
  photo: null, // se reemplaza cuando el usuario sube una foto
}

export function UserProvider({ children }) {
  const [user, setUser] = useState(DEFAULT_USER)
  const [loggedIn, setLoggedIn] = useState(true)

  // Libera la URL temporal de la foto anterior al cambiarla
  useEffect(() => () => { if (user.photo) URL.revokeObjectURL(user.photo) }, [user.photo])

  const updatePhoto = (file) => {
    if (!file || !file.type.startsWith('image/')) return false
    setUser((u) => ({ ...u, photo: URL.createObjectURL(file) }))
    return true
  }
  const removePhoto = () => setUser((u) => ({ ...u, photo: null }))
  const logout = () => setLoggedIn(false)
  const login = () => setLoggedIn(true)

  return (
    <UserContext.Provider value={{ user, loggedIn, updatePhoto, removePhoto, logout, login }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => useContext(UserContext)
