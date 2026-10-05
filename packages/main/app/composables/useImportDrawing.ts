import type { DrawingsMetadataResponse } from "@swissgeo/drawing-sharing";

import { useDrawing } from "@swissgeo/drawing";
import { useMap } from "@swissgeo/map";
import { useI18n } from "vue-i18n";

export type SwissgeoUrlValidationResult = {
  isValid: boolean;
  drawingId: string | null;
  adminId: string | null;
  adminIdProvided: boolean;
};

function isDirectKmlUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return /^\/api\/kml\/files\//.test(parsed.pathname);
  } catch {
    return false;
  }
}

function isSwissgeoServiceDrawingsUrl(url: string): boolean {
  const drawingServiceWithoutScheme = useRuntimeConfig()
    .public.drawingServiceEndpoint.split("//")
    .pop() as string;
  const urlWithoutScheme = url.split("//").pop();
  return urlWithoutScheme?.startsWith(drawingServiceWithoutScheme) ?? false;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}

/**
 * Verify if the given URL is a valid Swissgeo service drawings URL and extract the drawing and admin IDs.
 * Note: the admin ID, when provided, allows the user to further modify the drawing.
 */
async function validateSwissgeoServiceDrawingsUrl(
  url: string,
): Promise<SwissgeoUrlValidationResult> {
  if (!url.trim()) {
    return {
      isValid: false,
      drawingId: null,
      adminId: null,
      adminIdProvided: false,
    };
  }

  if (!isSwissgeoServiceDrawingsUrl(url)) {
    return {
      isValid: false,
      drawingId: null,
      adminId: null,
      adminIdProvided: false,
    };
  }

  try {
    const parsed = new URL(url);
    const drawingId = parsed.pathname.split("/").pop();

    const hash = parsed.hash.trim().slice(1);

    // The DrawingID is suppoed to be a UUID.
    if (!drawingId || !isUuid(drawingId)) {
      return {
        isValid: false,
        drawingId: null,
        adminId: null,
        adminIdProvided: !!hash,
      };
    }

    // The admin ID must be validated
    let adminId: string | null = hash || null;
    if (adminId && !isUuid(adminId)) {
      adminId = null;
    }

    try {
      await fetchDrawingMetadata(drawingId);
    } catch {
      return {
        isValid: false,
        drawingId: null,
        adminId: null,
        adminIdProvided: !!hash,
      };
    }

    const authStatus = await checkDrawingAuth(drawingId, adminId);

    return {
      isValid: true,
      drawingId: drawingId,
      adminId: authStatus === 204 ? adminId : null,
      adminIdProvided: !!hash,
    };
  } catch {
    return {
      isValid: false,
      drawingId: null,
      adminId: null,
      adminIdProvided: false,
    };
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

function removeAdminIdFromUrl(url: string): string {
  const adminIdIndex = url.indexOf("@adminId=");
  if (adminIdIndex !== -1) {
    return url.substring(0, adminIdIndex);
  }
  return url;
}

function validateDomain(url: string, allowedDomains: string[]): string | null {
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

async function checkDrawingAuth(
  drawingId: string,
  adminId: string | null = null,
) {
  const runtimeConfig = useRuntimeConfig();
  const drawingServiceEndpoint = runtimeConfig.public
    .drawingServiceEndpoint as string;

  const res = await fetch(`${drawingServiceEndpoint}/${drawingId}/check-auth`, {
    headers: adminId
      ? new Headers({
          Authorization: `Bearer ${adminId}`,
        })
      : undefined,
  });

  return res.status;
}

async function fetchDrawingMetadata(
  drawingId: string,
): Promise<DrawingsMetadataResponse> {
  const runtimeConfig = useRuntimeConfig();
  const drawingServiceEndpoint = runtimeConfig.public
    .drawingServiceEndpoint as string;

  const res = await fetch(`${drawingServiceEndpoint}/${drawingId}/metadata`);

  if (!res.ok) {
    throw new Error(`Failed to fetch drawing metadata: ${res.status}`);
  }

  return await res.json();
}

export function useImportDrawing() {
  const {
    importKml,
    importKmz,
    mountDrawingLayer,
    clearDrawingLayer,
    drawingAdminId,
    drawingId,
    drawingS3Url,
  } = useDrawing();
  const { olMap } = useMap();
  const { t } = useI18n();
  const runtimeConfig = useRuntimeConfig();

  const isCheckingUrl = ref(false);
  const url = ref("");
  const isLoading = ref(false);
  const errorMessage = ref("");
  const successMessage = ref("");

  const swissGeoUrlValidation = ref<SwissgeoUrlValidationResult>({
    isValid: false,
    drawingId: null,
    adminId: null,
    adminIdProvided: false,
  });

  // Check if the provided URL is a valid Swissgeo service drawings URL
  watch(url, async (value, _previousValue, onCleanup) => {
    let stale = false;
    onCleanup(() => {
      stale = true;
    });
    isCheckingUrl.value = true;
    swissGeoUrlValidation.value = {
      isValid: false,
      drawingId: null,
      adminId: null,
      adminIdProvided: false,
    };
    errorMessage.value = "";
    successMessage.value = "";

    const validation = await validateSwissgeoServiceDrawingsUrl(value.trim());
    if (!stale) {
      swissGeoUrlValidation.value = validation;
      isCheckingUrl.value = false;
    }
  });

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

      let datasetUrls: string[] = [];

      if (isDirectKmlUrl(inputUrl)) {
        datasetUrls = [inputUrl];
      } else if (isViewerUrl(inputUrl)) {
        datasetUrls = extractKmlUrls(inputUrl);
      } else {
        const resolveResponse = await $fetch<{ redirectUrl: string }>(
          "/api/wpa/v1/drawing/resolve-url",
          {
            params: { url: inputUrl },
          },
        );
        datasetUrls = extractKmlUrls(resolveResponse.redirectUrl);
      }

      if (datasetUrls.length === 0) {
        throw new Error(t("toolbox.import.errorMessages.noKmlFound"));
      }

      for (const kmlUrl of datasetUrls) {
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

      for (const kmlUrl of datasetUrls) {
        const kmlResponse = await fetch(removeAdminIdFromUrl(kmlUrl));
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

  /**
   * Import the data from the specified URL as a Swissgeo drawing.
   * Choose whether to import the drawing as an admin.
   * If as an admin, the URL must contain the admin ID and the drawing layer will be
   * cleared prior to importing the new drawing.
   */
  async function importSwissgeoDrawing(asAdmin: boolean) {
    if (!swissGeoUrlValidation.value) {
      return;
    }

    if (
      !swissGeoUrlValidation.value.isValid ||
      !swissGeoUrlValidation.value.drawingId
    ) {
      throw new Error(t("toolbox.import.errorMessages.generalError"));
    }

    if (asAdmin && !swissGeoUrlValidation.value.adminId) {
      throw new Error(t("toolbox.import.errorMessages.adminRequired"));
    }

    const drawingIdUrlObj = new URL(url.value);
    drawingIdUrlObj.search = "";

    isLoading.value = true;

    const res = await fetch(drawingIdUrlObj.href);
    if (!res.ok) {
      isLoading.value = false;
      throw new Error(
        t("toolbox.import.errorMessages.fetchFailed", {
          status: res.statusText,
        }),
      );
    }

    clearDrawingLayer();

    mountDrawingLayer(olMap.value);

    // If the user decides to imports a Swissgeo drawing as an admin,
    // their previously existing drawings are cleared automatically before adding the imported ones.
    // In addition, the user is now using the drawing ID and admin ID of the imported drawing,
    // which makes them futher editable
    if (swissGeoUrlValidation.value.adminId && asAdmin) {
      drawingAdminId.value = swissGeoUrlValidation.value.adminId;
      drawingId.value = swissGeoUrlValidation.value.drawingId;
      drawingS3Url.value = drawingIdUrlObj.href;
    }

    const kmzBuffer = await res.arrayBuffer();
    await importKmz(kmzBuffer);
    isLoading.value = false;
  }

  return {
    url,
    isLoading,
    errorMessage,
    successMessage,
    importDrawing,
    importSwissgeoDrawing,
    swissGeoUrlValidation,
    isCheckingUrl,
  };
}
