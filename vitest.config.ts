import { defineConfig } from 'vitest/config'
import { resolve } from 'path'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'packages/map/src'),
      '~': resolve(__dirname, 'packages/main/app'),
    },
  },
  plugins: [
    vue(),
    AutoImport({ imports: ['vue'], dts: false }),
  ],
})