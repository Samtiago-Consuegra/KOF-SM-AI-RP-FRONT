import { Lightbulb } from 'lucide-react'

/** Parte el Motivo del motor en párrafos: por saltos de línea y, si es un solo bloque, por oraciones. */
function parrafos(texto) {
  const bloques = String(texto || '').split(/\n\s*\n|\n/).map((s) => s.trim()).filter(Boolean)
  if (bloques.length !== 1) return bloques
  return bloques[0].split(/(?<=\.)\s+(?=[A-ZÁÉÍÓÚÑ0-9])/).map((s) => s.trim()).filter(Boolean)
}

/** Sección destacada "¿Por qué se sugiere?" de los modales de detalle. */
export default function MotivoSugerencia({ motivo }) {
  const lista = parrafos(motivo)
  return (
    <section className="motivo-in mb-3 rounded-xl border border-tertiary-200 bg-tertiary-50/60 p-3" aria-labelledby="motivo-title">
      <style>{`
        @keyframes motivo-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .motivo-in { animation: motivo-in 280ms cubic-bezier(.2,.8,.2,1) 60ms both; }
        @media (prefers-reduced-motion: reduce) { .motivo-in { animation: none !important; } }
      `}</style>
      <div className="mb-2 flex items-center gap-2">
        <span className="grid size-7 place-items-center rounded-lg bg-white text-tertiary-700 ring-1 ring-tertiary-200">
          <Lightbulb className="size-4" aria-hidden="true" />
        </span>
        <h3 id="motivo-title" className="text-sm font-semibold text-ink-900">¿Por qué se sugiere?</h3>
      </div>
      {lista.length ? (
        <div className="space-y-2 text-sm leading-relaxed text-ink-700">
          {lista.map((p, i) => <p key={i}>{p}</p>)}
        </div>
      ) : (
        <p className="text-sm italic text-ink-500">El motor no registró un motivo para esta tarea</p>
      )}
    </section>
  )
}
