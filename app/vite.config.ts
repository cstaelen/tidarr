import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    cors: true,
    open: true,
    port: 3000,
  },
  resolve: {
    alias: {
      src: "/src",
    },
  },
  define: {
    global: {},
  },
})
