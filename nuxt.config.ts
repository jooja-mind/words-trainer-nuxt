// https://nuxt.com/docs/api/configuration/nuxt-config
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import type { PluginOption } from 'vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@vite-pwa/nuxt', "nuxt-charts", '@pinia/nuxt'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    appPassword: process.env.APP_PASSWORD || '',
    public: {
      appVersion: process.env.APP_VERSION || process.env.npm_package_version || 'dev'
    }
  },
  vite: {
    plugins: [
      // @ts-ignore
      nodePolyfills({
        globals: { Buffer: true, process: true, global: true },
        include: ['buffer', 'process', 'stream'],
      }) as unknown as PluginOption,
    ],
    define: {
      global: 'globalThis',
    },
  },
  app: {
    head: {
      meta: [
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' }
      ],
      link: [
        { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon.png' }
      ],
      script: [
        { src: 'https://cdn.jsdelivr.net/npm/js-confetti@latest/dist/js-confetti.browser.js' }
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