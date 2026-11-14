import { useEffect, useState } from 'react'

import type { ArtKey } from '../content'
import { ARTS } from '../lib/ascii'
import { cx } from '../lib/cx'
import { useReducedMotion } from '../lib/motion'
import { useTerminal } from '../lib/terminal'

/**
 * One of the raster illustrations in src/lib/ascii.ts. Rows type in when the
 * art changes and a signal packet runs along its path; both stop under reduced
 * motion or with effects off.
 */
// Runs of '#' draw as lit cells (the tube's solid block), everything else as glyphs.
function blocks(row: string) {
  return row.split(/(#+)/).map((seg, i) =>
    seg.startsWith('#') ? (
      <span key={i} className="art-block">
        {' '.repeat(seg.length)}
      </span>
    ) : (
      seg
    ),
  )
}

export function AsciiArt({ art, label, className }: { art: ArtKey; label: string; className?: string }) {
  const { rows, path } = ARTS[art]
  const reduced = useReducedMotion()
  const { fx } = useTerminal()
  const live = !reduced && fx
  const [step, setStep] = useState(0)

  useEffect(() => {
    setStep(0)
    if (!live || path.length === 0) return
    const t = window.setInterval(() => setStep((s) => (s + 1) % (path.length + 8)), 90)
    return () => window.clearInterval(t)
  }, [art, live, path.length])

  const packet = live && step < path.length ? path[step] : null
  return (
    <figure className={cx('m-0', className)}>
      <pre aria-hidden="true" className="art m-0 font-mono">
        {rows.map((row, y) => {
          const text = packet && packet[1] === y ? row.slice(0, packet[0]) + '@' + row.slice(packet[0] + 1) : row
          return (
            <span key={`${art}-${y}`} className="row-in block" style={{ animationDelay: `${y * 22}ms` }}>
              {blocks(text)}
            </span>
          )
        })}
      </pre>
      <figcaption className="sr-only">{label}</figcaption>
    </figure>
  )
}
