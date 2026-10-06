import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/TETE/',
  define: { __TETE_VERSION__: JSON.stringify(process.env.VITE_APP_VERSION || 'local') },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      scope: '/TETE/',
      includeAssets: ['tete-icon.svg'],
      manifest: {
        id: '/TETE/',
        name: 'Tete — ECG Learning Coach',
        short_name: 'Tete',
        description: 'Offline-friendly guided ECG practice for health-science students.',
        theme_color: '#145c50',
        background_color: '#f7f8f3',
        display: 'standalone',
        scope: '/TETE/',
        start_url: '/TETE/',
        icons: [{ src: '/TETE/tete-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,webmanifest}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        clientsClaim: true,
      },
    }),
  ],
})
