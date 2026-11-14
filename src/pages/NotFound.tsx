import { useNavigate } from 'react-router'

import { AsciiArt } from '../components/AsciiArt'
import { Button } from '../components/Button'
import { Frame } from '../components/Frame'
import { notFound } from '../content'
import { useTitle } from '../lib/useTitle'

export function NotFoundBody() {
  const navigate = useNavigate()
  return (
    <div className="grid items-center gap-8 py-6 md:grid-cols-[minmax(0,1fr)_auto]">
      <div className="flex flex-col gap-3">
        <p className="m-0 text-lead text-ph-dim">{notFound.code}</p>
        <h1 className="m-0 text-display font-normal">{notFound.title}</h1>
        <p className="m-0 text-lead">{notFound.text}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="fill" onClick={() => navigate('/')}>
            HOME [H]
          </Button>
          <Button onClick={() => navigate('/docs')}>DOCS [D]</Button>
          <Button variant="ghost" onClick={() => navigate(-1)}>
            {'< BACK'}
          </Button>
        </div>
      </div>
      <AsciiArt art="display" label="A monitor showing static" className="hidden md:block" />
    </div>
  )
}

export function NotFound() {
  useTitle('404')
  return (
    <Frame>
      <NotFoundBody />
    </Frame>
  )
}
