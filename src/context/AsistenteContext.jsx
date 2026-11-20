import { createContext, useContext, useEffect, useState } from 'react'

// Lo que cada vista ya cargó (filtros y datos), por vista: el asistente responde con esto
// antes de pedir nada. Es un objeto mutable (no estado) para no re-renderizar al publicar.
const AsistenteContext = createContext(null)

export function AsistenteProvider({ children }) {
  // Un objeto por montaje del Layout: sobrevive a los cambios de ruta.
  const [datos] = useState(() => ({}))
  return <AsistenteContext.Provider value={datos}>{children}</AsistenteContext.Provider>
}

/** La vista (o un componente suyo) publica lo que ya tiene en pantalla. Se fusiona por vista. */
export function usePublicarAsistente(vista, datos) {
  const store = useContext(AsistenteContext)
  useEffect(() => {
    if (store) store[vista] = { ...store[vista], ...datos }
  })
}

/** Datos publicados de la vista, o {} si la vista aún no ha publicado. */
export function useLeerAsistente() {
  const store = useContext(AsistenteContext)
  return (vista) => store?.[vista] ?? {}
}
