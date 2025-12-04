import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import AutoImport from 'unplugin-auto-import/vite'
import dts from 'unplugin-dts/vite'
import AutoImportComponents from 'unplugin-vue-components/vite'
import { fileURLToPath, URL } from 'url'
import { defineConfig, type UserConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

const config: UserConfig = defineConfig({
    build: {
        lib: {
            // entry: {
            entry: resolve(__dirname, 'src/index.ts'),
            fileName: (format) => `index.${format}.js`,
            formats: ['es'],
            //     index: resolve(__dirname, 'src/index.ts'),
            //     // api: resolve(__dirname, 'src/api/index.ts'),
            //     // parsers: resolve(__dirname, 'src/parsers/index.ts'),
            //     // utils: resolve(__dirname, 'src/utils/index.ts'),
            //     // validation: resolve(__dirname, 'src/validation/index.ts'),
            //     // vue: resolve(__dirname, 'src/vue/index.ts'),
            // },
            name: '@swissgeo/skeleton',
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
        vue(),
        AutoImport({
            dirs: ['./src/**'],
            imports: [
                // Presets
                'vue',
                'vue-router',
                'vue-i18n',
                'pinia',
                '@vueuse/core',
                'vee-validate',
            ],
            // Automatically generate types
            dts: '.nuxt/auto-imports.d.ts',
            // Auto import inside Vue template
            vueTemplate: true,
        }),
        dts({
            bundleTypes: true,
            processor: 'vue',
        }),
        AutoImportComponents({
            dts: './.nuxt/auto-components.d.ts',
            dirs: ['./src/**'],
        }),
        tsconfigPaths(),
    ],
})

export default config
