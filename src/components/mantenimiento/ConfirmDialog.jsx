import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, HelpCircle } from 'lucide-react'
import { isTopLayer, pushLayer } from '../../utils/modalLayer.js'

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  variant = 'danger', // danger | neutral
  icon,
  confirmClassName,
  busy = false,
  onConfirm,
  onCancel,
}) {
  const cancelRef = useRef(null)
  const [shake, setShake] = useState(false)
  const onCancelRef = useRef(onCancel)
  const busyRef = useRef(busy)
  const layerRef = useRef(`confirm-${Math.random().toString(36).slice(2)}`)

  useEffect(() => { onCancelRef.current = onCancel }, [onCancel])
  useEffect(() => { busyRef.current = busy }, [busy])

  useEffect(() => {
    if (!open) return
    const id = layerRef.current
    const popLayer = pushLayer(id)
    cancelRef.current?.focus()
    const onKey = (e) => {
      if (!isTopLayer(id)) return
      if (e.key === 'Escape') { e.preventDefault(); if (!busyRef.current) onCancelRef.current?.() }
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
    return () => {
      window.removeEventListener('keydown', onKey)
      popLayer()
    }
  }, [open])

  if (!open) return null

  const Icon = icon || (variant === 'danger' ? AlertTriangle : HelpCircle)
  const iconWrap = variant === 'danger' ? 'bg-primary-50 text-primary-500' : 'bg-ink-50 text-ink-700'
  const confirmBtn = confirmClassName || (variant === 'danger'
    ? 'bg-primary-500 text-white hover:bg-primary-600'
    : 'bg-ink-900 text-white hover:bg-primary-500')

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
          <button
            ref={cancelRef}
            data-confirm-focus
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="h-9 px-3 rounded-lg border border-neutral-200 text-sm hover:bg-neutral-50 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400"
          >
            {cancelText}
          </button>
          <button
            data-confirm-focus
            type="button"
            onClick={onConfirm}
            disabled={busy}
            aria-busy={busy}
            className={`h-9 px-3 rounded-lg text-sm disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400 ${confirmBtn}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
