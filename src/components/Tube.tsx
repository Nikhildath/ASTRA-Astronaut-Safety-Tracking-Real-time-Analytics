import { useEffect, type ReactNode } from 'react'

import { cx } from '../lib/cx'

let poweredOn = false

/** The CRT glass: glow, scanlines, vignette and a slow bright band. */
export function Tube({ children, className, contentClassName }: { children: ReactNode; className?: string; contentClassName?: string }) {
  // The power-on sweep plays once per page load, not on every route change.
  const first = !poweredOn
  useEffect(() => {
    poweredOn = true
  }, [])
  return (
    <div className={cx('tube phosphor text-ph', className)}>
      <div className={cx('tube-content flicker', first && 'power-on', contentClassName)}>{children}</div>
      <div className="tube-layer tube-scanlines" aria-hidden="true" />
      <div className="tube-layer tube-band" aria-hidden="true" data-motion="decor" />
      <div className="tube-layer tube-vignette" aria-hidden="true" />
    </div>
  )
}
