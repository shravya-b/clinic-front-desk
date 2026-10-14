/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Served from a sub-path on GitHub Pages (e.g. BASE_PATH=/clinic-management-ui/); root everywhere else.
  base: process.env.BASE_PATH ?? '/',
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});
