import type { ReactNode } from 'react'

import { Leader } from '../components/Leader'
import { TLink } from '../components/TLink'
import { about, changelog, commands, docs, examples, phosphors, plans, type Phosphor } from '../content'

// The demo shell behind the home-page prompt. `parse` names what a line is;
// `effect` (run once, on submit) changes settings or navigates; `Output` is
// pure, so a saved session re-renders the same after a reload.

export type Parsed =
  | { kind: 'command'; name: string; arg: string }
  | { kind: 'task'; text: string }
  | { kind: 'unknown'; name: string }

const NAMES = new Set(commands.map((c) => c.name))
const PAGES = ['docs', 'pricing', 'changelog', 'styleguide', 'home'] as const

export function parse(input: string): Parsed {
  const text = input.trim()
  const [head = '', ...rest] = text.split(/\s+/)
  const name = head.toLowerCase()
  if (NAMES.has(name)) return { kind: 'command', name, arg: rest.join(' ').toLowerCase() }
  if (text.split(/\s+/).length >= 3) return { kind: 'task', text }
  return { kind: 'unknown', name: head }
}

export type Effects = {
  setPhosphor: (p: Phosphor) => void
  setFx: (on: boolean) => void
  navigate: (to: string) => void
  clear: () => void
  openShortcuts: () => void
  openSignal: () => void
}

/** Side effect for a line. Returns false when the line should not be logged. */
export function effect(p: Parsed, fx: Effects): boolean {
  if (p.kind !== 'command') return true
  switch (p.name) {
    case 'color':
      if (phosphors.some((x) => x.id === p.arg)) fx.setPhosphor(p.arg as Phosphor)
      return true
    case 'fx':
      if (p.arg === 'on' || p.arg === 'off') fx.setFx(p.arg === 'on')
      return true
    case 'open': {
      const page = p.arg as (typeof PAGES)[number]
      if (PAGES.includes(page)) {
        fx.navigate(page === 'home' ? '/' : `/${page}`)
        return false
      }
      return true
    }
    case 'clear':
      fx.clear()
      return false
    case 'shortcuts':
      fx.openShortcuts()
      return true
    case 'signal':
      fx.openSignal()
      return true
    default:
      return true
  }
}

const Err = ({ children }: { children: ReactNode }) => <p className="m-0">! {children}</p>
const Dim = ({ children }: { children: ReactNode }) => <p className="m-0 text-ph-dim">{children}</p>

function hash(s: string) {
  let h = 0
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return h
}

export function Output({ input, onPick }: { input: string; onPick: (text: string) => void }) {
  const p = parse(input)
  if (p.kind === 'unknown') {
    return (
      <Err>
        COMMAND NOT FOUND: {p.name.toLowerCase()}. TYPE HELP, OR DESCRIBE AN APP IN A FEW WORDS.
      </Err>
    )
  }
  if (p.kind === 'task') {
    const slug =
      p.text
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, '')
        .split(' ')
        .filter((w) => w.length > 3)
        .slice(0, 2)
        .join('-') || 'idea'
    const id = (hash(p.text) % 9000) + 1000
    const steps = ['READ THE IDEA AND PICK A STACK', 'SCAFFOLD PAGES, DATA AND SIGN-IN', 'WRITE IT, RUN IT, FIX WHAT BREAKS', 'DEPLOY A PREVIEW']
    return (
      <div className="flex flex-col gap-0.5">
        <p className="m-0">TASK #{id} RECEIVED. PLAN:</p>
        {steps.map((s, i) => (
          <Leader key={s} right={<span>{i === steps.length - 1 ? 'READY' : 'OK'}</span>}>
            {String(i + 1).padStart(2, '0')} {s}
          </Leader>
        ))}
        <p className="m-0">PREVIEW: {slug}.preview.example (DEMO)</p>
        <Dim>
          THIS TERMINAL IS A DEMO. <TLink to="/pricing">START FREE [G]</TLink> TO RUN IT FOR REAL.
        </Dim>
      </div>
    )
  }
  switch (p.name) {
    case 'help':
      return (
        <div className="grid gap-x-6 sm:grid-cols-2">
          {commands.map((c) => (
            <Leader key={c.name} right={<span className="text-ph-dim">{c.text}</span>}>
              {c.usage ?? c.name}
            </Leader>
          ))}
        </div>
      )
    case 'about':
      return (
        <div className="flex flex-col gap-1">
          {about.map((l, i) => (i === 0 ? <p key={l} className="m-0">{l}</p> : <Dim key={l}>{l}</Dim>))}
        </div>
      )
    case 'pricing':
      return (
        <div className="flex flex-col gap-0.5">
          {plans.map((pl) => (
            <Leader key={pl.id} right={<span>{pl.monthly === 0 ? '$0' : `$${pl.monthly} ${pl.unit}`}</span>}>
              {pl.name} <span className="text-ph-dim">/ {pl.features[1]}</span>
            </Leader>
          ))}
          <Dim>
            FULL DETAILS: <TLink to="/pricing">OPEN PRICING</TLink>
          </Dim>
        </div>
      )
    case 'docs':
      return (
        <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
          {docs.map((d) => (
            <li key={d.slug}>
              <Leader right={<span className="hidden text-ph-dim sm:inline">{d.summary}</span>}>
                <TLink to={`/docs/${d.slug}`}>{d.title}</TLink>
              </Leader>
            </li>
          ))}
        </ul>
      )
    case 'changelog':
      return (
        <div className="flex flex-col gap-0.5">
          {changelog.slice(0, 3).map((c) => (
            <Leader key={c.version} right={<span className="text-ph-dim">{c.date}</span>}>
              {c.version} {c.title}
            </Leader>
          ))}
          <Dim>
            EVERY RELEASE: <TLink to="/changelog">OPEN CHANGELOG</TLink>
          </Dim>
        </div>
      )
    case 'examples':
      return (
        <div className="flex flex-col gap-0.5">
          <Dim>PICK ONE TO PUT IT ON THE PROMPT:</Dim>
          {examples.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => onPick(ex)}
              className="focus-ring min-h-8 text-left hover:bg-ph/15"
            >
              {'> '}
              {ex}
            </button>
          ))}
        </div>
      )
    case 'color':
      if (phosphors.some((x) => x.id === p.arg)) return <p className="m-0">COLOR SET TO {p.arg.toUpperCase()}.</p>
      return <Err>USAGE: color [{phosphors.map((x) => x.id).join('|')}]</Err>
    case 'fx':
      if (p.arg === 'on' || p.arg === 'off') return <p className="m-0">SCANLINES AND FLICKER {p.arg.toUpperCase()}.</p>
      return <Err>USAGE: fx [on|off]</Err>
    case 'open':
      return <Err>USAGE: open [{PAGES.join('|')}]</Err>
    case 'shortcuts':
      return <Dim>SHORTCUT LIST OPENED. PRESS ESC TO CLOSE IT.</Dim>
    case 'signal':
      return <Dim>SIGNAL RECEIVED.</Dim>
    default:
      return null
  }
}
