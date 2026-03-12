// Minimal stub for Nuxt's #imports virtual module.
// Provides only the composables actually used by the app so that unit tests
// don't need a full Nuxt runtime.
export function useToast() {
    return {
        add: (_notification: object) => {},
    }
}
