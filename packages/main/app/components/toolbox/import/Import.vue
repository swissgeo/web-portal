<script setup lang="ts">
import { IconButton } from "@swissgeo/skeleton";
import { useFileImport } from "~/composables/useFileImport";
import { ref, useTemplateRef } from "vue";

const { importFile } = useFileImport();

const inputLocalFile = useTemplateRef<HTMLInputElement>("inputLocalFile");
const filePathInfo = ref("");
const selectedFile = ref<File | undefined>();
const isLoading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

const acceptedFileTypes = [".kml", ".kmz", ".gpx", ".geojson", ".json"];

async function handleImport() {
  if (!selectedFile.value) {
    errorMessage.value = "Please select a file first";
    return;
  }

  isLoading.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    await importFile(selectedFile.value);
    successMessage.value = `Successfully imported ${selectedFile.value.name}`;
    // Clear the file input after successful import
    selectedFile.value = undefined;
    filePathInfo.value = "";
    if (inputLocalFile.value) {
      inputLocalFile.value.value = "";
    }
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "Failed to import file";
  } finally {
    isLoading.value = false;
  }
}

function onFileSelected(evt: Event): void {
  const target = evt.target as HTMLInputElement;
  const file = target?.files?.[0] ?? undefined;
  selectedFile.value = file;
  filePathInfo.value = file ? file.name : "";
  // Clear previous messages
  errorMessage.value = "";
  successMessage.value = "";
}
</script>

<template>
  <UCard
    title="Import Local File"
    :description="`Accepted file types: ${acceptedFileTypes.join(', ')}`"
  >
    <div class="flex flex-wrap items-center gap-2">
      <input
        ref="inputLocalFile"
        type="file"
        :accept="acceptedFileTypes.join(',')"
        hidden
        data-testid="file-input"
        @change="onFileSelected"
      />
      <UButton
        color="neutral"
        variant="outline"
        type="button"
        data-testid="file-input-browse-button"
        :disabled="isLoading"
        @click="inputLocalFile?.click()"
      >
        Browse...
      </UButton>
      <input
        type="text"
        class="rounded border border-gray-300"
        :value="filePathInfo"
        placeholder="No file selected"
        readonly
        tabindex="-1"
        data-testid="file-input-text"
        @click="inputLocalFile?.click()"
      />
      <IconButton
        :disabled="!selectedFile || isLoading"
        @click="handleImport"
        iconName="Upload"
        title="Import file"
        class="grow justify-center"
      />
    </div>

    <!-- Success message -->
    <div
      v-if="successMessage"
      class="mt-3 rounded bg-green-100 p-2 text-sm text-green-800"
    >
      ✓ {{ successMessage }}
    </div>

    <!-- Error message -->
    <div
      v-if="errorMessage"
      class="mt-3 rounded bg-red-100 p-2 text-sm text-red-800"
    >
      ✗ {{ errorMessage }}
    </div>

    <!-- Loading indicator -->
    <div
      v-if="isLoading"
      class="mt-3 flex items-center gap-2 text-sm text-gray-600"
    >
      <span class="animate-spin">⏳</span>
      <span>Importing file...</span>
    </div>
  </UCard>
</template>
