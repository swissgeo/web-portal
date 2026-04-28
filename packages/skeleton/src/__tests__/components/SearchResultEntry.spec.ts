import type { SearchResult } from '@swissgeo/search'

import { SearchResultTypesEnum } from '@swissgeo/search'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import SearchResultEntry from '@/components/sidebar/search/SearchResultEntry.vue'

describe('Search Result Entries', () => {
    const entries: SearchResult[] = [
        {
            resultType: SearchResultTypesEnum.location,
            id: 'id-0',
            title: 'Title 0',
            sanitizedTitle: 'Sanitized 0',
            description: 'Description 0',
        },
        {
            resultType: SearchResultTypesEnum.feature,
            id: 'id-1',
            title: 'Title 1',
            sanitizedTitle: 'Sanitized 1',
            description: 'Description 1',
        },
        {
            resultType: SearchResultTypesEnum.layer,
            id: 'id-2',
            title: 'Title 2',
            sanitizedTitle: 'Sanitized 2',
            description: 'Description 2',
        },
    ]

    function mountAndCreateList() {
        return mount(
            {
                components: { SearchResultEntry },
                template: `
          <ul>
            <SearchResultEntry
              v-for="(entry, index) in entries"
              :key="entry.id"
              :entry="entry"
              :index="index"
            />
          </ul>
        `,
                data() {
                    return { entries }
                },
            },
            { attachTo: document.body }
        )
    }

    it.each`
        description                                                                                       | initialIndex | finalIndex | keyPressed
        ${'Navigate to the top of the list when in focus and the "home" key is pressed'}                  | ${2}         | ${0}       | ${'Home'}
        ${'Navigate to the bottom of the list when in focus and the "end" key is pressed'}                | ${0}         | ${2}       | ${'End'}
        ${'Navigate to the previous element of the list when in focus and the "arrow up" key is pressed'} | ${2}         | ${1}       | ${'ArrowUp'}
        ${'Navigate to the next element of the list when in focus and the "arrow down" key is pressed'}   | ${1}         | ${2}       | ${'ArrowDown'}
        ${'Stays at the bottom of the list when in focus and the "arrow down" key is pressed'}            | ${2}         | ${2}       | ${'ArrowDown'}
        ${'Stays at the top of the list when in focus and the "arrow up" key is pressed'}                 | ${0}         | ${0}       | ${'ArrowUp'}
    `('$description', async ({ _, initialIndex, finalIndex, keyPressed }) => {
        const wrapper = mountAndCreateList()

        const items = wrapper.findAll('[data-testid^="search-result-entry"]')
        expect(items).to.have.length(3)
        expect(items[0]).to.exist
        expect(items[1]).to.exist
        expect(items[2]).to.exist
        ;(items[initialIndex].element as HTMLElement).focus()

        await items[initialIndex].trigger('keydown', { key: keyPressed })
        expect(document.activeElement).toBe(items[finalIndex].element)
    })
    //                 :data-testid="`icon-${entry.resultType}`"

    it.each`
        description                                              | indexTested | searchResultTypeExpected                        | searchResultTypesNotExpected
        ${'In a location entry, we only find the location icon'} | ${0}        | ${SearchResultTypesEnum.location.toLowerCase()} | ${[SearchResultTypesEnum.feature.toLowerCase(), SearchResultTypesEnum.layer.toLowerCase()]}
        ${'In a feature entry, we only find the feature icon'}   | ${1}        | ${SearchResultTypesEnum.feature.toLowerCase()}  | ${[SearchResultTypesEnum.location.toLowerCase(), SearchResultTypesEnum.layer.toLowerCase()]}
        ${'In a layer entry, we only find the layers icon'}      | ${2}        | ${SearchResultTypesEnum.layer.toLowerCase()}    | ${[SearchResultTypesEnum.feature.toLowerCase(), SearchResultTypesEnum.location.toLowerCase()]}
    `(
        '$description',
        ({ _, indexTested, searchResultTypeExpected, searchResultTypesNotExpected }) => {
            const wrapper = mountAndCreateList()

            const item = wrapper.find(
                `[data-testid^="search-result-entry-${searchResultTypeExpected}-${indexTested}"`
            )
            expect(item.exists()).toBe(true)
            const icon = item.find(`[data-testid^="icon-${searchResultTypeExpected}"`)
            expect(icon.exists()).toBe(true)
            searchResultTypesNotExpected.forEach((nonPresentType: string) => {
                const nonExist = item.find(`[data-testid^="icon-${nonPresentType}"`)
                expect(nonExist.exists()).toBe(false)
            })
        }
    )
})

describe.skip('Visible elements', () => {})
