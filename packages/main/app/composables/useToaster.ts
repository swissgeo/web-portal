/**
 * Basically just a wrapper with some helping functions
 * We could theoretically be using the toaster directly, but I suppose it's a good idea
 * to centralize all the calls here and get a consistant usage
 */
export function useToaster() {
    const { $i18n } = useNuxtApp()
    const toast = useToast()

    function showWarning(message: string, overrides?: Parameters<typeof toast.add>[0]) {
        toast.add({
            title: $i18n.t('toaster.warningTitle'),
            description: message,
            color: 'warning',
            icon: 'i-lucide-circle-alert',
            ...overrides,
        })
    }

    function showError(message: string, overrides?: Parameters<typeof toast.add>[0]) {
        toast.add({
            title: $i18n.t('toaster.errorTitle'),
            description: message,
            color: 'error',
            icon: 'i-lucide-circle-x',
            ...overrides,
        })
    }

    function showSuccess(message: string, overrides?: Parameters<typeof toast.add>[0]) {
        toast.add({
            title: $i18n.t('toaster.successTitle'),
            description: message,
            color: 'success',
            icon: 'i-lucide-circle-check',
            ...overrides,
        })
    }

    function remove(id: string) {
        toast.remove(id)
    }

    return {
        showWarning,
        showError,
        showSuccess,
        remove,
    }
}
