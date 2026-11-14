import { cx } from '../lib/cx'

export function Tag({ children, tone = 'line', className }: { children: string; tone?: 'fill' | 'line'; className?: string }) {
  return (
    <span
      className={cx(
        'inline-flex h-6 items-center px-1.5 text-micro leading-none',
        tone === 'fill' ? 'bg-ph text-ph-ink [text-shadow:none]' : 'border-2 border-ph-dim text-ph',
        className,
      )}
    >
      {children}
    </span>
  )
}
