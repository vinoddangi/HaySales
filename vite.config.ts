import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'

// Set Google Chrome as default browser for dev server
if (!process.env.BROWSER) {
  process.env.BROWSER = process.platform === 'darwin' ? 'google chrome' : 'google-chrome'
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    open: true, // Automatically open Chrome when starting dev server
  },
})
