import { useEffect, useState } from 'react'

import { shortcuts, signal } from '../content'
import { useReducedMotion } from '../lib/motion'
import { useTerminal } from '../lib/terminal'
import { Button } from './Button'
import { Modal } from './Modal'

const SCOPES = ['ANYWHERE', 'HOME', 'PROMPT'] as const

export function ShortcutsOverlay() {
  const { overlay, openOverlay } = useTerminal()
  return (
    <Modal open={overlay === 'shortcuts'} onClose={() => openOverlay(null)} title="ALL SHORTCUTS [?]" wide>
      <div className="grid gap-6 sm:grid-cols-2">
        {SCOPES.map((scope) => (
          <section key={scope} className={scope === 'ANYWHERE' ? 'sm:row-span-2' : undefined}>
            <h3 className="m-0 mb-2 text-body font-normal text-ph-dim">{scope}</h3>
            <dl className="m-0 flex flex-col gap-1">
              {shortcuts
                .filter((s) => s.scope === scope)
                .map((s) => (
                  <div key={s.label} className="flex items-end gap-2 text-lead">
                    <dt className="flex shrink-0 gap-1">
                      {s.keys.map((k, i) =>
                        k === '-' ? (
                          <span key={i} aria-hidden="true">
                            -
                          </span>
                        ) : (
                          <kbd key={i} className="inline-flex h-7 min-w-7 items-center justify-center bg-ph px-1 font-mono text-body text-ph-ink [text-shadow:none]">
                            {k}
                          </kbd>
                        ),
                      )}
                    </dt>
                    <span className="leader" aria-hidden="true" />
                    <dd className="m-0 text-right">{s.label}</dd>
                  </div>
                ))}
            </dl>
          </section>
        ))}
      </div>
    </Modal>
  )
}

/** The [K] easter egg: a morse line that keys out, then its plain text. */
export function SignalOverlay() {
  const { overlay, openOverlay, fx } = useTerminal()
  const reduced = useReducedMotion()
  const open = overlay === 'signal'
  const animate = open && fx && !reduced
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!open) return
    if (!animate) {
      setN(signal.morse.length)
      return
    }
    setN(0)
    const t = window.setInterval(() => setN((v) => (v >= signal.morse.length ? v : v + 1)), 45)
    return () => window.clearInterval(t)
  }, [open, animate])
  const done = n >= signal.morse.length
  return (
    <Modal
      open={open}
      onClose={() => openOverlay(null)}
      title={`${signal.title} [K]`}
      footer={
        <div className="flex justify-end">
          <Button variant="fill" size="sm" onClick={() => openOverlay(null)} data-autofocus>
            ACKNOWLEDGE <span aria-hidden="true">{'↵'}</span>
          </Button>
        </div>
      }
    >
      <p className="m-0 break-words text-title tracking-[0.2em]" aria-hidden="true">
        {signal.morse.slice(0, n)}
        {!done && <span className="cursor-block ml-1" />}
      </p>
      <p className="m-0 mt-5 text-display" aria-live="polite">
        {done ? signal.plain : ' '}
      </p>
      <p className="m-0 mt-3 text-lead text-ph-dim">{signal.note}</p>
    </Modal>
  )
}
