import { useId, useState } from 'react'

import { cx } from '../lib/cx'

export function Accordion({ items, className }: { items: { q: string; a: string }[]; className?: string }) {
  const [open, setOpen] = useState<number | null>(0)
  const base = useId()
  return (
    <div className={cx('flex flex-col', className)}>
      {items.map((it, i) => {
        const on = open === i
        return (
          <div key={it.q} className="border-b-2 border-dotted border-ph-faint">
            <h3 className="m-0 text-lead font-normal">
              <button
                type="button"
                aria-expanded={on}
                aria-controls={`${base}-${i}`}
                onClick={() => setOpen(on ? null : i)}
                className="focus-ring flex min-h-11 w-full items-center gap-3 px-1 text-left hover:bg-ph/10"
              >
                <span aria-hidden="true" className="w-[3ch] shrink-0">
                  {on ? '[-]' : '[+]'}
                </span>
                <span>{it.q}</span>
              </button>
            </h3>
            <div id={`${base}-${i}`} hidden={!on} className="pb-3 pl-[calc(3ch+1.5rem)] text-body text-ph-dim">
              {it.a}
            </div>
          </div>
        )
      })}
    </div>
  )
}
