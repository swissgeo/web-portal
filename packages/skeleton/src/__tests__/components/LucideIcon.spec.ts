import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import { defineComponent } from 'vue'

vi.mock('lucide-vue-next', () => {
    const icons: Record<string, object> = {
        ABeautifulCircle: defineComponent({
            name: 'ABeautifulCircle',
            template: '<svg data-testid="circle-icon"></svg>',
        }),
        AnUglySquare: defineComponent({
            name: 'AnUglySquare',
            template: '<svg data-testid="square-icon"></svg>',
        }),
        DoesNotExist: defineComponent({
            name: 'DoesNotExist',
        }),
    }
    return icons
})

import LucideIcon from '@/components/LucideIcon.vue'

describe('We test LucideIcon.vue behavior', () => {
    it('renders the correct icon based on name prop', () => {
        const wrapper = mount(LucideIcon, {
            props: { name: 'ABeautifulCircle' },
        })

        expect(wrapper.find('[data-testid="circle-icon"]').exists()).toBe(true)
    })

    it('renders another icon when name changes', async () => {
        const wrapper = mount(LucideIcon, {
            props: { name: 'ABeautifulCircle' },
        })

        expect(wrapper.find('[data-testid="circle-icon"]').exists()).toBe(true)

        await wrapper.setProps({ name: 'AnUglySquare' })

        expect(wrapper.find('[data-testid="square-icon"]').exists()).toBe(true)
    })

    it('renders nothing if the icon does not exist (there is no template for it)', () => {
        const wrapper = mount(LucideIcon, {
            props: { name: 'DoesNotExist' },
        })

        // dynamic component resolves to undefined
        expect(wrapper.html()).toBe('')
    })
})
