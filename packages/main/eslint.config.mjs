import markdown from '@eslint/markdown'
// import pluginVitest from '@vitest/eslint-plugin'
// import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'
// import { vueTsConfigs } from '@vue/eslint-config-typescript'
// @ts-ignore
// import pluginCypress from 'eslint-plugin-cypress/flat'
// import mocha from 'eslint-plugin-mocha'
import perfectionist from 'eslint-plugin-perfectionist'
// import pluginVue from 'eslint-plugin-vue'
import { globalIgnores } from 'eslint/config'

// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
    globalIgnores(['**/dist*/**', '**/dist-ssr/**', '**/coverage/**', 'geonetwork-ui/*']),

    // pluginVue.configs['flat/recommended'],
    // vueTsConfigs.recommended,

    {
        plugins: {
            perfectionist,
        },
        rules: {
            eqeqeq: ['error', 'always'],

            // 'no-console': 'error',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                    destructuredArrayIgnorePattern: '^_',
                },
            ],
            'no-var': 'error',
            'perfectionist/sort-imports': [
                'error',
                { type: 'alphabetical', internalPattern: ['^@/.*'] },
            ],
            'vue/html-self-closing': ['off'], // conflicts prettier
            // 'mocha/no-exclusive-tests': 'error',
        },
    },

    // {
    //     ...pluginVitest.configs.recommended,
    //     files: ['src/**/__tests__/*'],
    // },

    // {
    //     ...pluginCypress.configs.recommended,
    //     files: [
    //         'cypress/e2e/**/*.{cy,spec}.{js,ts,jsx,tsx}',
    //         'cypress/support/**/*.{js,ts,jsx,tsx}',
    //     ],
    // },

    {
        files: ['**/*.ts', '**/*.tsx'],
        // switching to TypeScript unused var rule (instead of JS rule), so that no error is raised
        // on unused param from abstract function arguments
        rules: {
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': 'error',
        },
    },
    {
        files: ['**/*.md'],
        ignores: ['!**/*.md', '**/LICENSE.md'],
        plugins: {
            markdown: markdown,
        },
        processor: 'markdown/markdown',
        rules: {
            'no-irregular-whitespace': 'off',
        },
    }
    // skipFormatting
)
