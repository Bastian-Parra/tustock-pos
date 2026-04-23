import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ command }) => {
  const isDev = command === "serve"
  
  return {
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: isDev ? '/' : './',
  server: {
    strictPort: true,
    port: 5173,
  },
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true,
  },
  }
})
