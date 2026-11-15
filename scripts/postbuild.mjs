// Strips files the Sites uploader refuses (hidden files and source maps)
// from the build output, and copies dist/client to dist root for Vercel/Netlify hosting.
import { readdirSync, rmSync, statSync, existsSync, cpSync } from 'node:fs'
import { join } from 'node:path'

function clean(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (name.startsWith('.') || name.endsWith('.map')) {
      rmSync(path, { recursive: true, force: true })
      continue
    }
    if (statSync(path).isDirectory()) clean(path)
  }
}

const distDir = 'dist'
try {
  clean(distDir)
  // When @cloudflare/vite-plugin builds to dist/client, sync to dist root so Vercel can serve index.html directly
  if (existsSync('dist/client')) {
    cpSync('dist/client', 'dist', { recursive: true })
    console.log('Postbuild: Synced dist/client to dist root for host compatibility')
  }
} catch (e) {
  console.log('Postbuild cleanup skipped:', e)
}
