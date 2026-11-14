import { useTerminal } from '../lib/terminal'

/** One-line status in the corner of the tube, announced politely. */
export function Toast() {
  const { toast } = useTerminal()
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      {toast && <div className="bg-ph px-3 py-1.5 text-lead text-ph-ink shadow-glow">{toast}</div>}
    </div>
  )
}
