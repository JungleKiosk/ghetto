import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  base: '/getto/', // ✅ Assicura che il frontend funzioni su Render senza problemi di path
  plugins: [vue()],
  server: {
    proxy: {
      '/api': {
        target: 'https://iicd.geoinnova.it', // ✅ Backend target
        changeOrigin: true,
        secure: true, // 🔹 Imposta a `true` per HTTPS (Render usa HTTPS)
        rewrite: (path) => path.replace(/^\/api/, '') // ✅ Riscrive il path
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true, // 🔹 Utile per debug su Render
  }
});
