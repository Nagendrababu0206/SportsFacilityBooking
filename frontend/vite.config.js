import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: rootDir,
  cacheDir: path.join(rootDir, 'node_modules', '.vite'),
  server: {
    port: 5173
  }
});
