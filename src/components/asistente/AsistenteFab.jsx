import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Bot, X } from 'lucide-react'

// El panel (y su catálogo) solo se descarga al abrir el asistente por primera vez.
const AsistentePanel = lazy(() => import('./AsistentePanel.jsx'))

const VISTAS = {
  '/dashboard': { vista: 'dashboard', titulo: 'Dashboard' },
  '/predicciones': { vista: 'predicciones', titulo: 'Predicciones de falla' },
  '/mantenimiento': { vista: 'mantenimiento', titulo: 'Planes de mantenimiento' },
  '/cumplimiento': { vista: 'cumplimiento', titulo: 'Cumplimiento' },
  '/historia-clinica': { vista: 'historiaClinica', titulo: 'Historia clínica' },
  '/historial': { vista: 'historialExcel', titulo: 'Historial de Excel' },
}
const SIN_VISTA = { vista: null, titulo: 'esta página' }

export default function AsistenteFab() {
  const { pathname } = useLocation()
  const { vista, titulo } = VISTAS[pathname] ?? SIN_VISTA
  const [estado, setEstado] = useState('cerrado') // cerrado | abierto | cerrando
  // La conversación vive aquí (en el Layout): se conserva al cambiar de vista y al cerrar el panel.
  const [mensajes, setMensajes] = useState([])
  const fabRef = useRef(null)
  const abierto = estado === 'abierto'

  const cerrar = useCallback(() => {
    // Si el foco estaba en el panel, vuelve al botón que lo abrió.
    if (document.getElementById('asistente-panel')?.contains(document.activeElement)) fabRef.current?.focus()
    setEstado((e) => (e === 'abierto' ? 'cerrando' : e))
  }, [])
  const alTerminarCierre = useCallback(() => setEstado((e) => (e === 'cerrando' ? 'cerrado' : e)), [])

  // Al llegar a otra vista con una conversación en curso, se marca el cambio en el hilo.
  const vistaPrevia = useRef(vista)
  useEffect(() => {
    if (vistaPrevia.current === vista) return
    vistaPrevia.current = vista
    setMensajes((m) => (m.length ? [...m, { id: `s${Date.now()}`, rol: 'sistema', texto: `Ahora estás en ${titulo}` }] : m))
  }, [vista, titulo])

  return (
    <>
      <button
        ref={fabRef}
        type="button"
        onClick={() => (abierto ? cerrar() : setEstado('abierto'))}
        aria-label={abierto ? 'Cerrar asistente virtual' : 'Abrir asistente virtual'}
        aria-expanded={abierto}
        aria-controls="asistente-panel"
        className="asis-fab fixed z-sticky grid size-12 place-items-center rounded-full bg-primary-500 text-white shadow-lg transition-[background-color,transform] duration-150 hover:bg-primary-600 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400 focus-visible:ring-offset-2"
      >
        <Bot aria-hidden="true" data-on={!abierto} className="asis-fab-icon size-5 [grid-area:1/1]" />
        <X aria-hidden="true" data-on={abierto} className="asis-fab-icon size-5 [grid-area:1/1]" />
      </button>
      {estado !== 'cerrado' && (
        <Suspense fallback={null}>
          <AsistentePanel
            abierto={abierto}
            vista={vista}
            titulo={titulo}
            mensajes={mensajes}
            setMensajes={setMensajes}
            onClose={cerrar}
            onCerrado={alTerminarCierre}
          />
        </Suspense>
      )}
    </>
  )
}
