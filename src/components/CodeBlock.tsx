import { useState } from 'react'

import { Button } from './Button'

/** A framed block of commands with a copy key. */
export function CodeBlock({ lines }: { lines: string[] }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(lines.join('\n'))
      setState('copied')
    } catch {
      setState('failed')
    }
    window.setTimeout(() => setState('idle'), 1600)
  }
  return (
    <div className="relative border-2 border-ph-dim bg-ph/5">
      <pre tabIndex={0} aria-label="Code" className="scroll-ph focus-ring m-0 overflow-x-auto px-4 py-3 pr-24 font-mono text-lead leading-[1.15]">
        {lines.join('\n')}
      </pre>
      <div className="absolute right-1.5 top-1.5">
        <Button size="sm" variant="ghost" onClick={copy} aria-live="polite">
          {state === 'copied' ? 'COPIED' : state === 'failed' ? 'NO CLIPBOARD' : 'COPY'}
        </Button>
      </div>
    </div>
  )
}
