import { useRef, type KeyboardEvent } from 'react'

import { cx } from '../lib/cx'

type Props<T extends string> = {
  label: string
  value: T
  options: { id: T; label: string }[]
  onChange: (v: T) => void
  className?: string
}

/** Radio group drawn as bracketed choices; arrow keys move the selection. */
export function Segmented<T extends string>({ label, value, options, onChange, className }: Props<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const onKey = (e: KeyboardEvent, i: number) => {
    const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!d) return
    e.preventDefault()
    const n = (i + d + options.length) % options.length
    onChange(options[n].id)
    refs.current[n]?.focus()
  }
  return (
    <div role="radiogroup" aria-label={label} className={cx('inline-flex flex-wrap border-2 border-ph', className)}>
      {options.map((o, i) => {
        const on = o.id === value
        return (
          <button
            key={o.id}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(o.id)}
            onKeyDown={(e) => onKey(e, i)}
            className={cx(
              'focus-ring min-h-10 px-3 text-body uppercase',
              on ? 'bg-ph text-ph-ink [text-shadow:none]' : 'text-ph hover:bg-ph/15',
            )}
          >
            {on ? '> ' : ''}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
