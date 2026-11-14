import type { ReactNode } from 'react'

import { Leader } from './Leader'

/** Kicker with a dotted leader, a big title and an intro line. */
export function PageHeader({ kicker, title, intro, aside }: { kicker: string; title: string; intro?: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <Leader className="text-body" right={aside}>
        {kicker}
      </Leader>
      <h1 className="m-0 text-title font-normal sm:text-display">{title}</h1>
      {intro && <p className="m-0 max-w-[60ch] text-lead text-ph-dim">{intro}</p>}
    </div>
  )
}
