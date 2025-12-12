import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import dts from 'unplugin-dts/vite'
import { fileURLToPath, URL } from 'url'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

const config = defineConfig(({ mode }) => {
    return {
        build: {
            // don't minify in dev build. This helps with debugging
            // maybe this could be solved in a better way with sourcemap?
            minify: mode === 'development' ? false : true,
            sourcemap: true,
            lib: {
                // entry: {
                entry: resolve(__dirname, 'src/index.ts'),
                fileName: (format) => `index.${format}.js`,
                formats: ['es'],
                name: '@swissgeo/content',
            },
            rollupOptions: {
                external: ['vue'],
                output: {
                    exports: 'named',
                    globals: {
                        vue: 'Vue',
                    },
                },
            },
        },
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url)),
            },
        },
        plugins: [
            dts({
                bundleTypes: true,
                processor: 'vue',
            }),
            tsconfigPaths(),
            vue(),
        ],
    }
})

export default config
