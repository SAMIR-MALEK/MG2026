import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'نظام الوسائل العامة - كلية الحقوق - جامعة برج بوعريريج',
        short_name: 'وسائل UBB',
        theme_color: '#0a1628',
        background_color: '#f0f4f8',
        display: 'standalone',
        lang: 'ar',
        dir: 'rtl',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      }
    })
  ],
  server: {
    proxy: { '/api': { target: 'http://localhost:5000', changeOrigin: true } }
  }
})
