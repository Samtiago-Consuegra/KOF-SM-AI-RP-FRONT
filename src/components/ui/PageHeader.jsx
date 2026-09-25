export default function PageHeader({ title, subtitle, children }) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
      <div className="min-w-0">
        <h1 className="flex items-center gap-2.5 text-2xl sm:text-[28px] font-bold tracking-tight text-ink-900">
          <span className="size-2.5 rounded-full bg-primary-500 shrink-0" aria-hidden="true" />
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-ink-500 max-w-2xl">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
    </header>
  )
}
