import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isLocalTarget = (env.VITE_PROXY_TARGET || '').includes('localhost') || (env.VITE_PROXY_TARGET || '').includes('127.0.0.1');

  return {
    plugins: [react()],
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
