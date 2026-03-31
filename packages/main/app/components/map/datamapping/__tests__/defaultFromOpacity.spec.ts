import { describe, expect, it } from 'vitest'

import { defaultOpacityFromStyle } from '../defaultFromOpacity'

describe('defaultOpacityFromStyle', () => {
    it('retrieves the correct default opacity', () => {
        const style = {
            id: 'ch.bag.radonkarte:wmts:style',
            layers: [
                {
                    id: 'ch.bag.radonkarte:wmts:style',
                    paint: {
                        'raster-opacity': 0.75,
                    },
                    source: 'wmts.geo.admin.ch',
                    type: 'raster' as const,
                },
            ],
        }
        const opacity = defaultOpacityFromStyle(style)

        expect(opacity).toEqual(0.75)
    })

    it("retrieves the fallback opacity if the style doesn't contain the info", () => {
        const style = {
            id: 'ch.bag.radonkarte:wmts:style',
            layers: [
                {
                    id: 'ch.bag.radonkarte:wmts:style',
                    source: 'wmts.geo.admin.ch',
                    type: 'raster' as const,
                },
            ],
        }
        const opacity = defaultOpacityFromStyle(style)

        expect(opacity).toEqual(1)
    })
})
