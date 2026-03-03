import { config } from '@vue/test-utils'

// we stubs the nuxt components for the unit tests
config.global.stubs = {
    UButton: true,
    UInput: true,
    UPopover: true,
    UIcon: true,
    ULocaleSelect: true,
}
