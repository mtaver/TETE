import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['tete-icon.svg'],
      manifest: {
        id: '/',
        name: 'Tete — ECG Learning Coach',
        short_name: 'Tete',
        description: 'Offline-friendly guided ECG practice for health-science students.',
        theme_color: '#145c50',
        background_color: '#f7f8f3',
        display: 'standalone',
        start_url: '/',
        icons: [{ src: '/tete-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,webmanifest}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
})
