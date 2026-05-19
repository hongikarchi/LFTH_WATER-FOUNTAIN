import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiKey = env.SEOUL_API_KEY

  if (!apiKey) {
    // Surface missing-key early instead of letting the proxy quietly produce 404s.
    throw new Error(
      'SEOUL_API_KEY is not set. Copy .env.example to .env and fill the key.',
    )
  }

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: 'http://openapi.seoul.go.kr:8088',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, `/${apiKey}`),
        },
      },
    },
  }
})
