import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/notedraw/',
  plugins: [react()],
  optimizeDeps: {
    include: ['tone'],
  },
});
