import { ChevronLeft, ChevronRight } from 'lucide-react'

function buildPages(page, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)

  const pages = [1]
  if (page > 3) pages.push('inicio-ellipsis')
  const start = Math.max(2, page - 1)
  const end = Math.min(totalPages - 1, page + 1)
  for (let i = start; i <= end; i++) pages.push(i)
  if (page < totalPages - 2) pages.push('fin-ellipsis')
  pages.push(totalPages)
  return pages
}

/**
 * Paginación accesible con rango visible y elipsis.
 * Mantiene el foco dentro del control y deshabilita los extremos.
 */
export default function Paginacion({ page, totalPages, from, to, total, onPageChange, label = 'Paginación' }) {
  if (total === 0) return null

  const pages = buildPages(page, Math.max(1, totalPages))
  const atStart = page <= 1
  const atEnd = page >= totalPages

  const go = (next) => {
    if (next < 1 || next > totalPages || next === page) return
    onPageChange(next)
  }

  const base =
    'grid h-8 min-w-8 place-items-center rounded-lg border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400'
  const idle = 'border-neutral-200 bg-white text-ink-700 hover:bg-neutral-50'
  const disabled = 'border-neutral-200 bg-neutral-50 text-ink-300 cursor-not-allowed'

  return (
    <div className="flex flex-col gap-3 border-t border-neutral-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-ink-500" aria-live="polite">
        Mostrando <span className="font-semibold text-ink-700 tabular-nums">{from}–{to}</span> de{' '}
        <span className="font-semibold text-ink-700 tabular-nums">{total}</span>
      </p>

      <nav aria-label={label} className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => go(page - 1)}
          disabled={atStart}
          aria-label="Página anterior"
          className={`${base} ${atStart ? disabled : idle}`}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>

        {pages.map((item) =>
          typeof item === 'number' ? (
            <button
              key={item}
              type="button"
              onClick={() => go(item)}
              aria-current={item === page ? 'page' : undefined}
              aria-label={`Página ${item}`}
              className={`${base} ${
                item === page
                  ? 'border-primary-200 bg-primary-50 text-primary-700'
                  : idle
              }`}
            >
              {item}
            </button>
          ) : (
            <span key={item} className="grid h-8 w-6 place-items-center text-sm text-ink-400" aria-hidden="true">
              …
            </span>
          ),
        )}

        <button
          type="button"
          onClick={() => go(page + 1)}
          disabled={atEnd}
          aria-label="Página siguiente"
          className={`${base} ${atEnd ? disabled : idle}`}
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </nav>
    </div>
  )
}
