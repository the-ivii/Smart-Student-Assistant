import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    // Only open browser in local development, not in CI/CD environments (Vercel, Render, etc.)
    open: process.env.NODE_ENV === 'development' && !process.env.CI && !process.env.VERCEL && !process.env.RENDER && typeof process.env.CODESPACES === 'undefined'
  },
  build: {
    outDir: 'dist'
  }
})

