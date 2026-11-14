import type { HTMLAttributes, ReactNode } from 'react'

import { cx } from '../lib/cx'

type Props = HTMLAttributes<HTMLElement> & {
  title?: ReactNode
  aside?: ReactNode
  tone?: 'line' | 'faint' | 'fill'
  as?: 'section' | 'div' | 'article'
}

/** A bordered region of the screen with an optional title bar. */
export function Panel({ title, aside, tone = 'faint', as: As = 'section', className, children, ...rest }: Props) {
  return (
    <As
      className={cx(
        'relative',
        tone === 'line' && 'border-2 border-ph',
        tone === 'faint' && 'border-2 border-ph-faint',
        tone === 'fill' && 'bg-ph text-ph-ink [text-shadow:none] shadow-glow',
        className,
      )}
      {...rest}
    >
      {(title || aside) && (
        <header
          className={cx(
            'flex items-center justify-between gap-3 px-3 py-1 text-body',
            tone === 'fill' ? 'border-b-2 border-ph-ink/30' : 'border-b-2 border-ph-faint',
          )}
        >
          <span>{title}</span>
          {aside}
        </header>
      )}
      {children}
    </As>
  )
}
