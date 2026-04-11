import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isLocalTarget = (env.VITE_PROXY_TARGET || '').includes('localhost') || (env.VITE_PROXY_TARGET || '').includes('127.0.0.1');

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        includeAssets: ['logo_minimal.jpeg'],
        manifest: {
          name: 'IITR Campus Event Dashboard',
          short_name: 'Event Dashboard',
          description: 'Discover, track, and manage campus events in one place.',
          theme_color: '#0a7c5c',
          background_color: '#f2f9f6',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: '/logo_minimal.jpeg',
              sizes: '192x192',
              type: 'image/jpeg',
              purpose: 'any maskable'
            },
            {
              src: '/logo_minimal.jpeg',
              sizes: '512x512',
              type: 'image/jpeg',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          navigateFallback: '/index.html',
          globPatterns: ['**/*.{js,css,html,svg,png,ico,json}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/campus-event-planner-backend\.onrender\.com\//,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                networkTimeoutSeconds: 10,
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        },
        devOptions: {
          enabled: true
        }
      })
    ],
    server: {
      host: true,
      proxy: {
        '/api': {
          target: env.VITE_PROXY_TARGET || 'https://campus-event-planner-backend.onrender.com',
          changeOrigin: true,
          headers: !isLocalTarget ? {
            Origin: 'https://campus-dashboard-event-planner.vercel.app/'
          } : {},
          secure: false,
          cookieDomainRewrite: { '*': '' },
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    },
  }
})
