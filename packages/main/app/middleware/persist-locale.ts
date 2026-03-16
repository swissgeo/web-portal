// Persist the current locale to a cookie on every navigation so that / and /map
// can redirect to the correct /<lang>/map on the next visit.
export default defineNuxtRouteMiddleware(() => {
    const { locale } = useI18n()
    const localeCookie = useCookie('i18n_redirected')
    localeCookie.value = locale.value
})
