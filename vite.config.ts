import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    cloudflare(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192.svg', 'icon-512.svg'],
      manifest: {
        name: 'ASTRA Space Health Monitor',
        short_name: 'ASTRA',
        description: 'Health tracking for astronauts — monitor vitals, explore body systems, and get actionable guidance for long-duration spaceflight.',
        start_url: '/',
        display: 'standalone',
        background_color: '#05070d',
        theme_color: '#05070d',
        orientation: 'portrait-primary',
        icons: [
          {
            src: '/icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
          {
            src: '/icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 50 * 1024 * 1024, // 50MB - accommodate all model textures including dragon (>400MB total)
        globPatterns: ['**/*.{js,css,html,svg,png,ico,gltf,bin,jpeg,jpg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/[^.]+\.supabase\.co\/.*$/,
            handler: 'NetworkOnly',
            options: {
              cacheName: 'supabase-api',
            },
          },
          {
            urlPattern: /^\/models\/.*\.(gltf|bin)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: '3d-models',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
          {
            urlPattern: /^\/models\/.*\/textures\/.*\.(png|jpeg|jpg)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'model-textures',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
        clientsClaim: true,
        skipWaiting: true,
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  server: { port: 5364, strictPort: false },
})
