import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  css: {
    preprocessorOptions: {
      scss: { api: 'modern-compiler' },
    },
  },
  server: {
    port: 5173,
    // the browser talks only to 5173, vite forwards /api to the backend, so there is no CORS and the cookie works
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
