import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/components': resolve(__dirname, './src/components'),
      '@/services': resolve(__dirname, './src/services'),
      '@/theme': resolve(__dirname, './src/theme'),
      '@/hooks': resolve(__dirname, './src/hooks'),
      '@/views': resolve(__dirname, './src/views'),
      '@/contexts': resolve(__dirname, './src/contexts'),
    },
  },
  server: {
    port: 3000,
  },
})