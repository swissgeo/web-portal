<script setup lang="ts">
import { useFileImport } from "~/composables/useFileImport";
import { useToolboxStore } from "~/stores/toolbox";
import { ref } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const toast = useToast();
const toolboxStore = useToolboxStore();
const { importFile } = useFileImport();
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

const acceptedFileTypes = [".kml", ".kmz", ".gpx", ".geojson", ".json"];

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
    successMessage.value = t("toolbox.import.sucessMessage", {
      fileName: selectedFile.value.name,
    });
    // Clear the file input after successful import
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

const items = [
  {
    label: "File",
    slot: "file",
  },
  {
    label: "URL",
    slot: "url",
  },
];

watch(
  () => errorMessage.value,
  (newValue) => {
    if (newValue) {
      toast.add({
        color: "error",
        title: newValue,
      });
    }
  },
);

watch(
  () => successMessage.value,
  (newValue) => {
    if (newValue) {
      toast.add({
        color: "success",
        title: newValue,
      });
    }
  },
);

watch(
  () => importDrawingErrorMessage.value,
  (newValue) => {
    if (newValue) {
      toast.add({
        color: "error",
        title: newValue,
      });
    }
  },
);

watch(
  () => importDrawingSuccessMessage.value,
  (newValue) => {
    if (newValue) {
      toast.add({
        color: "success",
        title: newValue,
      });
    }
  },
);
</script>

<template>
  <UCard data-testid="toolbox-import-card">
    <template #header>
      <div class="flex items-start justify-between">
        <div>
          <div class="font-semibold text-highlighted">
            {{ t("toolbox.import.title") }}
          </div>
          <div class="mt-1 text-sm text-muted">
            {{
              t("toolbox.import.description", {
                types: acceptedFileTypes.join(", "),
              })
            }}
          </div>
        </div>
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide-x"
          size="sm"
          :aria-label="t('toolbox.import.close')"
          @click="toolboxStore.closeDetailPanel()"
        />
      </div>
    </template>
    <UTabs :items="items" :unmount-on-hide="false">
      <template #file>
        <UFileUpload
          v-model="selectedFile"
          color="neutral"
          highlight
          :disabled="isLoading"
          :description="acceptedFileTypes.join(', ')"
          :accept="acceptedFileTypes.join(',')"
        />
        <UButton
          :disabled="!selectedFile || isLoading"
          :loading="isLoading"
          @click="handleImport"
          class="mt-3 w-full place-content-center"
        >
          {{ t("toolbox.import.importButton") }}
        </UButton>
      </template>
      <template #url>
        <UInput
          v-model="urlImportDrawing"
          type="text"
          class="mt-2 w-full"
          placeholder="https://s.geo.admin.ch/8gzh9bzzmef5"
          :disabled="isImportDrawingLoading"
          data-testid="drawing-url-input"
        />
        <UButton
          class="mt-3 w-full place-content-center"
          :disabled="!urlImportDrawing.trim() || isImportDrawingLoading"
          :loading="isImportDrawingLoading"
          @click="importDrawing"
          data-testid="drawing-import-button"
        >
          {{ t("toolbox.import.importButton") }}
        </UButton>
      </template>
    </UTabs>
  </UCard>
</template>
