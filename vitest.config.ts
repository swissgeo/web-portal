import { defineConfig } from 'vitest/config'
import { resolve } from 'path'
import vue from '@vitejs/plugin-vue'

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
      '@/composables/olDrawing.composable': resolve(
        __dirname,
        'packages/drawing/src/composables/olDrawing.composable.ts'
      ),
      '@/constants/projections': resolve(__dirname, 'packages/drawing/src/constants/projections.ts'),
      '@/stores/drawing': resolve(__dirname, 'packages/drawing/src/stores/drawing.ts'),
      '@/types': resolve(__dirname, 'packages/drawing/src/types.ts'),
      '@/utils/markerIcons': resolve(__dirname, 'packages/drawing/src/utils/markerIcons.ts'),
      '@': resolve(__dirname, 'packages/map/src'),
      '~': resolve(__dirname, 'packages/main/app'),
      // vue-i18n is a transitive dep not directly accessible in pnpm;
      // redirect to a lightweight stub so components using useI18n() compile in tests.
      'vue-i18n': resolve(__dirname, 'test-utils/vue-i18n-stub.ts'),
    },
  },
  plugins: [
    vue(),
  ],
})
