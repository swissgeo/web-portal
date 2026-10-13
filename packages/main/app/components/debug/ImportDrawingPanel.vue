<script setup lang="ts">
import { useImportDrawing } from "~/composables/useImportDrawing";

const { t } = useI18n();
const {
  url,
  isLoading,
  errorMessage,
  successMessage,
  importLegacyDrawing,
  isConfirmModalOpen,
  hasAdminLink,
  resolveConfirm,
} = useImportDrawing();

defineEmits<{
  close: [];
}>();

const confirmNote = computed(() => {
  const temporaryNote = t("toolbox.import.drawingReplaceConfirmTemporaryNote");
  return hasAdminLink.value
    ? `${temporaryNote} ${t("toolbox.import.drawingReplaceConfirmAdminNote")}`
    : temporaryNote;
});
</script>

<template>
  <div class="p-4">
    <div class="mb-4">
      <h3 class="mb-2 text-lg font-semibold">
        {{ t("debug.importDrawingPanelTitle") }}
      </h3>
    </div>

    <div class="flex items-center gap-2">
      <input
        v-model="url"
        type="text"
        class="flex-1 rounded border border-gray-300 px-3 py-2"
        placeholder="e.g. https://s.geo.admin.ch/8gzh9bzzmef5"
        :disabled="isLoading"
        data-testid="drawing-url-input"
      />
      <UButton
        :disabled="!url.trim() || isLoading"
        @click="importLegacyDrawing"
        icon="i-lucide-upload"
        color="primary"
        variant="solid"
        title="Import drawing"
        data-testid="drawing-import-button"
      />
      <UButton
        @click="$emit('close')"
        icon="i-lucide-x"
        color="primary"
        variant="ghost"
        title="Close"
        data-testid="drawing-import-close-button"
      />
    </div>

    <!-- Success message -->
    <div
      v-if="successMessage"
      class="mt-3 rounded bg-green-100 p-2 text-sm text-green-800"
    >
      {{ successMessage }}
    </div>

    <!-- Error message -->
    <div
      v-if="errorMessage"
      class="mt-3 rounded bg-red-100 p-2 text-sm text-red-800"
    >
      {{ errorMessage }}
    </div>

    <!-- Loading indicator -->
    <div
      v-if="isLoading"
      class="mt-3 flex items-center gap-2 text-sm text-gray-600"
    >
      <span>Importing drawing...</span>
    </div>
    <ConfirmDialog
      v-model:open="isConfirmModalOpen"
      :title="t('toolbox.import.drawingReplaceConfirmTitle')"
      :description="t('toolbox.import.drawingReplaceConfirmDescription')"
      :note="confirmNote"
      :confirm-label="t('toolbox.import.drawingReplaceConfirmConfirm')"
      :cancel-label="t('toolbox.import.drawingReplaceConfirmCancel')"
      @confirm="resolveConfirm(true)"
      @cancel="resolveConfirm(false)"
      data-testid="drawing-replace-confirm-dialog"
    />
  </div>
</template>
