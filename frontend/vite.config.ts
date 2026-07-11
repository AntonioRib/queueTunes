import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite config for the QueueTunes frontend.
// - Serves on 127.0.0.1:3000 so the Spotify OAuth redirect URI keeps working.
// - Emits into `build/` to match the Azure Static Web Apps `output_location`.
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 3000,
  },
  build: {
    outDir: 'build',
  },
});
