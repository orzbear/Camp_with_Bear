import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // Intercept any request starting with /api
      '/api': {
        // Change 'localhost' to 'api' if running inside Docker Compose
        target: 'http://api:8080',
        changeOrigin: true,
        // Optional: Remove '/api' before sending to the backend 
        // if your backend DOES NOT expect the /api prefix
        // rewrite: (path) => path.replace(/^\/api/, '') 
      }
    }
  }
})

