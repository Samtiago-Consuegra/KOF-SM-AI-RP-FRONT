const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function sumarDias(iso, n) {
  const d = new Date(iso + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/** Los 7 días de la semana que empieza en `inicioISO` (lunes). `sugerida` marca el día propuesto con un punto. */
export default function DiaSemanaSelector({ inicioISO, value, onChange, sugerida = null, className = '' }) {
  if (!inicioISO) return null
  const dias = DIAS.map((nombre, i) => ({ nombre, iso: sumarDias(inicioISO, i) }))
  return (
    <div role="radiogroup" aria-label="Día de la parada" className={`grid grid-cols-7 gap-1 ${className}`}>
      <style>{`
        @keyframes dia-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
        .dia-chip { animation: dia-in 200ms cubic-bezier(0.22, 1, 0.36, 1) both; transition: background-color 200ms ease, border-color 200ms ease, color 200ms ease; touch-action: manipulation; }
        .dia-chip:active { transform: scale(0.96); }
        @media (prefers-reduced-motion: reduce) { .dia-chip { animation: none; } .dia-chip:active { transform: none; } }
      `}</style>
      {dias.map((d, i) => {
        const active = value === d.iso
        return (
          <button
            key={d.iso}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={`${d.nombre} ${d.iso}`}
            onClick={() => onChange?.(d.iso)}
            style={{ animationDelay: `${i * 30}ms` }}
            className={`dia-chip relative flex h-11 flex-col items-center justify-center rounded-lg border text-[11px] leading-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400 ${active ? 'border-primary-500 bg-primary-500 font-semibold text-white shadow-sm' : 'border-neutral-200 bg-white text-ink-600 hover:bg-neutral-50'}`}
          >
            <span>{d.nombre}</span>
            <span className="text-sm tabular-nums">{Number(d.iso.slice(8, 10))}</span>
            {sugerida === d.iso && (
              <span className={`absolute right-1 top-1 size-1.5 rounded-full ${active ? 'bg-white' : 'bg-tertiary-500'}`} title="Día sugerido" aria-hidden="true" />
            )}
          </button>
        )
      })}
    </div>
  )
}
