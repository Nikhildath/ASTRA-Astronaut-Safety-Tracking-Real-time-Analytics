import { cx } from '../lib/cx'

/** A bracketed key hint, like [C]. */
export function KeyCap({ k, className }: { k: string; className?: string }) {
  return <span className={cx('whitespace-nowrap', className)}>[{k}]</span>
}
