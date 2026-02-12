import defaultConfig from '@swissgeo/config-eslint'

import { globalIgnores } from 'eslint/config'

export default [
    ...defaultConfig,
    globalIgnores(['.nuxt/*', '.output/*', 'vite-plugin-primevue-tailwind.ts', 'node_modules/*']),
    {
        rules: {
            'vue/multi-word-component-names': ['off'],
            'vue/html-indent': ['off'], // let this be prettier's realm
        },
    },
    {
        languageOptions: {
            parserOptions: {
                tsconfigRootDir: import.meta.dirname,
            },
        },
        settings: {
            'import/resolver': {
                typescript: {
                    project: ['./tsconfig.json'],
                },
            },
        },
    },
]
