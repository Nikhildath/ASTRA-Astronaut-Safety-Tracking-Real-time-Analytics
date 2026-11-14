import type { ReactNode } from 'react'

import { cx } from '../lib/cx'
import { Footer } from './Footer'
import { TopBar } from './TopBar'
import { Tube } from './Tube'

/** Page shell: black room, one tube, status line on top, footer below. */
export function Frame({ children, nav = true, wide, className }: { children: ReactNode; nav?: boolean; wide?: boolean; className?: string }) {
  return (
    <div className="flex min-h-svh items-start justify-center bg-void px-2 py-3 sm:items-center sm:px-6 sm:py-3">
      <Tube
        className={cx(
          'w-full !rounded-[var(--radius-tube-sm)] sm:!rounded-[var(--radius-tube)]',
          wide ? 'max-w-[1180px]' : 'max-w-[1000px]',
        )}
        contentClassName="flex flex-col gap-3 px-4 py-4 sm:px-10 sm:py-4 lg:px-14"
      >
        <TopBar showNav={nav} />
        <main id="main" className={cx('flex min-w-0 flex-col gap-5', className)}>
          {children}
        </main>
        <Footer />
      </Tube>
    </div>
  )
}
