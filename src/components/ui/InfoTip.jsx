import { HelpCircle } from 'lucide-react'

/**
 * Tooltip de ayuda que aparece al pasar el cursor (o al enfocar por teclado) sobre
 * el signo de interrogación. No es un botón: solo una pista visual contextual.
 */
export default function InfoTip({ title = 'Más información', children, className = '' }) {
  return (
    <span className={`relative inline-flex align-middle group ${className}`}>
      <span
        tabIndex={0}
        aria-label={title}
        className="inline-grid place-items-center cursor-help rounded-full text-ink-400 transition-colors hover:text-ink-700 focus:outline-none"
      >
        <HelpCircle className="size-3.5" aria-hidden="true" />
      </span>
      <span
        role="tooltip"
        className="pointer-events-none invisible absolute left-1/2 top-full z-30 mt-2 w-72 -translate-x-1/2 rounded-xl border border-neutral-200 bg-white p-3 text-xs leading-relaxed text-ink-600 opacity-0 shadow-lg transition-opacity whitespace-normal break-words group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
      >
        <span className="mb-1 block font-semibold text-ink-900">{title}</span>
        {children}
      </span>
    </span>
  )
}