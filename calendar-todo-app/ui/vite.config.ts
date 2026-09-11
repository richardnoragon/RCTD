/// <reference types="vite/client" />

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined;
          }

          if (id.includes('@fullcalendar')) {
            return 'vendor-fullcalendar';
          }

          if (id.includes('react-beautiful-dnd')) {
            return 'vendor-dnd';
          }

          if (id.includes('@tauri-apps')) {
            return 'vendor-tauri';
          }

          if (id.includes('react-markdown')) {
            return 'vendor-markdown';
          }

          if (id.includes('react') || id.includes('scheduler')) {
            return 'vendor-react';
          }

          return undefined;
        },
      },
    },
  },
});
