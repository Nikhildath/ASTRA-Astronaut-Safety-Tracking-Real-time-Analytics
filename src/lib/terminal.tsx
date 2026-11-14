import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import { phosphors, type Phosphor } from '../content'
import { load, save } from './storage'

// Display settings (phosphor colour, effects) and the two global overlays.
// Settings persist in localStorage and are mirrored onto <html> as
// data-phosphor / data-fx so CSS does the rest.

type Overlay = 'shortcuts' | 'signal' | null

type TerminalState = {
  phosphor: Phosphor
  setPhosphor: (p: Phosphor) => void
  cyclePhosphor: () => void
  fx: boolean
  setFx: (on: boolean) => void
  overlay: Overlay
  openOverlay: (o: Overlay) => void
  toast: string | null
  notify: (text: string) => void
}

const Ctx = createContext<TerminalState | null>(null)

export function TerminalProvider({ children }: { children: ReactNode }) {
  const [phosphor, setPhosphorState] = useState<Phosphor>(() => {
    const p = load<string>('phosphor.color', 'orange')
    return phosphors.some((x) => x.id === p) ? (p as Phosphor) : 'orange'
  })
  const [fx, setFxState] = useState<boolean>(() => load('phosphor.fx', true))
  const [overlay, setOverlay] = useState<Overlay>(null)
  const [toast, setToast] = useState<string | null>(null)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    document.documentElement.dataset.phosphor = phosphor
    save('phosphor.color', phosphor)
  }, [phosphor])
  useEffect(() => {
    document.documentElement.dataset.fx = fx ? 'on' : 'off'
    save('phosphor.fx', fx)
  }, [fx])

  const notify = useCallback((text: string) => {
    setToast(text)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setToast(null), 1800)
  }, [])

  const setPhosphor = useCallback(
    (p: Phosphor) => {
      setPhosphorState(p)
      notify(`COLOR: ${p.toUpperCase()}`)
    },
    [notify],
  )
  const cyclePhosphor = useCallback(() => {
    setPhosphorState((cur) => {
      const next = phosphors[(phosphors.findIndex((x) => x.id === cur) + 1) % phosphors.length].id
      notify(`COLOR: ${next.toUpperCase()}`)
      return next
    })
  }, [notify])
  const setFx = useCallback(
    (on: boolean) => {
      setFxState(on)
      notify(`EFFECTS: ${on ? 'ON' : 'OFF'}`)
    },
    [notify],
  )

  const value = useMemo(
    () => ({ phosphor, setPhosphor, cyclePhosphor, fx, setFx, overlay, openOverlay: setOverlay, toast, notify }),
    [phosphor, setPhosphor, cyclePhosphor, fx, setFx, overlay, toast, notify],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useTerminal() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useTerminal outside TerminalProvider')
  return v
}
