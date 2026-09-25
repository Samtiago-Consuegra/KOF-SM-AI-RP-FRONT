export default function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="size-9 rounded-xl bg-primary-500 grid place-items-center shadow-sm shadow-primary-500/40" aria-hidden="true">
        <svg viewBox="0 0 32 32" className="size-6">
          <path d="M3 17h5l3-7 5 13 3-6h10" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="leading-none">
        <span className="block text-[15px] font-extrabold tracking-tight text-ink-900">KOF-SMART</span>
        <span className="block text-[11px] font-semibold text-primary-600 mt-0.5">Maintenance AI</span>
      </span>
    </div>
  )
}
