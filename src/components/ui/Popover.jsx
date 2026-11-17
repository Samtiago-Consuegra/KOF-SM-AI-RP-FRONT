import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { autoUpdate, flip, offset, shift, size, useFloating } from '@floating-ui/react-dom'
import { isTopLayer, pushLayer } from '../../utils/modalLayer.js'

const ITEMS = '[role="option"]:not([disabled]), [role="menuitem"]:not([disabled])'
const EXIT_MS = 160 // respaldo si animationend no llega (pestaña oculta, jsdom)

/**
 * Panel flotante portalizado en <body> con position: fixed y anclado a su botón.
 * No lo recorta ningún overflow ni lo encierra ningún contexto de apilamiento.
 *
 * trigger: (props) => <button {...props} />  — props trae ref, aria-* y handlers.
 * children: nodo o ({ close }) => nodo. close() cierra y devuelve el foco al botón.
 * role: 'listbox' | 'menu' activan flechas/Home/End; 'dialog' deja el teclado al contenido.
 */
export default function Popover({
  open,
  onOpenChange,
  trigger,
  children,
  role = 'listbox',
  as: Panel = 'div',
  placement = 'bottom-start',
  offset: gap = 8,
  matchWidth = false,
  maxHeight = 320,
  className = '',
  label,
}) {
  const id = useId()
  const [mounted, setMounted] = useState(open)
  const [inModal, setInModal] = useState(false)
  const onOpenChangeRef = useRef(onOpenChange)
  onOpenChangeRef.current = onOpenChange

  const { refs, floatingStyles, placement: finalPlacement } = useFloating({
    open: mounted,
    placement,
    strategy: 'fixed',
    transform: false, // top/left: el transform queda libre para la animación
    whileElementsMounted: autoUpdate, // solo corre mientras el panel existe
    middleware: [
      offset(gap),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
      size({
        padding: 8,
        apply({ availableHeight, rects, elements }) {
          Object.assign(elements.floating.style, {
            maxHeight: `${Math.max(120, maxHeight ? Math.min(maxHeight, availableHeight) : availableHeight)}px`,
            minWidth: matchWidth ? `${rects.reference.width}px` : '',
          })
        },
      }),
    ],
  })

  const close = useCallback((returnFocus = true) => {
    onOpenChangeRef.current(false)
    if (returnFocus) refs.reference.current?.focus()
  }, [refs])

  useLayoutEffect(() => {
    if (!open) return
    setMounted(true)
    setInModal(!!refs.reference.current?.closest('[aria-modal="true"]'))
  }, [open, refs])

  // Salida: espera la animación y desmonta.
  useEffect(() => {
    if (open || !mounted) return
    const t = setTimeout(() => setMounted(false), EXIT_MS)
    return () => clearTimeout(t)
  }, [open, mounted])

  useEffect(() => {
    if (!open) return
    const layer = `popover-${id}`
    const popLayer = pushLayer(layer)

    // Captura en window: corre antes que el Escape del modal y lo detiene.
    const onKey = (e) => {
      if (!isTopLayer(layer)) return
      if (e.key === 'Escape') {
        e.stopPropagation()
        e.preventDefault()
        close(true)
      } else if (e.key === 'Tab' && refs.floating.current?.contains(document.activeElement)) {
        e.preventDefault()
        close(true)
      }
    }
    const onDown = (e) => {
      if (refs.reference.current?.contains(e.target) || refs.floating.current?.contains(e.target)) return
      onOpenChangeRef.current(false)
    }
    window.addEventListener('keydown', onKey, true)
    document.addEventListener('mousedown', onDown)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      document.removeEventListener('mousedown', onDown)
      popLayer()
    }
  }, [open, id, close, refs])

  const navigable = role === 'listbox' || role === 'menu'

  // Al abrir, el foco va a la opción elegida (o a la primera).
  useEffect(() => {
    if (!open || !navigable) return
    const panel = refs.floating.current
    const target = panel?.querySelector('[aria-selected="true"]') ?? panel?.querySelector(ITEMS)
    target?.focus({ preventScroll: true })
  }, [open, mounted, navigable, refs])

  const onPanelKeyDown = (e) => {
    if (!navigable) return
    const items = [...e.currentTarget.querySelectorAll(ITEMS)]
    if (!items.length) return
    const i = items.indexOf(document.activeElement)
    const next = {
      ArrowDown: items[(i + 1) % items.length],
      ArrowUp: items[(i - 1 + items.length) % items.length],
      Home: items[0],
      End: items[items.length - 1],
    }[e.key]
    if (!next) return
    e.preventDefault()
    next.focus()
  }

  const triggerProps = {
    ref: refs.setReference,
    'aria-haspopup': role,
    'aria-expanded': open,
    'aria-controls': open ? id : undefined,
    onClick: () => onOpenChange(!open),
    onKeyDown: (e) => {
      if (!open && navigable && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        e.preventDefault()
        onOpenChange(true)
      }
    },
  }

  const [side, align] = finalPlacement.split('-')
  const up = side === 'top'

  return (
    <>
      {trigger(triggerProps)}
      {mounted &&
        createPortal(
          <Panel
            ref={refs.setFloating}
            id={id}
            role={role}
            aria-label={label}
            data-state={open ? 'open' : 'closed'}
            onKeyDown={onPanelKeyDown}
            onAnimationEnd={(e) => e.target === e.currentTarget && !open && setMounted(false)}
            style={{
              ...floatingStyles,
              '--kof-pop-y': up ? '4px' : '-4px',
              transformOrigin: `${align === 'end' ? 'right' : 'left'} ${up ? 'bottom' : 'top'}`,
            }}
            className={`kof-pop overflow-auto scroll-thin ${inModal ? 'z-popover-modal' : 'z-dropdown'} ${className}`}
          >
            {typeof children === 'function' ? children({ close }) : children}
          </Panel>,
          document.body,
        )}
    </>
  )
}
