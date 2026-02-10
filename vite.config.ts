import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // Crucial pour que les chemins fonctionnent dans Electron (file://)
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
});