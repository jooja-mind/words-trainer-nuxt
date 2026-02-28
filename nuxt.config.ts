// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@vite-pwa/nuxt', "nuxt-charts"],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    appPassword: process.env.APP_PASSWORD || '',
    public: {
      appVersion: process.env.APP_VERSION || process.env.npm_package_version || 'dev',
      features: {
        daily: String(process.env.FEATURE_DAILY || 'true') === 'true',
        fluency: String(process.env.FEATURE_FLUENCY || 'true') === 'true'
      }
    }
  },
  app: {
    head: {
      meta: [
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' }
      ],
      link: [
        { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon.png' }
      ]
    }
  },
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Jooja Words Trainer',
      short_name: 'Words Trainer',
      description: 'Adaptive English words trainer with recap speaking mode',
      theme_color: '#0f1221',
      background_color: '#0f1221',
      display: 'standalone',
      start_url: '/',
      scope: '/',
      icons: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
      ]
    },
    workbox: {
      navigateFallback: '/trainer'
    }
  }
})
