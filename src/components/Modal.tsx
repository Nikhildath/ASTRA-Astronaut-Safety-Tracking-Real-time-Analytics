import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

import { cx } from '../lib/cx'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])'

type Props = {
  open: boolean
  onClose: () => void
  title: ReactNode
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
}

/**
 * Overlay drawn as a second, smaller tube. Focus moves in on open, is trapped
 * while open, and returns to whatever opened it on close. Esc closes.
 */
export function Modal({ open, onClose, title, children, footer, wide }: Props) {
  const id = useId()
  const box = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    if (!open) return
    const opener = document.activeElement as HTMLElement | null
    const root = box.current
    const first = root?.querySelector<HTMLElement>('[data-autofocus]') ?? root?.querySelector<HTMLElement>(FOCUSABLE)
    first?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        closeRef.current()
        return
      }
      if (e.key !== 'Tab' || !root) return
      const items = [...root.querySelectorAll<HTMLElement>(FOCUSABLE)]
      if (items.length === 0) return
      const a = items[0]
      const z = items[items.length - 1]
      if (e.shiftKey && document.activeElement === a) {
        e.preventDefault()
        z.focus()
      } else if (!e.shiftKey && document.activeElement === z) {
        e.preventDefault()
        a.focus()
      }
    }
    document.addEventListener('keydown', onKey, true)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey, true)
      document.body.style.overflow = prev
      opener?.focus?.()
    }
  }, [open])

  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-3 sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={box}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        className={cx(
          'tube phosphor row-in flex max-h-[min(88svh,760px)] w-full flex-col text-ph',
          '!rounded-[var(--radius-tube-sm)]',
          wide ? 'max-w-3xl' : 'max-w-xl',
        )}
      >
        <div className="tube-layer tube-scanlines" aria-hidden="true" />
        <div className="tube-layer tube-vignette" aria-hidden="true" />
        <div className="tube-content flex min-h-0 flex-col">
          <div className="flex items-center justify-between gap-3 bg-ph px-5 py-2 text-lead text-ph-ink [text-shadow:none] sm:px-7">
            <h2 id={id} className="m-0 text-lead font-normal">
              {title}
            </h2>
            <button type="button" onClick={onClose} className="focus-ring min-h-10 px-2 text-body" aria-label="Close">
              ESC [X]
            </button>
          </div>
          <div className="scroll-ph min-h-0 overflow-y-auto px-5 py-5 sm:px-7">{children}</div>
          {footer && <div className="border-t-2 border-ph-faint px-5 py-3 sm:px-7">{footer}</div>}
        </div>
      </div>
    </div>,
    document.body,
  )
}
