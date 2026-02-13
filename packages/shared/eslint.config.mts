import defaultConfig from '@swissgeo/config-eslint'

import { globalIgnores } from 'eslint/config'

export default [
    ...defaultConfig,
    globalIgnores(['.nuxt', '.output', 'node_modules']),
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
