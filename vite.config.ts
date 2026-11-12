import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    // Proxy opcional para desarrollo: permite usar la API desde el mismo origen
    // (http://localhost:5173/api/v1) cuando el navegador bloquea las peticiones
    // entre puertos. La URL predeterminada sigue siendo VITE_API_BASE_URL.
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
})
