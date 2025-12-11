import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    cors: true,
    open: false,
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:8484",
        changeOrigin: true,
      },
      "/proxy": {
        target: "http://localhost:8484",
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      src: "/src",
    },
  },
  define: {
    global: {},
  },
});
