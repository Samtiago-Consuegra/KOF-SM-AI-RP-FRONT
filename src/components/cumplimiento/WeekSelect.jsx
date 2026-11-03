import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export default function WeekSelect({ weeks, value, onChange, rangeLabel }) {
  const [open, setOpen] = useState(false)
  const selected = weeks.find(w => w.key === value) || weeks[0]
  
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-ink-500">Periodo</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex w-full items-center justify-between gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-ink-900 hover:bg-neutral-50 lg:w-72"
        >
          <span className="truncate">{selected?.label}</span>
          <ChevronDown className="size-4 text-ink-400" />
        </button>
        {open && (
          <div className="absolute z-50 mt-2 w-full rounded-xl border border-neutral-200 bg-white shadow-lg lg:w-80">
            <div className="max-h-72 overflow-y-auto p-1">
              {weeks.map(w => (
                <button
                  key={w.key}
                  type="button"
                  onClick={() => { onChange(w.key); setOpen(false) }}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-neutral-50 ${w.key === value ? 'bg-primary-50 text-primary-700 font-medium' : 'text-ink-700'}`}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {rangeLabel && <p className="text-xs text-ink-500">{rangeLabel}</p>}
    </div>
  )
}
