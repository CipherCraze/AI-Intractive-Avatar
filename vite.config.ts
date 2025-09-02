import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Allow switching API proxy target for local dev:
  // - default: 5000 (local Express dev-server)
  // - 3000 when using `vercel dev`
  const target = env.VITE_API_PROXY_TARGET || (env.VERCEL ? 'http://localhost:3000' : 'http://localhost:5000')

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target,
          changeOrigin: true,
        },
      },
    },
  }
})
