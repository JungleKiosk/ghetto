import { defineConfig } from 'vite'; // ✅ Aggiunto defineConfig
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  base: '/', // ✅ Corretto per Render
  plugins: [vue()],
  server: {
    proxy: {
      '/api': {
        target: 'https://iicd.geoinnova.it',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
});
