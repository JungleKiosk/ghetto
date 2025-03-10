import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  base:'/ghetto/',
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
