import { useMemo, useState } from 'react'
import { useParams } from 'react-router'

import { CodeBlock } from '../components/CodeBlock'
import { Empty } from '../components/Empty'
import { Field } from '../components/Field'
import { Frame } from '../components/Frame'
import { Leader } from '../components/Leader'
import { MenuLink } from '../components/MenuItem'
import { PageHeader } from '../components/PageHeader'
import { TLink } from '../components/TLink'
import { docs } from '../content'
import { useTitle } from '../lib/useTitle'
import { NotFoundBody } from './NotFound'

export function Docs() {
  const { slug } = useParams()
  const doc = slug ? docs.find((d) => d.slug === slug) : undefined
  useTitle(doc ? `${doc.title} / DOCS` : 'DOCS')
  const [q, setQ] = useState('')
  const list = useMemo(() => {
    const t = q.trim().toLowerCase()
    return t ? docs.filter((d) => `${d.title} ${d.summary}`.toLowerCase().includes(t)) : docs
  }, [q])

  if (slug && !doc) {
    return (
      <Frame>
        <NotFoundBody />
      </Frame>
    )
  }
  const i = doc ? docs.indexOf(doc) : -1
  const prev = i > 0 ? docs[i - 1] : undefined
  const next = i >= 0 && i < docs.length - 1 ? docs[i + 1] : undefined

  return (
    <Frame>
      <PageHeader kicker={`DOCS / ${docs.length} GUIDES`} title={doc ? doc.title : 'READ THE MANUAL'} intro={doc ? doc.summary : 'SHORT GUIDES FOR THE TERMINAL AND THE CLOUD. PRESS D FROM ANYWHERE.'} />
      <div className="grid gap-x-10 gap-y-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <nav aria-label="Guides" className="flex flex-col gap-3">
          <Field label="FILTER" placeholder="type to filter" value={q} onChange={(e) => setQ(e.target.value)} />
          {list.length === 0 ? (
            <Empty title="NO GUIDES MATCH">
              <button type="button" className="focus-ring min-h-10 underline decoration-ph-faint decoration-2 underline-offset-4" onClick={() => setQ('')}>
                CLEAR THE FILTER
              </button>
            </Empty>
          ) : (
            <div className="flex flex-col gap-0.5">
              <MenuLink to="/docs" end index="0" label="INDEX" />
              {list.map((d) => (
                <MenuLink key={d.slug} to={`/docs/${d.slug}`} index={docs.indexOf(d) + 1} label={d.title} />
              ))}
            </div>
          )}
        </nav>

        {doc ? (
          <article className="flex min-w-0 flex-col gap-4">
            {doc.body.map((b, k) =>
              b.h ? (
                <Leader key={k} className="mt-2 text-lead">
                  <h2 className="m-0 text-lead font-normal">{b.h}</h2>
                </Leader>
              ) : b.code ? (
                <CodeBlock key={k} lines={b.code} />
              ) : (
                <p key={k} className="m-0 max-w-[62ch] text-lead normal-case">
                  {b.p}
                </p>
              ),
            )}
            <div className="mt-4 flex flex-wrap justify-between gap-3 border-t-2 border-dotted border-ph-faint pt-3 text-lead">
              {prev ? <TLink to={`/docs/${prev.slug}`} className="inline-flex min-h-10 items-center">{'< '}{prev.title}</TLink> : <span />}
              {next && <TLink to={`/docs/${next.slug}`} className="inline-flex min-h-10 items-center">{next.title}{' >'}</TLink>}
            </div>
          </article>
        ) : (
          <div className="flex min-w-0 flex-col gap-3">
            {docs.map((d, k) => (
              <TLink key={d.slug} to={`/docs/${d.slug}`} className="group flex flex-col gap-0.5 !no-underline px-2 py-2 hover:bg-ph/10">
                <Leader className="text-lead" right={<span aria-hidden="true">{'↵'}</span>}>
                  {String(k + 1).padStart(2, '0')} {d.title}
                </Leader>
                <span className="text-body text-ph-dim normal-case">{d.summary}</span>
              </TLink>
            ))}
          </div>
        )}
      </div>
    </Frame>
  )
}
