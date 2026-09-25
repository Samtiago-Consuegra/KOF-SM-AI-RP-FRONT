import Dropdown from './Dropdown.jsx'
import { MACHINE_FILTER_OPTIONS } from '../../data/machines.js'

export default function MachineFilter({ value, onChange, label, className }) {
  return (
    <Dropdown
      label={label}
      value={value}
      onChange={onChange}
      options={MACHINE_FILTER_OPTIONS}
      className={className}
      renderValue={(o) => (
        <span className="flex items-center gap-2">
          {o?.value === 'criticas' && <span className="size-2 rounded-full bg-primary-500" />}
          <span className="font-medium">{o?.label}</span>
          {o?.value === 'criticas' && (
            <span className="hidden sm:inline rounded-full bg-primary-100 text-primary-700 text-[11px] px-2 py-0.5">Atención requerida</span>
          )}
          {o && o.value !== 'criticas' && o.value !== 'todas' && <span className="text-ink-500 truncate">· {o.hint}</span>}
        </span>
      )}
    />
  )
}
