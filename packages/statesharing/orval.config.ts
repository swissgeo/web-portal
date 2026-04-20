import { defineConfig } from 'orval'

export default defineConfig({
    stateshare: {
        input: {
            target: 'http://127.0.0.1:8000/openapi.json',
        },
        output: {
            target: 'src/api',
            formatter: 'prettier',
            client: 'fetch',
            baseUrl: 'http://127.0.0.1:8000',
            schemas: {
                path: './src/model',
                type: 'zod', // generates .zod.ts files alongside your TypeScript types
            },
            override: {
                fetch: {
                    runtimeValidation: true, // validates responses automatically via the generated Zod schemas
                },
            },
        },
    },
    stateshare_mock: {
        input: {
            target: 'http://127.0.0.1:8000/openapi.json',
        },
        output: {
            mode: 'split',
            target: 'src/api',
            formatter: 'prettier',
            client: 'fetch',
            mock: true,
        },
    },
})
