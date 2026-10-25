import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { syncPlugin } from './src/server/syncPlugin.js';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    syncPlugin()
  ],
  server: {
    host: '0.0.0.0',
    port: 5173
  }
});
