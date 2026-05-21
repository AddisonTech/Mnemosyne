import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/block':  'http://localhost:8000',
      '/chain':  'http://localhost:8000',
      '/verify': 'http://localhost:8000',
      '/tamper': 'http://localhost:8000',
      '/stats':  'http://localhost:8000',
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
      },
    },
  },
})
