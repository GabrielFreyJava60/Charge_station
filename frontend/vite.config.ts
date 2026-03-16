import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { fileURLToPath, URL} from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3330,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
