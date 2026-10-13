import { useDrawing } from "@swissgeo/drawing";

export function useConfirmDrawingReplacement() {
  const { isDrawingLayerInLayerStore } = useDrawing();
  const isConfirmModalOpen = ref(false);
  const hasAdminLink = ref(false);

  let resolveProceed: ((proceed: boolean) => void) | null = null;

  function confirmReplaceDrawing(options: {
    hasAdminLink: boolean;
  }): Promise<boolean> {
    if (!isDrawingLayerInLayerStore.value) {
      return Promise.resolve(true);
    }
    hasAdminLink.value = options.hasAdminLink;
    isConfirmModalOpen.value = true;
    return new Promise((resolve) => {
      resolveProceed = resolve;
    });
  }
  function resolveConfirm(proceed: boolean) {
    // by design, modals don't self close.
    isConfirmModalOpen.value = false;
    resolveProceed?.(proceed);
    resolveProceed = null;
  }

  // small safety: if for some reason the dialog is unmounted while open, we close it.
  onScopeDispose(() => resolveConfirm(false));

  return {
    isConfirmModalOpen,
    hasAdminLink,
    confirmReplaceDrawing,
    resolveConfirm,
  };
}
