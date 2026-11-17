import { HelpCircle } from 'lucide-react'
import Tooltip from '../cumplimiento/Tooltip.jsx'

/**
 * Tooltip de ayuda que aparece al pasar el cursor (o al enfocar por teclado) sobre
 * el signo de interrogación. No es un botón: solo una pista visual contextual.
 * Se portaliza (Tooltip) para que ninguna tarjeta o tabla lo recorte.
 */
export default function InfoTip({ title = 'Más información', children, className = '', placement = 'bottom' }) {
  return (
    <Tooltip
      placement={placement}
      className={`align-middle ${className}`}
      content={
        <span className="block whitespace-normal break-words">
          <span className="mb-1 block font-semibold text-ink-900">{title}</span>
          {children}
        </span>
      }
    >
      <span
        tabIndex={0}
        aria-label={title}
        className="inline-grid place-items-center cursor-help rounded-full text-ink-400 transition-colors hover:text-ink-700 focus:outline-none"
      >
        <HelpCircle className="size-3.5" aria-hidden="true" />
      </span>
    </Tooltip>
  )
}
