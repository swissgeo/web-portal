import path from 'node:path'

/**
 * Get the stylePreset, extract our primitive colors and turn them into lines of @theme variables to
 * be injected into main.css
 *
 * @param presetPath The path to the primevue preset file
 * @returns String
 */
async function createColorCss(presetPath: string) {
    const presetFile = path.resolve(process.cwd(), presetPath)
    const presetModule = await import(presetFile)
    const preset = presetModule.default || presetModule

    const { primitive = {} } = preset.Swissgeo

    const cssParts = ['@theme {']

    const map = (prefix: string, scale: string) => {
        return `    --color-${prefix}-${scale}: var(--p-${prefix}-${scale});`
    }

    // Primitive colors
    for (const primName in primitive) {
        for (const scale of Object.keys(primitive[primName])) {
            const line = map(primName, scale)
            // console.log(line)
            cssParts.push(line)
        }
    }

    cssParts.push('}')
    return cssParts.join('\n')
}

export default function primevueTailwindColors({ presetPath }: { presetPath: string }) {
    return {
        name: 'primevue-tailwind-colors',
        enforce: 'pre',

        async transform(code: string, id: string) {
            // inject the variables into main.css
            if (id.endsWith('main.css') && code.includes(`import 'tailwindcss'`)) {
                const injectedCss = await createColorCss(presetPath)

                return `${code}\n @layer test{}\n${injectedCss}`
            }
            return {
                code,
                map: null,
            }
        },
    }
}
