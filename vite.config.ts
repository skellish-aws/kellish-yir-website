import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import path from 'path'
import vue from '@vitejs/plugin-vue'
// Temporarily disabled due to Node.js 25+ localStorage issue
// import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // Vue DevTools temporarily disabled due to Node.js 25+ compatibility issue
    // Uncomment when plugin is updated to support Node.js 25+
    // vueDevTools(),
  ],
  build: {
    sourcemap: true,
  },
  server: {
    sourcemapIgnoreList: false,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      primevue: path.resolve(__dirname, 'node_modules/primevue'),
    },
  },
})
