import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@bloomdidi/design': path.resolve(__dirname, '../../packages/design'),
    },
  },
  server: {
    port: 5175,
    proxy: { '/api': { target: 'http://localhost:3000', changeOrigin: true } },
  },
});
