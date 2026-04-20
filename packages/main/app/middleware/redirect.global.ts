export default defineNuxtRouteMiddleware((to) => {
    const localePath = useLocalePath()
    const { $i18n } = useNuxtApp()

    const isRootPath = to.path === '/' || to.path === '/map'
    const isLocaleRoot = $i18n.localeCodes.value.some(
        (code) => to.path === `/${code}` || to.path === `/${code}/`
    )

    if (isRootPath || isLocaleRoot) {
        return navigateTo({ path: localePath('/map'), query: to.query })
    }
})
