import vue from '@vitejs/plugin-vue'
import dts from 'unplugin-dts/vite'
import { fileURLToPath, URL } from 'url'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

import { getBaseBuildConfig } from '../../base.vite.config'

export default defineConfig(({ mode }) => {
    return {
        test: {
            globals: true,
            environment: 'jsdom',

            setupFiles: ['src/__tests__/config/components-stubs.ts'],
        },
        build: {
            ...getBaseBuildConfig(mode),
            lib: {
                entry: [fileURLToPath(new URL('./src/index.ts', import.meta.url))],
                fileName: (format) => `index.${format}.js`,
                name: '@swissgeo/skeleton',
            },
            rollupOptions: {
                external: ['vue', 'pinia', '@nuxt/ui', /#components/],
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
                '~': fileURLToPath(new URL('./src', import.meta.url)),
            },
        },
        plugins: [
            tsconfigPaths(),
            vue(),
            dts({
                beforeWriteFile: (filePath, content) => {
                    const normalizedPath = filePath.replace(/\\/g, '/')
                    const rewrittenPath = normalizedPath
                        .replace('/dist/src/', '/dist/')
                        .replace('/dist/types/', '/dist/')

                    return {
                        filePath: rewrittenPath,
                        content,
                    }
                },
                cleanVueFileName: true,
                include: [
                    fileURLToPath(new URL('./src', import.meta.url)),
                    fileURLToPath(new URL('./types', import.meta.url)),
                ],
                insertTypesEntry: true,
                outDirs: [fileURLToPath(new URL('./dist', import.meta.url))],
                tsconfigPath: fileURLToPath(new URL('./tsconfig.json', import.meta.url)),
            }),
        ],
    }
})
