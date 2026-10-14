import { useDrawing } from "@swissgeo/drawing";

export type ConfirmNoteVariant = "temporary" | "adminSync" | "legacyCopy";

export function useConfirmDrawingReplacement() {
  const { isDrawingLayerInLayerStore } = useDrawing();
  const isConfirmModalOpen = ref(false);
  const noteVariant = ref<ConfirmNoteVariant>("temporary");

  let resolveProceed: ((proceed: boolean) => void) | null = null;

  function confirmReplaceDrawing(options: {
    noteVariant: ConfirmNoteVariant;
  }): Promise<boolean> {
    if (!isDrawingLayerInLayerStore.value) {
      return Promise.resolve(true);
    }
    noteVariant.value = options.noteVariant;
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
    noteVariant,
    confirmReplaceDrawing,
    resolveConfirm,
  };
}
