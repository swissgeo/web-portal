<script setup lang="ts">
import { useDrawing } from "@swissgeo/drawing";
import { useMap } from "@swissgeo/map";
import { IconButton } from "@swissgeo/skeleton";

const { t } = useI18n();
const { importKml, mountDrawingLayer } = useDrawing();
const { olMap } = useMap();

defineEmits<{
  close: [];
}>();

const url = ref("");
const isLoading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

function extractKmlUrl(redirectUrl: string): string {
  try {
    const parsed = new URL(redirectUrl);
    const hash = parsed.hash;
    if (!hash) {
      return redirectUrl;
    }

    const hashQuery = hash.split("?")[1];
    if (!hashQuery) {
      return redirectUrl;
    }

    const params = new URLSearchParams(hashQuery);
    const layers = params.get("layers");
    if (!layers) {
      return redirectUrl;
    }

    const layerParts = layers.split(";");
    for (const layer of layerParts) {
      if (layer.startsWith("KML|")) {
        return decodeURIComponent(layer.substring(4));
      }
    }

    return redirectUrl;
  } catch {
    return redirectUrl;
  }
}

async function handleImport() {
  if (!url.value.trim()) {
    errorMessage.value = "Please enter a URL";
    return;
  }

  isLoading.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    const resolveResponse = await $fetch<{ redirectUrl: string }>(
      "/api/wpa/v1/drawing/resolve-url",
      {
        params: { url: url.value },
      },
    );

    const kmlUrl = extractKmlUrl(resolveResponse.redirectUrl);

    const kmlResponse = await fetch(kmlUrl);
    if (!kmlResponse.ok) {
      throw new Error(`Failed to fetch KML: ${kmlResponse.statusText}`);
    }

    const kmlText = await kmlResponse.text();
    mountDrawingLayer(olMap.value);
    importKml(kmlText);

    successMessage.value = "Drawing imported successfully";
    url.value = "";
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "Failed to import drawing";
  } finally {
    isLoading.value = false;
  }
}
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
      <IconButton
        :disabled="!url.trim() || isLoading"
        @click="handleImport"
        iconName="Upload"
        title="Import drawing"
        data-testid="drawing-import-button"
      />
      <IconButton
        @click="$emit('close')"
        iconName="X"
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
  </div>
</template>
