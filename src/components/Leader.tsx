import type { ReactNode } from 'react'

import { cx } from '../lib/cx'

/** A line of text followed by a dotted leader and an optional right-hand item. */
export function Leader({ children, right, className }: { children: ReactNode; right?: ReactNode; className?: string }) {
  return (
    <div className={cx('flex items-end gap-2', className)}>
      <span className="min-w-0">{children}</span>
      <span className="leader" aria-hidden="true" />
      {right}
    </div>
  )
}

export function DotRule({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cx('rule-dots', className)} />
}
