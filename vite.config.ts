import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/ocean-lost-found/' : '/',
  build: { outDir: 'docs' },
  plugins: [react(), tailwindcss()],
}));
