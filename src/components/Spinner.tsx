import { useEffect, useState } from 'react'

import { useReducedMotion } from '../lib/motion'

const FRAMES = ['|', '/', '-', '\\']

/** Text spinner. Under reduced motion it holds still as an ellipsis. */
export function Spinner({ label = 'LOADING' }: { label?: string }) {
  const reduced = useReducedMotion()
  const [i, setI] = useState(0)
  useEffect(() => {
    if (reduced) return
    const t = window.setInterval(() => setI((n) => (n + 1) % FRAMES.length), 110)
    return () => window.clearInterval(t)
  }, [reduced])
  return (
    <span role="status" aria-label={label} className="inline-block w-[1ch] text-center">
      <span aria-hidden="true">{reduced ? '…' : FRAMES[i]}</span>
    </span>
  )
}
