import type { ReactNode } from 'react'

import { cx } from '../lib/cx'

/** Nothing to show: a quiet framed line with an optional way out. */
export function Empty({ title, children, className }: { title: string; children?: ReactNode; className?: string }) {
  return (
    <div role="status" className={cx('flex flex-col items-start gap-2 border-2 border-dashed border-ph-faint px-4 py-5', className)}>
      <p className="m-0 text-lead">&gt; {title}</p>
      {children && <div className="text-body text-ph-dim">{children}</div>}
    </div>
  )
}
