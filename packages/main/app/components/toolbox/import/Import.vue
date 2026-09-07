<script setup lang="ts">
import { useFileImport } from "~/composables/useFileImport";
import { useToolboxStore } from "~/stores/toolbox";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const toast = useToast();
const toolboxStore = useToolboxStore();
const { importFile, importFileUrl } = useFileImport();
const {
  url: urlImportDrawing,
  isLoading: isImportDrawingLoading,
  errorMessage: importDrawingErrorMessage,
  successMessage: importDrawingSuccessMessage,
  importDrawing,
} = useImportDrawing();

const filePathInfo = ref("");
const selectedFile = ref<File | undefined>();
const isLoading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const fileUrl = ref("");
const isFileUrlLoading = ref(false);

const acceptedFileTypes = [".kml", ".kmz", ".gpx", ".geojson", ".json", ".tif", ".tiff"];

const items = computed(() => [
  { label: t("toolbox.import.tabData"), slot: "file" },
  { label: t("toolbox.import.tabDrawing"), slot: "drawing" },
]);

function showToast(color: "error" | "success", message: string) {
  toast.add({ color, title: message });
}

watch(errorMessage, (v) => v && showToast("error", v));
watch(successMessage, (v) => v && showToast("success", v));
watch(importDrawingErrorMessage, (v) => v && showToast("error", v));
watch(importDrawingSuccessMessage, (v) => v && showToast("success", v));

async function handleImport() {
  if (!selectedFile.value) {
    errorMessage.value = t("toolbox.import.errorMessages.noFileSelected");
    return;
  }

  isLoading.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    await importFile(selectedFile.value);
    successMessage.value = t("toolbox.import.successMessage", {
      fileName: selectedFile.value.name,
    });
    selectedFile.value = undefined;
    filePathInfo.value = "";
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : t("toolbox.import.errorMessages.generalError");
  } finally {
    isLoading.value = false;
  }
}

async function handleFileUrlImport() {
  const url = fileUrl.value.trim();
  if (!url) {
    errorMessage.value = t("toolbox.import.errorMessages.noUrlEntered");
    return;
  }

  isFileUrlLoading.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    await importFileUrl(url);
    successMessage.value = t("toolbox.import.successMessage", {
      fileName: url.split("/").pop() ?? url,
    });
    fileUrl.value = "";
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : t("toolbox.import.errorMessages.generalError");
  } finally {
    isFileUrlLoading.value = false;
  }
}
</script>

<template>
  <UCard data-testid="toolbox-import-card">
    <template #header>
      <div class="flex items-start justify-between">
        <div class="font-semibold text-highlighted">
          {{ t("toolbox.import.title") }}
        </div>
        <UButton
          color="primary"
          variant="ghost"
          icon="i-lucide-x"
          size="xs"
          :aria-label="t('toolbox.import.close')"
          @click="toolboxStore.closeDetailPanel()"
        />
      </div>
    </template>
    <UTabs :items="items" :unmount-on-hide="false">
      <template #file>
        <div class="mt-1 mb-3 text-sm text-muted">
          {{
            t("toolbox.import.description", {
              types: acceptedFileTypes.join(", "),
            })
          }}
        </div>
        <UFileUpload
          v-model="selectedFile"
          color="neutral"
          highlight
          :disabled="isLoading"
          :description="acceptedFileTypes.join(', ')"
          :accept="acceptedFileTypes.join(',')"
        />
        <UButton
          color="primary"
          variant="solid"
          :disabled="!selectedFile || isLoading"
          :loading="isLoading"
          @click="handleImport"
          class="mt-3 w-full place-content-center"
        >
          {{ t("toolbox.import.importFileButton") }}
        </UButton>
        <div class="mt-4 pt-4 border-t border-neutral">
          <div class="text-sm text-muted mb-2">
            {{ t("toolbox.import.fileUrlDescription") }}
          </div>
          <UInput
            v-model="fileUrl"
            type="url"
            class="w-full"
            :placeholder="t('toolbox.import.fileUrlPlaceholder')"
            :disabled="isFileUrlLoading"
            data-testid="file-url-input"
          />
          <UButton
            class="mt-2 w-full place-content-center"
            :disabled="!fileUrl.trim() || isFileUrlLoading"
            :loading="isFileUrlLoading"
            @click="handleFileUrlImport"
            data-testid="file-url-import-button"
          >
            {{ t("toolbox.import.importFileUrlButton") }}
          </UButton>
        </div>
      </template>
      <template #drawing>
        <UInput
          v-model="urlImportDrawing"
          type="text"
          class="mt-2 w-full"
          :placeholder="t('toolbox.import.urlPlaceholder')"
          :disabled="isImportDrawingLoading"
          data-testid="drawing-url-input"
        />
        <UButton
          color="primary"
          variant="solid"
          class="mt-3 w-full place-content-center"
          :disabled="!urlImportDrawing.trim() || isImportDrawingLoading"
          :loading="isImportDrawingLoading"
          @click="importDrawing"
          data-testid="drawing-import-button"
        >
          {{ t("toolbox.import.importUrlButton") }}
        </UButton>
      </template>
    </UTabs>
  </UCard>
</template>
