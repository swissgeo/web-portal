/**
 * Basically just a wrapper with some helping functions
 * We could theoretically be using the toaster directly, but I suppose it's a good idea
 * to centralize all the calls here and get a consistant usage
 */
export function useToaster() {
  const { $i18n } = useNuxtApp();
  const toast = useToast();

  const icons: Record<string, string> = {
    success: "i-lucide-circle-check",
    error: "i-lucide-octagon-alert",
    warning: "i-lucide-triangle-alert",
    info: "i-lucide-info",
    primary: "i-lucide-bell",
    neutral: "i-lucide-bell",
  };

  function showWarning(
    message: string,
    overrides?: Parameters<typeof toast.add>[0],
  ) {
    toast.add({
      title: $i18n.t("toaster.warningTitle"),
      description: message,
      color: "warning",
      icon: icons.warning,
      ...overrides,
    });
  }

  function showError(
    message: string,
    overrides?: Parameters<typeof toast.add>[0],
  ) {
    toast.add({
      title: $i18n.t("toaster.errorTitle"),
      description: message,
      color: "error",
      icon: icons.error,
      ...overrides,
    });
  }

  function showSuccess(
    message: string,
    overrides?: Parameters<typeof toast.add>[0],
  ) {
    toast.add({
      title: $i18n.t("toaster.successTitle"),
      description: message,
      color: "success",
      icon: icons.success,
      ...overrides,
    });
  }

  function add(toastOptions: Parameters<typeof toast.add>[0]) {
    return toast.add({
      icon: toastOptions.color ? icons[toastOptions.color] : icons.neutral,
      ...toastOptions,
    });
  }

  function remove(id: string) {
    toast.remove(id);
  }

  return {
    ...toast,
    add,
    showWarning,
    showError,
    showSuccess,
    remove,
  };
}
