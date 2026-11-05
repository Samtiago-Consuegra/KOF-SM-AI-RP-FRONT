import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, HelpCircle } from 'lucide-react'

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  variant = 'danger', // danger | neutral
  onConfirm,
  onCancel,
}) {
  const cancelRef = useRef(null)
  const [shake, setShake] = useState(false)

  useEffect(() => {
    if (!open) return
    cancelRef.current?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onCancel?.() }
      if (e.key === 'Tab') {
        // basic focus trap
        const focusables = Array.from(document.querySelectorAll('[data-confirm-focus]'))
        if (focusables.length < 2) return
        const idx = focusables.indexOf(document.activeElement)
        if (e.shiftKey && idx === 0) { e.preventDefault(); focusables[focusables.length - 1].focus() }
        else if (!e.shiftKey && idx === focusables.length - 1) { e.preventDefault(); focusables[0].focus() }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  const Icon = variant === 'danger' ? AlertTriangle : HelpCircle
  const iconWrap = variant === 'danger' ? 'bg-primary-50 text-primary-500' : 'bg-ink-50 text-ink-700'
  const confirmBtn = variant === 'danger'
    ? 'bg-primary-500 text-white hover:bg-primary-600'
    : 'bg-ink-900 text-white hover:bg-primary-500'

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <style>{`
        @keyframes cd-in { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
        @keyframes cd-out { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(0.96); } }
        @keyframes cd-pop { from { transform: scale(0.6); } to { transform: scale(1); } }
        @keyframes cd-shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
        @media (prefers-reduced-motion: reduce) { .cd-anim, .cd-icon { animation: none !important; } }
      `}</style>
      <div className="absolute inset-0 bg-ink-900/40" onClick={() => { setShake(true); setTimeout(() => setShake(false), 400) }} />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="cd-title"
        aria-describedby="cd-desc"
        className={`cd-anim relative w-full max-w-[420px] bg-white rounded-2xl border border-neutral-200 shadow-xl mx-4 ${shake ? '' : ''}`}
        style={{ animation: shake ? 'cd-shake 300ms ease-in-out' : 'cd-in 220ms cubic-bezier(0.22,1,0.36,1)' }}
      >
        <div className="p-4 flex items-start gap-3">
          <div className={`cd-icon h-9 w-9 rounded-full grid place-items-center shrink-0 ${iconWrap}`} style={{ animation: 'cd-pop 220ms cubic-bezier(0.22,1,0.36,1) 60ms both' }}>
            <Icon className="size-4" />
          </div>
          <div>
            <p id="cd-title" className="text-base font-semibold text-ink-900">{title}</p>
            <p id="cd-desc" className="text-sm text-ink-700 mt-0.5">{message}</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 p-4 border-t border-neutral-200">
          <button ref={cancelRef} data-confirm-focus onClick={onCancel} className="h-9 px-3 rounded-lg border border-neutral-200 text-sm hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400">{cancelText}</button>
          <button data-confirm-focus onClick={onConfirm} className={`h-9 px-3 rounded-lg text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400 ${confirmBtn}`}>{confirmText}</button>
        </div>
      </div>
    </div>
  )
}
