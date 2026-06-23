import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        // Matches PORT in backend/.env (currently 3001). If you change PORT
        // in backend/.env, update this to match.
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
