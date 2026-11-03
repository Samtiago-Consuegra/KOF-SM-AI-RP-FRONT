import { useNavigate } from 'react-router-dom'

const MAQUINAS = [
  { key: 'llenadora', label: 'Llenadora' },
  { key: 'empacadora', label: 'Empacadora' },
  { key: 'paletizadora', label: 'Paletizadora' },
  { key: 'envolvedora', label: 'Envolvedora' }
]

export default function MaquinaSelector({ maquinas = MAQUINAS, value, onChange }) {
  return (
    <div role="radiogroup" aria-label="Seleccionar máquina" className="flex gap-2 overflow-x-auto">
      {maquinas.map((m) => (
        <button
          key={m.key}
          role="radio"
          aria-checked={value === m.key}
          onClick={() => onChange(m.key)}
          className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
            value === m.key
              ? 'bg-ink-900 text-white'
              : 'bg-white text-ink-700 border border-neutral-200 hover:bg-neutral-100'
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  )
}
