import { useDrawing } from "@swissgeo/drawing";
import { useMap } from "@swissgeo/map";
import { useI18n } from "vue-i18n";

function isDirectKmlUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return /^\/api\/kml\/files\//.test(parsed.pathname);
  } catch {
    return false;
  }
}

function isViewerUrl(url: string): boolean {
  return url.includes("#/map") || url.includes("layers=KML");
}

function extractKmlUrls(url: string): string[] {
  try {
    const parsed = new URL(url);

    const hash = parsed.hash;
    const hashQuery = hash.split("?")[1];
    if (hashQuery) {
      const params = new URLSearchParams(hashQuery);
      const layers = params.get("layers");
      if (layers) {
        return layers
          .split(";")
          .filter((l) => l.startsWith("KML|"))
          .map((l) => decodeURIComponent(l.substring(4)));
      }
    }

    const layers = parsed.searchParams.get("layers");
    if (layers) {
      return layers
        .split(";")
        .filter((l) => l.startsWith("KML|"))
        .map((l) => decodeURIComponent(l.substring(4)));
    }

    return [];
  } catch {
    return [];
  }
}

function validateDomain(
  url: string,
  allowedDomains: string[],
): string | null {
  try {
    const hostname = new URL(url).hostname;
    if (!allowedDomains.includes(hostname)) {
      return hostname;
    }
    return null;
  } catch {
    return null;
  }
}

export function useImportDrawing() {
  const { importKml, mountDrawingLayer } = useDrawing();
  const { olMap } = useMap();
  const { t } = useI18n();
  const runtimeConfig = useRuntimeConfig();

  const url = ref("");
  const isLoading = ref(false);
  const errorMessage = ref("");
  const successMessage = ref("");

  async function importDrawing(): Promise<void> {
    if (!url.value.trim()) {
      errorMessage.value = t("toolbox.import.errorMessages.noUrlEntered");
      return;
    }

    isLoading.value = true;
    errorMessage.value = "";
    successMessage.value = "";

    try {
      const inputUrl = url.value.trim();
      const allowedDomains = runtimeConfig.public
        .drawingAllowedDomains as string[];

      let kmlUrls: string[] = [];

      if (isDirectKmlUrl(inputUrl)) {
        kmlUrls = [inputUrl];
      } else if (isViewerUrl(inputUrl)) {
        kmlUrls = extractKmlUrls(inputUrl);
      } else {
        const resolveResponse = await $fetch<{ redirectUrl: string }>(
          "/api/wpa/v1/drawing/resolve-url",
          {
            params: { url: inputUrl },
          },
        );
        kmlUrls = extractKmlUrls(resolveResponse.redirectUrl);
      }

      if (kmlUrls.length === 0) {
        throw new Error(t("toolbox.import.errorMessages.noKmlFound"));
      }

      for (const kmlUrl of kmlUrls) {
        const disallowedDomain = validateDomain(kmlUrl, allowedDomains);
        if (disallowedDomain) {
          throw new Error(
            t("toolbox.import.errorMessages.domainNotAllowed", {
              domain: disallowedDomain,
            }),
          );
        }
      }

      mountDrawingLayer(olMap.value);

      for (const kmlUrl of kmlUrls) {
        const kmlResponse = await fetch(kmlUrl);
        if (!kmlResponse.ok) {
          throw new Error(
            t("toolbox.import.errorMessages.kmlFetchFailed", {
              status: kmlResponse.statusText,
            }),
          );
        }

        const kmlText = await kmlResponse.text();
        importKml(kmlText);
      }

      successMessage.value = t("toolbox.import.drawingSuccessMessage");
      url.value = "";
    } catch (error) {
      errorMessage.value =
        error instanceof Error
          ? error.message
          : t("toolbox.import.errorMessages.drawingImportFailed");
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
