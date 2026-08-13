import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  // Relative so the build can be served from a subpath (project pages, etc.).
  base: './',
});
