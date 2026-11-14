import type { ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'

import { cx } from '../lib/cx'

/** In-app link drawn as terminal text: underline on hover, glow ring on focus. */
export function TLink({ className, children, ...rest }: LinkProps & { children: ReactNode }) {
  return (
    <Link className={cx('focus-ring underline decoration-ph-faint decoration-2 underline-offset-4 hover:decoration-ph', className)} {...rest}>
      {children}
    </Link>
  )
}
