import { brand } from '../content'
import { useTerminal } from '../lib/terminal'
import { TLink } from './TLink'

export function Footer() {
  const { openOverlay } = useTerminal()
  return (
    <footer className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 text-body">
      <p className="m-0 tracking-[0.08em]">
        <span aria-hidden="true">{'↳'} </span>
        {brand.tagline}
      </p>
      <div className="flex flex-wrap items-center gap-x-4 text-ph-dim">
        <TLink to="/changelog" className="inline-flex min-h-10 items-center lg:min-h-7">
          {brand.version}
        </TLink>
        <TLink to="/styleguide" className="inline-flex min-h-10 items-center lg:min-h-7">
          STYLEGUIDE
        </TLink>
        <button type="button" onClick={() => openOverlay('shortcuts')} className="focus-ring min-h-10 lg:min-h-7 underline decoration-ph-faint decoration-2 underline-offset-4 hover:decoration-ph">
          SHORTCUTS [?]
        </button>
      </div>
    </footer>
  )
}
