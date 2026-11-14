import { useState, type FormEvent } from 'react'

import { Accordion } from '../components/Accordion'
import { Button } from '../components/Button'
import { Field } from '../components/Field'
import { Frame } from '../components/Frame'
import { Leader } from '../components/Leader'
import { Modal } from '../components/Modal'
import { PageHeader } from '../components/PageHeader'
import { Panel } from '../components/Panel'
import { Segmented } from '../components/Segmented'
import { Tag } from '../components/Tag'
import { compare, faq, plans, pricingCopy, type Plan } from '../content'
import { cx } from '../lib/cx'
import { load, save } from '../lib/storage'
import { useTitle } from '../lib/useTitle'

type Billing = 'monthly' | 'yearly'
type Signup = { email: string; plan: Plan['id'] }

export function Pricing() {
  useTitle('PRICING')
  const [billing, setBilling] = useState<Billing>(() => load<Billing>('phosphor.billing', 'monthly'))
  const [chosen, setChosen] = useState<Plan | null>(null)
  const setB = (b: Billing) => {
    setBilling(b)
    save('phosphor.billing', b)
  }

  return (
    <Frame wide>
      <PageHeader
        kicker={pricingCopy.title}
        title="$0 TO START"
        intro={pricingCopy.intro}
        aside={
          <Segmented
            label="Billing period"
            value={billing}
            options={[
              { id: 'monthly', label: pricingCopy.monthly },
              { id: 'yearly', label: pricingCopy.yearly },
            ]}
            onChange={setB}
            className="hidden sm:inline-flex"
          />
        }
      />
      <Segmented
        label="Billing period"
        value={billing}
        options={[
          { id: 'monthly', label: pricingCopy.monthly },
          { id: 'yearly', label: pricingCopy.yearly },
        ]}
        onChange={setB}
        className="self-start sm:hidden"
      />

      <div className="grid gap-5 md:grid-cols-3">
        {plans.map((p) => {
          const price = billing === 'monthly' ? p.monthly : p.yearly
          return (
            <Panel
              key={p.id}
              as="article"
              tone={p.featured ? 'line' : 'faint'}
              aria-labelledby={`plan-${p.id}`}
              className={cx('flex flex-col gap-4 p-4', p.featured && 'shadow-glow-sm')}
            >
              <div className="flex items-center justify-between gap-2">
                <h2 id={`plan-${p.id}`} className="m-0 text-title font-normal">
                  {p.name}
                </h2>
                {p.featured && <Tag tone="fill">RECOMMENDED</Tag>}
              </div>
              <p className="m-0 flex items-baseline gap-2">
                <span className="text-display">${price}</span>
                <span className="text-body text-ph-dim">{p.unit}</span>
              </p>
              <p className="m-0 min-h-[2.2em] text-lead normal-case text-ph-dim">{p.blurb}</p>
              <ul className="m-0 flex flex-1 list-none flex-col gap-1 p-0 text-body">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span aria-hidden="true">+</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Button variant={p.featured || p.id === 'free' ? 'fill' : 'line'} onClick={() => setChosen(p)} className="w-full">
                {p.cta} <span aria-hidden="true">{'↵'}</span>
              </Button>
            </Panel>
          )
        })}
      </div>

      <section aria-labelledby="compare-h" className="flex flex-col gap-2">
        <Leader className="text-lead">
          <h2 id="compare-h" className="m-0 text-lead font-normal">
            {pricingCopy.compareTitle}
          </h2>
        </Leader>
        <div className="scroll-ph focus-ring overflow-x-auto" tabIndex={0} role="region" aria-label="Plan comparison table">
          <table className="w-full min-w-[560px] border-collapse text-left text-body">
            <thead>
              <tr>
                <th scope="col" className="py-1.5 pr-3 font-normal text-ph-dim">
                  FEATURE
                </th>
                {plans.map((p) => (
                  <th key={p.id} scope="col" className="py-1.5 pr-3 font-normal">
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {compare.map((r) => (
                <tr key={r.row} className="border-t-2 border-dotted border-ph-faint">
                  <th scope="row" className="py-1.5 pr-3 font-normal text-ph-dim">
                    {r.row}
                  </th>
                  {r.values.map((v, i) => (
                    <td key={i} className="py-1.5 pr-3">
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="faq-h" className="flex flex-col gap-2">
        <Leader className="text-lead">
          <h2 id="faq-h" className="m-0 text-lead font-normal">
            {pricingCopy.faqTitle}
          </h2>
        </Leader>
        <Accordion items={faq} />
      </section>

      <SignupModal plan={chosen} onClose={() => setChosen(null)} />
    </Frame>
  )
}

function SignupModal({ plan, onClose }: { plan: Plan | null; onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | undefined>()
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<Signup | null>(() => load<Signup | null>('phosphor.signup', null))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!plan) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('ENTER A VALID EMAIL ADDRESS.')
      return
    }
    setBusy(true)
    setError(undefined)
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), plan: plan.id }),
      })
      const body = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(body.error ?? 'THE LINE DROPPED. TRY AGAIN.')
      const s = { email: email.trim(), plan: plan.id }
      setDone(s)
      save('phosphor.signup', s)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'THE LINE DROPPED. TRY AGAIN.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={plan !== null} onClose={onClose} title={`${pricingCopy.signupTitle} / ${plan?.name ?? ''}`}>
      {done ? (
        <div role="status" className="flex flex-col gap-3">
          <p className="m-0 text-title">&gt; {pricingCopy.signupDone}</p>
          <p className="m-0 text-lead text-ph-dim">
            {done.email} / {done.plan.toUpperCase()} PLAN
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="fill" size="sm" onClick={onClose}>
              DONE
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setDone(null)
                save('phosphor.signup', null)
              }}
            >
              USE ANOTHER EMAIL
            </Button>
          </div>
        </div>
      ) : (
        <form noValidate onSubmit={submit} className="flex flex-col gap-4">
          <p className="m-0 text-lead normal-case">{plan?.blurb}</p>
          <Field
            label={pricingCopy.signupLabel}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (error) setError(undefined)
            }}
            help={pricingCopy.signupHelp}
            error={error}
            data-autofocus
          />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={onClose}>
              CANCEL
            </Button>
            <Button type="submit" size="sm" variant="fill" loading={busy}>
              {plan?.cta} <span aria-hidden="true">{'↵'}</span>
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
