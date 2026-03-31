import type { Property } from '@swissgeo/ogc'

import { describe, expect, it } from 'vitest'

import { determineFormat } from '../determineFormat'

describe('determineFormat', () => {
    it.each([
        ['OGC:WMTS' as const, 'WMTS'],
        ['OGC:WMS' as const, 'WMS'],
        ['OGC:wmts' as const, 'WMTS'],
        ['Ogc:wMs' as const, 'WMS'],
    ])('returns the correct format', (protocol: string, expected: string) => {
        const dataset = {
            properties: {
                protocol: protocol,
                title: 'Güldenes Schwertkraut',
                type: 'Distribution' as const,
            } as Property<'Distribution'>,
        }
        const format = determineFormat(dataset)
        expect(format).toEqual(expected)
    })

    it("doesn't trip with weird data", () => {
        const dataset = {
            // @ts-expect-error breaking types is intentional here
            properties: {
                protocol: 'OG C:wmts',
                title: 'Güldenes Schwertkraut',
                type: 'Distribution' as const,
            } as Property<'Distribution'>,
        }

        const format = determineFormat(dataset)
        expect(format).toEqual(null)
    })
})
