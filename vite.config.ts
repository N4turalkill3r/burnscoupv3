/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // Rutas relativas: el build (carpeta dist/) funciona abierto desde cualquier carpeta o
  // subruta, por ejemplo con la extensión Live Server de VS Code o en un hosting estático.
  base: './',
  build: {
    // El visor 3D (three.js) pesa ~900 kB y se carga aparte con import() a propósito.
    chunkSizeWarningLimit: 1000,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg'],
      manifest: {
        id: './',
        name: 'BurnScope - Calculadora de Parkland',
        short_name: 'BurnScope',
        description:
          'Calcula la reanimación hídrica del paciente quemado a partir de la superficie corporal quemada (SCQ).',
        lang: 'es',
        theme_color: '#0b2a5b',
        background_color: '#0b2a5b',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,glb,ico,woff2}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
