import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/agorapricingcalculator/',
  server: {
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '.trycloudflare.com', // You can also use this simpler syntax.
    ]
  }
})
