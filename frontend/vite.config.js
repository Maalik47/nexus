import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The frontend (Vista) talks to the API through a dev proxy, which keeps the
// same origin during development and mirrors the client-server architecture.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY || 'http://localhost:4000',
        changeOrigin: true
      }
    }
  }
});
