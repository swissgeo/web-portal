import defaultConfig from '@swissgeo/config-eslint'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

export default [
    ...defaultConfig,
    {
        languageOptions: {
            parserOptions: {
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
    skipFormatting,
]
