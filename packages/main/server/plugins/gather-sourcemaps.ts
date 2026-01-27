import fs from 'fs-extra'
import { fileURLToPath } from 'node:url'
import path from 'path'

export default defineNitroPlugin((nitro) => {
    nitro.hooks.hook('nitro:build:public-assets', async () => {
        const libDist = fileURLToPath(new URL('../packages/map/dist', import.meta.url))
        const outDir = path.join(nitro.options.output.publicDir, 'map')

        await fs.copy(libDist, outDir, {
            filter: (p) => p.endsWith('.map'),
        })
    })
})
