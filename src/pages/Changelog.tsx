import { useMemo, useState } from 'react'

import { Empty } from '../components/Empty'
import { Field } from '../components/Field'
import { Frame } from '../components/Frame'
import { Leader } from '../components/Leader'
import { PageHeader } from '../components/PageHeader'
import { Segmented } from '../components/Segmented'
import { Tag } from '../components/Tag'
import { changelog, type ChangeTag } from '../content'
import { useTitle } from '../lib/useTitle'

type Filter = 'ALL' | ChangeTag
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'ALL', label: 'ALL' },
  { id: 'NEW', label: 'NEW' },
  { id: 'IMPROVED', label: 'IMPROVED' },
  { id: 'FIXED', label: 'FIXED' },
]

export function Changelog() {
  useTitle('CHANGELOG')
  const [filter, setFilter] = useState<Filter>('ALL')
  const [q, setQ] = useState('')
  const shown = useMemo(() => {
    const t = q.trim().toLowerCase()
    return changelog
      .map((c) => ({
        ...c,
        items: c.items.filter((it) => (filter === 'ALL' || it.tag === filter) && (!t || `${c.title} ${it.text}`.toLowerCase().includes(t))),
      }))
      .filter((c) => c.items.length > 0)
  }, [filter, q])

  return (
    <Frame>
      <PageHeader kicker={`CHANGELOG / ${changelog.length} RELEASES`} title="WHAT CHANGED" intro="EVERY RELEASE OF THE TERMINAL AND THE CLOUD, NEWEST FIRST." />
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <Segmented label="Filter by kind" value={filter} options={FILTERS} onChange={setFilter} />
        <Field label="SEARCH" placeholder="deploys, sharing..." value={q} onChange={(e) => setQ(e.target.value)} className="md:w-72" />
      </div>
      {shown.length === 0 ? (
        <Empty title="NO ENTRIES MATCH">
          TRY ANOTHER WORD, OR{' '}
          <button
            type="button"
            className="focus-ring min-h-10 underline decoration-ph-faint decoration-2 underline-offset-4"
            onClick={() => {
              setQ('')
              setFilter('ALL')
            }}
          >
            SHOW EVERYTHING
          </button>
          .
        </Empty>
      ) : (
        <ol className="m-0 flex list-none flex-col gap-6 p-0">
          {shown.map((c) => (
            <li key={c.version} className="grid gap-x-8 gap-y-2 md:grid-cols-[160px_minmax(0,1fr)]">
              <div className="flex items-baseline gap-3 md:flex-col md:gap-0">
                <span className="text-title">{c.version}</span>
                <time dateTime={c.date} className="text-body text-ph-dim">
                  {c.date}
                </time>
              </div>
              <div className="flex flex-col gap-2">
                <Leader className="text-lead">
                  <h2 className="m-0 text-lead font-normal">{c.title}</h2>
                </Leader>
                <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                  {c.items.map((it) => (
                    <li key={it.text} className="flex items-start gap-3 text-lead">
                      <Tag tone={it.tag === 'NEW' ? 'fill' : 'line'} className="mt-0.5 w-[9ch] shrink-0 justify-center">
                        {it.tag}
                      </Tag>
                      <span className="normal-case">{it.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Frame>
  )
}
