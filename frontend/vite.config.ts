import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0', // Permite acesso de outros dispositivos na rede
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        timeout: 30000, // 30 segundos de timeout
        // Não remove o prefixo /api pois o backend agora usa esse prefixo
      },
    },
  },
})




