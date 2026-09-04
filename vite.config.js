import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://hospitalproject-production-b81f.up.railway.app',
        changeOrigin: true,
        secure: true,
      }
    }
  }
})
