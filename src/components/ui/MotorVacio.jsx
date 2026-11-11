/**
 * Estado vacío del motor de planes: ilustración SVG (hoja de plan + engranaje),
 * entrada escalonada y una flotación lenta. Con prefers-reduced-motion solo queda
 * un fundido corto y la ilustración se queda quieta.
 */
const ESTILOS = `
@keyframes kof-vacio-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: none; }
}
@keyframes kof-vacio-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
@keyframes kof-vacio-spin { to { transform: rotate(360deg); } }
.kof-vacio-in { animation: kof-vacio-in 420ms cubic-bezier(0.22, 1, 0.36, 1) both; }
.kof-vacio-float { animation: kof-vacio-float 4.5s ease-in-out infinite; }
.kof-vacio-gear { transform-box: fill-box; transform-origin: center; animation: kof-vacio-spin 9s linear infinite; }
.kof-vacio-btn { transition: background-color 200ms ease, box-shadow 200ms ease, transform 140ms cubic-bezier(0.25, 0.46, 0.45, 0.94); touch-action: manipulation; }
.kof-vacio-btn:active { transform: scale(0.97); }
@media (prefers-reduced-motion: reduce) {
  .kof-vacio-in { animation: kof-vacio-fade 200ms ease both; }
  .kof-vacio-float, .kof-vacio-gear { animation-play-state: paused; }
  .kof-vacio-btn:active { transform: none; }
}
@keyframes kof-vacio-fade { from { opacity: 0; } to { opacity: 1; } }
`

export default function MotorVacio({ message, actionLabel, onAction, className = '' }) {
  const conAccion = Boolean(actionLabel && onAction)

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-[#F8F9FA] px-6 py-10 text-center ${className}`}
    >
      <style>{ESTILOS}</style>

      <div className="kof-vacio-in" style={{ animationDelay: '0ms' }}>
        <svg
          className="kof-vacio-float h-28 w-28"
          viewBox="0 0 120 120"
          fill="none"
          aria-hidden="true"
          focusable="false"
        >
          <ellipse cx="60" cy="108" rx="30" ry="4" fill="#111827" opacity="0.06" />
          <rect x="26" y="18" width="58" height="76" rx="8" fill="#FFFFFF" stroke="#111827" strokeOpacity="0.15" strokeWidth="2" />
          <rect x="36" y="32" width="30" height="5" rx="2.5" fill="#F40000" opacity="0.85" />
          <rect x="36" y="45" width="38" height="4" rx="2" fill="#111827" opacity="0.12" />
          <rect x="36" y="55" width="32" height="4" rx="2" fill="#111827" opacity="0.12" />
          <rect x="36" y="65" width="24" height="4" rx="2" fill="#111827" opacity="0.12" />
          <g className="kof-vacio-gear">
            <circle cx="84" cy="80" r="13" fill="#0D9488" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
              <rect
                key={a}
                x="81.5"
                y="62"
                width="5"
                height="6"
                rx="1.5"
                fill="#0D9488"
                transform={`rotate(${a} 84 80)`}
              />
            ))}
            <circle cx="84" cy="80" r="5" fill="#F8F9FA" />
          </g>
        </svg>
      </div>

      <p
        className="kof-vacio-in mt-4 max-w-sm text-sm leading-relaxed text-[#111827]/75 text-balance"
        style={{ animationDelay: '60ms' }}
      >
        {message}
      </p>

      {conAccion && (
        <div className="kof-vacio-in mt-5" style={{ animationDelay: '120ms' }}>
          <button
            type="button"
            onClick={onAction}
            className="kof-vacio-btn inline-flex min-h-11 items-center justify-center rounded-xl bg-[#F40000] px-5 text-sm font-semibold text-white shadow-sm hover:bg-[#D10000] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F40000] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8F9FA]"
          >
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  )
}
