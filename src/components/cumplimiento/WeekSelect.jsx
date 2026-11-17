import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import Popover from '../ui/Popover.jsx'

export default function WeekSelect({ weeks, value, onChange, rangeLabel }) {
  const [open, setOpen] = useState(false)
  const selected = weeks.find(w => w.key === value) || weeks[0]

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-ink-500">Periodo</label>
      <Popover
        open={open}
        onOpenChange={setOpen}
        matchWidth
        maxHeight={288}
        className="rounded-xl border border-neutral-200 bg-white p-1 shadow-lg lg:w-80"
        trigger={(props) => (
          <button
            type="button"
            {...props}
            className="flex w-full items-center justify-between gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-ink-900 hover:bg-neutral-50 lg:w-72"
          >
            <span className="truncate">{selected?.label}</span>
            <ChevronDown className={`size-4 text-ink-400 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
        )}
      >
        {({ close }) => weeks.map(w => (
          <button
            key={w.key}
            type="button"
            role="option"
            aria-selected={w.key === value}
            onClick={() => { onChange(w.key); close() }}
            className={`w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-neutral-50 focus-visible:outline-offset-0 ${w.key === value ? 'bg-primary-50 text-primary-700 font-medium' : 'text-ink-700'}`}
          >
            {w.label}
          </button>
        ))}
      </Popover>
      {rangeLabel && <p className="text-xs text-ink-500">{rangeLabel}</p>}
    </div>
  )
}
