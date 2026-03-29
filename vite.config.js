import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      host: true,
      proxy: {
        '/api': {
          target: env.VITE_PROXY_TARGET || 'https://campus-event-planner-backend.vercel.app',
          changeOrigin: true,
          headers: {
            Origin: 'https://campus-dashboard-event-planner.vercel.app/'
          },
          secure: false,
          cookieDomainRewrite: { '*': '' },
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    },
  }
})
