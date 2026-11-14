import { Hono } from 'hono'

// The Worker in front of the static site. API routes live under /api; every
// other path falls through to the built assets (single-page-application mode).
type Env = {
  ASSETS: Fetcher
}

const app = new Hono<{ Bindings: Env }>()

app.get('/api/health', (c) => c.json({ ok: true }))

// Early-access sign-up from the pricing page. It validates and acknowledges;
// connect it to your email provider or a D1 table to keep the addresses.
app.post('/api/signup', async (c) => {
  const body = await c.req
    .json<{ email?: unknown; plan?: unknown }>()
    .catch(() => ({}) as { email?: unknown; plan?: unknown })
  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const plan = typeof body.plan === 'string' ? body.plan : ''
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return c.json({ error: 'ENTER A VALID EMAIL ADDRESS.' }, 400)
  }
  if (!['free', 'pro', 'team'].includes(plan)) {
    return c.json({ error: 'UNKNOWN PLAN.' }, 400)
  }
  return c.json({ ok: true, plan })
})

app.all('/api/*', (c) => c.json({ error: 'Not found' }, 404))

app.all('*', (c) => c.env.ASSETS.fetch(c.req.raw))

export default app
