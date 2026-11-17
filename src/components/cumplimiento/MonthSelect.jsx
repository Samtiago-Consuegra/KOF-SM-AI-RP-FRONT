import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import Popover from '../ui/Popover.jsx'

export default function MonthSelect({ months, value, onChange, rangeLabel }) {
  const [open, setOpen] = useState(false)
  const selected = months.find(m => m.key === value)
  const items = [{ key: null, label: 'Sin mes' }, ...months]

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-ink-500">Mes</label>
      <Popover
        open={open}
        onOpenChange={setOpen}
        matchWidth
        maxHeight={288}
        className="rounded-xl border border-neutral-200 bg-white p-1 shadow-lg lg:w-64"
        trigger={(props) => (
          <button
            type="button"
            {...props}
            className="flex w-full items-center justify-between gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-ink-900 hover:bg-neutral-50 lg:w-56"
          >
            <span className="truncate">{selected?.label || 'Sin mes'}</span>
            <ChevronDown className={`size-4 text-ink-400 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
        )}
      >
        {({ close }) => items.map(m => {
          const isSel = m.key === null ? !value : m.key === value
          return (
            <button
              key={m.key ?? 'none'}
              type="button"
              role="option"
              aria-selected={isSel}
              onClick={() => { onChange(m.key); close() }}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-neutral-50 focus-visible:outline-offset-0 ${isSel ? 'bg-primary-50 text-primary-700 font-medium' : 'text-ink-700'}`}
            >
              {m.label}
            </button>
          )
        })}
      </Popover>
      {rangeLabel && <p className="text-xs text-ink-500">{rangeLabel}</p>}
    </div>
  )
}
