import { mount } from '@vue/test-utils'
import ImportLocalLayersPanel from '~/components/debug/ImportLocalLayersPanel.vue'
import { useFileImport } from '~/composables/useFileImport'
import { describe, it, expect, vi } from 'vitest'

const importFileSpy = vi.fn()
vi.mock('~/composables/useFileImport', () => ({
    useFileImport: vi.fn(() => ({
        importFile: importFileSpy,
    })),
}))

describe('ImportLocalLayersPanel.vue', () => {
    it('renders correctly', () => {
        const wrapper = mount(ImportLocalLayersPanel)
        expect(wrapper.exists()).toBe(true)
    })

    it('shows error message when no file is selected', async () => {
        const wrapper = mount(ImportLocalLayersPanel)

        // call import handler directly to avoid relying on unresolved Button component
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (wrapper.vm as any).handleImport()
        expect(wrapper.text()).toContain('Please select a file first')
    })

    it('calls importFile when a file is selected and import is triggered', async () => {
        const wrapper = mount(ImportLocalLayersPanel)
        const file = new File(['test'], 'test.kml', {
            type: 'application/vnd.google-earth.kml+xml',
        })

        const inputWrapper = wrapper.find('input[type="file"]')
        const inputEl = inputWrapper.element as HTMLInputElement
        // define files property on the input element
        Object.defineProperty(inputEl, 'files', { value: [file] })
        await inputWrapper.trigger('change')

        // call import handler directly
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (wrapper.vm as any).handleImport()

        const { importFile } = useFileImport()
        expect(importFile).toHaveBeenCalledWith(file)
    })
})
