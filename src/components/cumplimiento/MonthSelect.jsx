import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export default function MonthSelect({ months, value, onChange, disabled, disabledText }) {
  const [open, setOpen] = useState(false)
  const selected = months.find(m => m.key === value)
  
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-ink-500">Mes</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setOpen(!open)}
          disabled={disabled}
          className={`flex w-full items-center justify-between gap-2 rounded-xl border border-neutral-200 px-3 py-2 text-sm lg:w-56 ${disabled ? 'bg-neutral-100 text-ink-400 cursor-not-allowed opacity-60' : 'bg-white text-ink-900 hover:bg-neutral-50'}`}
        >
          <span className="truncate">{disabled ? disabledText : (selected?.label || 'Sin mes')}</span>
          {!disabled && <ChevronDown className="size-4 text-ink-400" />}
        </button>
        {open && !disabled && (
          <div className="absolute z-50 mt-2 w-full rounded-xl border border-neutral-200 bg-white shadow-lg lg:w-64">
            <div className="max-h-72 overflow-y-auto p-1">
              <button
                type="button"
                onClick={() => { onChange(null); setOpen(false) }}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-neutral-50 ${!value ? 'bg-primary-50 text-primary-700 font-medium' : 'text-ink-700'}`}
              >
                Sin mes
              </button>
              {months.map(m => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => { onChange(m.key); setOpen(false) }}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-neutral-50 ${m.key === value ? 'bg-primary-50 text-primary-700 font-medium' : 'text-ink-700'}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
