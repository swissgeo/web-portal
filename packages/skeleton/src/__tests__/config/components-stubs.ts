import { config } from '@vue/test-utils'

// we stubs the nuxt components for the unit tests
config.global.stubs = {
    UButton: true,
    UInput: true,
    ULink: true,
    UPopover: true,
    UIcon: true,
    ULocaleSelect: true,
    USeparator: true,
    UTabs: true,
    USkeleton: true,
}
