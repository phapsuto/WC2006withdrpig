import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  server: {
    watch: {
      ignored: ['**/public/data/**']
    },
    proxy: {
      '/api-proxy/worldcup26': {
        target: 'https://worldcup26.ir',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-proxy\/worldcup26/, ''),
        secure: false
      },
      '/api-proxy/sportmonks': {
        target: 'https://api.sportmonks.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-proxy\/sportmonks/, ''),
        secure: false
      }
    }
  }
})
