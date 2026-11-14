import { useState, type ReactNode } from 'react'

import { Accordion } from '../components/Accordion'
import { AsciiArt } from '../components/AsciiArt'
import { Banner } from '../components/Banner'
import { Button, type ButtonVariant } from '../components/Button'
import { CodeBlock } from '../components/CodeBlock'
import { Empty } from '../components/Empty'
import { Field } from '../components/Field'
import { Frame } from '../components/Frame'
import { KeyCap } from '../components/KeyCap'
import { DotRule, Leader } from '../components/Leader'
import { Logo } from '../components/Logo'
import { MenuItem } from '../components/MenuItem'
import { Modal } from '../components/Modal'
import { PageHeader } from '../components/PageHeader'
import { Panel } from '../components/Panel'
import { PromptInput } from '../components/PromptInput'
import { Segmented } from '../components/Segmented'
import { Spinner } from '../components/Spinner'
import { Tag } from '../components/Tag'
import { TLink } from '../components/TLink'
import { banner, faq, phosphors, styleguide, type ArtKey, type Phosphor } from '../content'
import { useTerminal } from '../lib/terminal'
import { useTitle } from '../lib/useTitle'

const STATES = [
  { label: 'DEFAULT' },
  { label: 'HOVER', force: 'hover' as const },
  { label: 'FOCUS', force: 'focus' as const },
  { label: 'PRESSED', force: 'pressed' as const },
  { label: 'DISABLED', disabled: true },
  { label: 'LOADING', loading: true },
]

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4">
      <Leader className="text-lead">
        <h2 id={id} className="m-0 text-lead font-normal">
          {title}
        </h2>
      </Leader>
      {children}
    </section>
  )
}

function Cell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-1.5">
      <span className="text-micro text-ph-dim">{label}</span>
      {children}
    </div>
  )
}

export function Styleguide() {
  useTitle('STYLEGUIDE')
  const term = useTerminal()
  const [replay, setReplay] = useState(0)
  const [modal, setModal] = useState(false)
  const [seg, setSeg] = useState<Phosphor>('orange')
  const [prompt, setPrompt] = useState('')

  return (
    <Frame wide>
      <PageHeader
        kicker="STYLEGUIDE / THE TUBE'S PARTS"
        title="DESIGN SYSTEM"
        intro="EVERY TOKEN AND COMPONENT, RENDERED BY THE REAL COMPONENTS. HOVER, FOCUS AND PRESSED ARE PINNED WITH DATA-FORCE."
        aside={<Segmented label="Live phosphor" value={term.phosphor} options={phosphors} onChange={term.setPhosphor} className="hidden md:inline-flex" />}
      />

      <Section id="sg-color" title="COLOUR / 3 PHOSPHORS">
        <p className="m-0 text-body text-ph-dim">
          EACH PHOSPHOR IS A THEME, SWITCHED WITH [C] OR <code>data-phosphor</code>. PH-FAINT NEVER CARRIES TEXT.
        </p>
        <div className="grid gap-5 lg:grid-cols-3">
          {phosphors.map((p) => (
            <div key={p.id} data-phosphor={p.id} className="phosphor flex flex-col gap-2 border-2 border-ph-faint bg-glass p-3 text-ph">
              <span className="text-lead">{p.label}</span>
              {Object.entries(styleguide.palettes[p.id]).map(([name, hex]) => (
                <div key={name} className="flex items-center gap-3">
                  <span className="h-9 w-14 shrink-0 border-2 border-ph-faint" style={{ background: hex }} aria-hidden="true" />
                  <span className="flex min-w-0 flex-col leading-tight">
                    <span className="text-body">
                      {name} <span className="text-ph-dim">{hex}</span>
                    </span>
                    <span className="text-micro text-ph-dim">{styleguide.swatchNotes[name]}</span>
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Section>

      <Section id="sg-type" title="TYPE / VT323">
        <div className="flex flex-col gap-3">
          {styleguide.type.map((t) => (
            <div key={t.token} className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-6">
              <span className="w-40 shrink-0 text-micro text-ph-dim">
                {t.token} / {t.px}PX
              </span>
              <span className="min-w-0 break-words" style={{ fontSize: t.px, lineHeight: 1.05 }}>
                {t.sample}
              </span>
            </div>
          ))}
        </div>
      </Section>

      <div className="grid gap-8 lg:grid-cols-3">
        <Section id="sg-space" title="SPACING">
          <div className="flex flex-col gap-1.5">
            {styleguide.spacing.map((s) => (
              <div key={s} className="flex items-center gap-3 text-body">
                <span className="w-12 text-ph-dim">{s}PX</span>
                <span className="h-3 bg-ph" style={{ width: s * 3 }} aria-hidden="true" />
              </div>
            ))}
          </div>
        </Section>
        <Section id="sg-radii" title="RADII">
          <div className="flex flex-wrap gap-4">
            {styleguide.radii.map((r) => (
              <Cell key={r.token} label={`${r.token} / ${r.px}PX`}>
                <span className="block h-20 w-24 border-2 border-ph" style={{ borderRadius: r.px }} aria-hidden="true" />
              </Cell>
            ))}
          </div>
        </Section>
        <Section id="sg-shadow" title="SHADOWS">
          <div className="flex flex-wrap gap-5">
            {styleguide.shadows.map((s) => (
              <Cell key={s.token} label={s.token}>
                <span className="block h-16 w-24 bg-glass-2" style={{ boxShadow: `var(--${s.token})` }} aria-hidden="true" />
                <span className="text-micro text-ph-dim">{s.note}</span>
              </Cell>
            ))}
          </div>
        </Section>
      </div>

      <Section id="sg-motion" title="MOTION">
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm" onClick={() => setReplay((n) => n + 1)}>
            REPLAY ALL
          </Button>
          <span className="text-body text-ph-dim">REDUCED MOTION OR [F] OFF STOPS ALL OF THESE EXCEPT THE CURSOR STATE.</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {styleguide.motion.map((m) => (
            <Cell key={m.token} label={`${m.token} / ${m.value}`}>
              <div key={`${m.token}-${replay}`} className="relative flex h-20 w-full items-center justify-center overflow-hidden border-2 border-ph-faint">
                {m.token === 'animate-power-on' && <span className="power-on block h-10 w-3/4 bg-ph" style={{ animation: 'var(--animate-power-on)' }} />}
                {m.token === 'animate-row-in' && <span className="row-in text-lead">READY.</span>}
                {m.token === 'animate-blink' && <span className="cursor-block" />}
                {m.token === 'animate-flicker' && <span className="flicker block h-10 w-3/4 bg-ph" />}
                {m.token === 'animate-scan' && (
                  <span className="tube-band absolute inset-0" data-motion="decor" aria-hidden="true" style={{ position: 'absolute' }} />
                )}
              </div>
              <span className="text-micro text-ph-dim">{m.note}</span>
            </Cell>
          ))}
        </div>
      </Section>

      <Section id="sg-button" title="BUTTON / FILL, LINE, GHOST">
        {(['fill', 'line', 'ghost'] as ButtonVariant[]).map((v) => (
          <div key={v} className="flex flex-wrap gap-4">
            {STATES.map((s) => (
              <Cell key={s.label} label={`${v.toUpperCase()} / ${s.label}`}>
                <Button variant={v} force={s.force} disabled={s.disabled} loading={s.loading} tabIndex={s.force ? -1 : undefined}>
                  {v === 'fill' ? 'START FREE' : v === 'line' ? 'GO PRO' : 'CANCEL'}
                </Button>
              </Cell>
            ))}
          </div>
        ))}
      </Section>

      <div className="grid gap-8 lg:grid-cols-2">
        <Section id="sg-menu" title="MENU ITEM">
          <div className="flex w-full max-w-sm flex-col gap-0.5">
            <MenuItem index={1} label="DEFAULT" />
            <MenuItem index={2} label="HOVER" force="hover" tabIndex={-1} />
            <MenuItem index={3} label="FOCUS" force="focus" tabIndex={-1} />
            <MenuItem index={4} label="PRESSED" force="pressed" tabIndex={-1} />
            <MenuItem index={5} label="SELECTED" selected />
            <MenuItem index={6} label="DISABLED" disabled />
          </div>
        </Section>
        <Section id="sg-small" title="KEYCAP, TAG, LEADER, LINK, SPINNER">
          <div className="flex flex-wrap items-center gap-4 text-lead">
            <KeyCap k="C" />
            <Tag tone="fill">NEW</Tag>
            <Tag>FIXED</Tag>
            <Spinner />
            <TLink to="/docs" className="inline-flex min-h-10 items-center">A LINK</TLink>
          </div>
          <Leader className="text-body" right={<span>OK</span>}>
            01 LEADER ROW
          </Leader>
          <DotRule />
          <Logo className="h-16 w-16" />
        </Section>
      </div>

      <Section id="sg-banner" title="BANNER AND PANEL">
        <Banner title={banner.title} right={banner.right} lines={banner.lines.slice(0, 2)} />
        <div className="grid gap-4 md:grid-cols-3">
          <Panel tone="line" title="LINE" className="p-0">
            <p className="m-0 p-3 text-body">BORDERED IN PH.</p>
          </Panel>
          <Panel tone="faint" title="FAINT" aside={<Tag>ASIDE</Tag>}>
            <p className="m-0 p-3 text-body">BORDERED IN PH-FAINT.</p>
          </Panel>
          <Panel tone="fill" title="FILL">
            <p className="m-0 p-3 text-body">INK ON PHOSPHOR.</p>
          </Panel>
        </div>
      </Section>

      <div className="grid gap-8 lg:grid-cols-2">
        <Section id="sg-field" title="FIELD">
          <Field label="DEFAULT" placeholder="you@example.com" />
          <Field label="HOVER" placeholder="you@example.com" force="hover" tabIndex={-1} />
          <Field label="FOCUS" defaultValue="ada@example.com" force="focus" tabIndex={-1} />
          <Field label="WITH HELP" placeholder="you@example.com" help="WE SEND ONE EMAIL." />
          <Field label="ERROR" defaultValue="ada@" error="ENTER A VALID EMAIL ADDRESS." />
          <Field label="DISABLED" placeholder="locked" disabled />
        </Section>
        <Section id="sg-prompt" title="PROMPT INPUT">
          <Cell label="EMPTY (LIVE)">
            <PromptInput value={prompt} onChange={setPrompt} onSubmit={() => setPrompt('')} className="w-full" />
          </Cell>
          <Cell label="FOCUS">
            <PromptInput value="build a habit tracker" onChange={() => {}} onSubmit={() => {}} force="focus" className="w-full" />
          </Cell>
          <Cell label="ERROR">
            <PromptInput value="" onChange={() => {}} onSubmit={() => {}} error="NOTHING TO SEND. TYPE HELP TO LIST COMMANDS." className="w-full" />
          </Cell>
          <Cell label="LOADING">
            <PromptInput value="make a booking page" onChange={() => {}} onSubmit={() => {}} busy className="w-full" />
          </Cell>
          <Cell label="DISABLED">
            <PromptInput value="" onChange={() => {}} onSubmit={() => {}} disabled className="w-full" />
          </Cell>
        </Section>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Section id="sg-seg" title="SEGMENTED, ACCORDION">
          <Segmented label="Example choice" value={seg} options={phosphors} onChange={setSeg} />
          <Accordion items={faq.slice(0, 2)} />
        </Section>
        <Section id="sg-states" title="EMPTY, CODE, MODAL, TOAST">
          <Empty title="NO ENTRIES MATCH">TRY ANOTHER WORD.</Empty>
          <CodeBlock lines={['$ npm install -g phosphor', '$ phosphor']} />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setModal(true)}>
              OPEN MODAL
            </Button>
            <Button size="sm" variant="ghost" onClick={() => term.notify('TOAST: SIGNAL OK')}>
              SHOW TOAST
            </Button>
          </div>
        </Section>
      </div>

      <Section id="sg-art" title="ASCII ART / 5 RASTERS">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(['cloud', 'together', 'apps', 'key', 'display'] as ArtKey[]).map((a) => (
            <Cell key={a} label={a.toUpperCase()}>
              <AsciiArt art={a} label={`${a} illustration`} />
            </Cell>
          ))}
        </div>
      </Section>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="MODAL / EXAMPLE"
        footer={
          <div className="flex justify-end">
            <Button variant="fill" size="sm" onClick={() => setModal(false)}>
              OK
            </Button>
          </div>
        }
      >
        <p className="m-0 text-lead">FOCUS IS TRAPPED HERE. ESC CLOSES AND FOCUS RETURNS TO THE BUTTON THAT OPENED IT.</p>
      </Modal>
    </Frame>
  )
}
