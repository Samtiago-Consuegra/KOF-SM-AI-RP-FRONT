/**
 * Indicador discreto de que el motor está recalculando. No bloquea la interfaz:
 * es un pill en línea con un punto teal que pulsa. Con prefers-reduced-motion el
 * pulso y la entrada se desactivan y queda el estado estático.
 */
const ESTILOS = `
@keyframes kof-badge-in {
  from { opacity: 0; transform: translateY(-4px) scale(0.96); }
  to { opacity: 1; transform: none; }
}
@keyframes kof-badge-ping {
  0% { transform: scale(1); opacity: 0.55; }
  80%, 100% { transform: scale(2.4); opacity: 0; }
}
.kof-badge-in { animation: kof-badge-in 240ms cubic-bezier(0.22, 1, 0.36, 1) both; }
.kof-badge-ping { animation: kof-badge-ping 1.6s cubic-bezier(0, 0, 0.2, 1) infinite; }
@keyframes kof-badge-fade { from { opacity: 0; } to { opacity: 1; } }
@media (prefers-reduced-motion: reduce) {
  .kof-badge-in { animation: kof-badge-fade 150ms ease both; }
  .kof-badge-ping { animation: none; opacity: 0; }
}
`

export default function RecalculandoBadge({ texto = 'Recalculando el plan…', className = '' }) {
  return (
    <span
      role="status"
      aria-live="polite"
      className={`kof-badge-in inline-flex select-none items-center gap-2 whitespace-nowrap rounded-full border border-[#0D9488]/25 bg-[#0D9488]/10 px-3 py-1 text-xs font-semibold text-[#0F766E] ${className}`}
    >
      <style>{ESTILOS}</style>
      <span aria-hidden="true" className="relative flex h-2 w-2">
        <span className="kof-badge-ping absolute inline-flex h-full w-full rounded-full bg-[#0D9488]" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#0D9488]" />
      </span>
      {texto}
    </span>
  )
}
