import { useDrawing } from "@swissgeo/drawing";
import { useMap } from "@swissgeo/map";

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

export function useImportDrawing() {
  const { importKml, mountDrawingLayer } = useDrawing();
  const { olMap } = useMap();

  const url = ref("");
  const isLoading = ref(false);
  const errorMessage = ref("");
  const successMessage = ref("");

  async function importDrawing(): Promise<void> {
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

  return {
    url,
    isLoading,
    errorMessage,
    successMessage,
    importDrawing,
  };
}
