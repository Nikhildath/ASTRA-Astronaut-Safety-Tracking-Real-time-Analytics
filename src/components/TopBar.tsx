import { NavLink } from 'react-router'

import { brand, menu } from '../content'
import { cx } from '../lib/cx'
import { TLink } from './TLink'

/** Status line across the top of the tube. */
export function TopBar({ showNav = true }: { showNav?: boolean }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 text-lead">
      <TLink to="/" className="inline-flex min-h-10 items-center !no-underline lg:min-h-8">
        <span aria-hidden="true">{'↗'}</span>
        {brand.name} / <span className="ml-2">{brand.status}</span>
      </TLink>
      {showNav && (
        <nav aria-label="Main" className="order-3 flex w-full gap-1 sm:order-none sm:w-auto">
          {[{ label: 'HOME', to: '/' }, ...menu.nav].map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/'}
              className={({ isActive }) =>
                cx('focus-ring inline-flex min-h-10 items-center px-2', isActive ? 'bg-ph text-ph-ink [text-shadow:none]' : 'hover:bg-ph/15')
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
      )}
      <a href={brand.domainUrl} target="_blank" rel="noreferrer" className="focus-ring inline-flex min-h-10 items-center gap-1 hover:underline lg:min-h-8">
        {brand.domain} <span aria-hidden="true">{'↗'}</span>
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    </header>
  )
}
