import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'

import IconButton from '@/components/IconButton.vue'

describe('Functionality of buttons with a LucideIcon within', () => {
    const iconName = 'a-beAutifUl-cirCle'
    const expectedIcon = 'i-lucide-a-beautiful-circle'
    const testId = `button-icon-${expectedIcon}`

    // ensuring icon name is handled correctly to produce an 'icon' property and the test id
    it.each`
        description                                        | name         | icon
        ${'ensure icon name is used correctly as an icon'} | ${iconName}  | ${expectedIcon}
        ${'we can give an undefined icon name too'}        | ${undefined} | ${''}
    `('$description', ({ _, name, icon }) => {
        const wrapper = mount(IconButton, {
            attrs: {
                iconName: name,
                'data-testid': testId,
            },
        })
        const iconButton = wrapper.find(`[data-testid="${testId}"`)
        expect(iconButton.exists()).toBe(true)
        expect(iconButton.attributes().icon).to.eql(icon)
    })

    // ensuring text boolean attribute is handled properly to produce a variant attribute
    it.each`
        description                                                                | text         | variant
        ${'If the text attribute is true, the variant used is the ghost variant'}  | ${true}      | ${'ghost'}
        ${'If the text attribute is false, the variant used is the solid variant'} | ${false}     | ${'solid'}
        ${'If the text attribute is nullish, we resort to the solid variant'}      | ${undefined} | ${'solid'}
    `('$description', ({ _, text, variant }) => {
        const wrapper = mount(IconButton, {
            attrs: {
                iconName,
                text,
                'data-testid': testId,
            },
        })
        const iconButton = wrapper.find(`[data-testid="${testId}"`)
        expect(iconButton.exists()).toBe(true)
        expect(iconButton.attributes().icon).to.eql(expectedIcon)
        expect(iconButton.attributes().variant).to.eql(variant)
    })

    // ensuring styling (color and text color) are dependent on the severity
    it.each`
        description                                    | severity       | color          | classes
        ${'Handle primary severity regarding style'}   | ${'primary'}   | ${'primary'}   | ${['text-inverted']}
        ${'Handle danger severity regarding style'}    | ${'danger'}    | ${'danger'}    | ${['text-inverted']}
        ${'Handle success severity regarding style'}   | ${'success'}   | ${'success'}   | ${['text-inverted']}
        ${'Handle warning severity regarding style'}   | ${'warning'}   | ${'warning'}   | ${['text-default']}
        ${'Handle info severity regarding style'}      | ${'info'}      | ${'info'}      | ${['text-default']}
        ${'Handle neutral severity regarding style'}   | ${'neutral'}   | ${'neutral'}   | ${['text-default']}
        ${'Handle secondary severity regarding style'} | ${'secondary'} | ${'secondary'} | ${['text-default']}
        ${'Handle fantasy severity regarding style'}   | ${'anvil'}     | ${'secondary'} | ${['text-default']}
        ${'Handle nullis severity regarding style'}    | ${undefined}   | ${'secondary'} | ${['text-default']}
    `('$description', ({ _, severity, color, classes }) => {
        const wrapper = mount(IconButton, {
            attrs: {
                iconName,
                severity,
                'data-testid': testId,
            },
        })
        const iconButton = wrapper.find(`[data-testid="${testId}"`)
        // we should find the button
        expect(iconButton.exists()).toBe(true)
        // color should be either the severity, or secondary by default
        expect(iconButton.attributes().color).to.eql(color)
        // the text is dependant on color
        for (const cls of classes) {
            expect(iconButton.classes()).toContain(cls)
        }
    })

    it('passes other attributes to the iconButton directly, in lowercase form', () => {
        const customattribute = 'a custom attribute'
        const wrapper = mount(IconButton, {
            attrs: {
                iconName,
                customAttribute: customattribute,
                'data-testid': testId,
            },
        })
        const iconButton = wrapper.find(`[data-testid="${testId}"`)
        expect(iconButton.exists()).toBe(true)
        expect(iconButton.attributes().customattribute).to.eql(customattribute)
    })

    it('does not overwrite any "protected" attributes', () => {
        const wrapper = mount(IconButton, {
            attrs: {
                iconName,
                severity: 'primary',
                text: true,
                color: 'success',
                variant: 'solid',
                icon: 'i-lucide-not-the-good-one',
                'data-testid': testId,
            },
        })
        const iconButton = wrapper.find(`[data-testid="${testId}"]`)
        expect(iconButton.exists()).toBe(true)
        expect(iconButton.attributes().icon).to.eql(expectedIcon)
        expect(iconButton.attributes().variant).to.eql('ghost')
        expect(iconButton.attributes().color).to.eql('primary')
    })
})
