import type { DrawingsMetadataResponse } from "@swissgeo/drawing-sharing";
import type { Map as OlMap } from "ol";

import { useDrawing } from "@swissgeo/drawing";
import { useMap } from "@swissgeo/map";
import { useI18n } from "vue-i18n";

import { useConfirmDrawingReplacement } from "@/composables/useConfirmDrawingReplacement";

import { useDrawingImportStore } from "../stores/drawingImport";

export type SwissgeoUrlValidationResult = {
  isValid: boolean;
  drawingId: string;
  adminId: string;
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
      drawingId: "",
      adminId: "",
      adminIdProvided: false,
    };
  }

  if (!isSwissgeoServiceDrawingsUrl(url)) {
    return {
      isValid: false,
      drawingId: "",
      adminId: "",
      adminIdProvided: false,
    };
  }

  try {
    const parsed = new URL(url);
    const drawingId = parsed.pathname.split("/").pop();

    const hash = parsed.hash.trim().slice(1);

    // The DrawingID is supposed to be a UUID.
    if (!drawingId || !isUuid(drawingId)) {
      return {
        isValid: false,
        drawingId: "",
        adminId: "",
        adminIdProvided: !!hash,
      };
    }

    // The admin ID must be validated
    let adminId: string | null = hash || "";
    if (adminId && !isUuid(adminId)) {
      adminId = "";
    }

    try {
      await fetchDrawingMetadata(drawingId);
    } catch {
      return {
        isValid: false,
        drawingId: "",
        adminId: "",
        adminIdProvided: !!hash,
      };
    }

    const authStatus = await checkDrawingAuth(drawingId, adminId);

    return {
      isValid: true,
      drawingId: drawingId,
      adminId: authStatus === 204 ? adminId : "",
      adminIdProvided: !!hash,
    };
  } catch {
    return {
      isValid: false,
      drawingId: "",
      adminId: "",
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

function removeAdminIdFromUrl(url: string): string {
  const adminIdIndex = url.indexOf("@adminId=");
  if (adminIdIndex !== -1) {
    return url.substring(0, adminIdIndex);
  }
  return url;
}

export async function checkDrawingAuth(
  drawingId: string,
  adminId: string = "",
): Promise<number> {
  const runtimeConfig = useRuntimeConfig();
  const drawingServiceEndpoint = runtimeConfig.public
    .drawingServiceEndpoint as string;

  const res = await fetch(`${drawingServiceEndpoint}/${drawingId}/check-auth`, {
    headers: adminId
      ? new Headers({
          "Swissgeo-Admin-Id": adminId,
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

export function extractDrawingId(drawingUrl: string): string {
  const id = new URL(drawingUrl).pathname.split("/").pop() ?? "";
  if (!id) {
    throw new Error(`Invalid drawing url: ${drawingUrl}`);
  }
  return id;
}

export function assertAllowedDrawingDomain(drawingUrl: string): void {
  const allowedDomains = useRuntimeConfig().public
    .drawingAllowedDomains as string[];
  const { hostname } = new URL(drawingUrl);
  if (!allowedDomains.includes(hostname)) {
    throw new Error(`Drawing url host not allowed: ${hostname}`);
  }
}

export class DrawingFetchError extends Error {
  readonly status: number;
  readonly statusText: string;

  constructor(drawingUrl: string, status: number, statusText: string) {
    super(`Failed to fetch drawing: ${status} ${drawingUrl}`);
    this.name = "DrawingFetchError";
    this.status = status;
    this.statusText = statusText;
  }
}

export async function fetchDrawingKmz(
  drawingUrl: string,
): Promise<ArrayBuffer> {
  const res = await fetch(drawingUrl);
  if (!res.ok) {
    throw new DrawingFetchError(drawingUrl, res.status, res.statusText);
  }
  return await res.arrayBuffer();
}

export async function importDrawingKmz(
  map: OlMap,
  kmzBuffer: ArrayBuffer,
  clearExisting: boolean = true,
): Promise<boolean> {
  const { mountDrawingLayer, importKmz } = useDrawing();
  mountDrawingLayer(map);
  return await importKmz(kmzBuffer, clearExisting);
}

export function useImportDrawing() {
  const {
    importKml,
    mountDrawingLayer,
    clearDrawingLayer,
    unmountDrawingLayer,
    drawingVectorLayer,
  } = useDrawing();

  const importDrawingStore = useDrawingImportStore();
  const { drawingId, drawingAdminId } = storeToRefs(importDrawingStore);

  const {
    isConfirmModalOpen,
    noteVariant,
    confirmReplaceDrawing,
    resolveConfirm,
  } = useConfirmDrawingReplacement();
  const { olMap } = useMap();
  const { t } = useI18n();
  const runtimeConfig = useRuntimeConfig();

  const isCheckingUrl = ref(false);
  const url = ref("");
  const isLoading = ref(false);
  const errorMessage = ref("");
  const successMessage = ref("");

  const isUrlOnValidLegacyDomain = computed(() => {
    const allowedDomains = runtimeConfig.public
      .drawingAllowedDomains as string[];
    const hostname = (() => {
      try {
        return new URL(url.value.trim()).hostname;
      } catch {
        return null;
      }
    })();
    return hostname ? allowedDomains.includes(hostname) : false;
  });

  const swissGeoUrlValidation = ref<SwissgeoUrlValidationResult>({
    isValid: false,
    drawingId: "",
    adminId: "",
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
      drawingId: "",
      adminId: "",
      adminIdProvided: false,
    };
    if (value.trim()) {
      errorMessage.value = "";
      successMessage.value = "";
    }

    const validation = await validateSwissgeoServiceDrawingsUrl(value.trim());
    if (!stale) {
      swissGeoUrlValidation.value = validation;
      isCheckingUrl.value = false;
    }
  });

  async function importLegacyDrawing(): Promise<void> {
    if (!url.value.trim()) {
      errorMessage.value = t("toolbox.import.errorMessages.noUrlEntered");
      return;
    }

    isLoading.value = true;
    errorMessage.value = "";
    successMessage.value = "";
    let hasMountedLayer = false;
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

      const kmlTexts = await Promise.all(
        datasetUrls.map(async (datasetUrl) => {
          const kmlResponse = await fetch(removeAdminIdFromUrl(datasetUrl));
          if (!kmlResponse.ok) {
            throw new Error(
              t("toolbox.import.errorMessages.kmlFetchFailed", {
                status: kmlResponse.statusText,
              }),
            );
          }
          return kmlResponse.text();
        }),
      );

      const hasAdminLinkInUrl = datasetUrls.some((datasetUrl) =>
        datasetUrl.includes("@adminId="),
      );

      if (
        !(await confirmReplaceDrawing({
          noteVariant: hasAdminLinkInUrl ? "legacyCopy" : "temporary",
        }))
      ) {
        return; // silent cancel
      }
      clearDrawingLayer();
      mountDrawingLayer(olMap.value);
      hasMountedLayer = true;

      for (const kmlText of kmlTexts) {
        importKml(kmlText);
      }

      successMessage.value = t("toolbox.import.drawingSuccessMessage");
      url.value = "";
    } catch (error) {
      const featureCount =
        drawingVectorLayer.getSource()?.getFeatures().length ?? 0;
      if (hasMountedLayer && featureCount === 0) {
        unmountDrawingLayer();
      }
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

    isLoading.value = true;

    try {
      let kmzBuffer: ArrayBuffer;
      try {
        kmzBuffer = await fetchDrawingKmz(url.value);
      } catch (error) {
        if (error instanceof DrawingFetchError) {
          throw new Error(
            t("toolbox.import.errorMessages.fetchFailed", {
              status: error.statusText,
            }),
            { cause: error },
          );
        }
        throw error;
      }
      if (
        !(await confirmReplaceDrawing({
          noteVariant: asAdmin ? "adminSync" : "temporary",
        }))
      ) {
        return;
      }

      // Import the KMZ content. The second argument ensures that the existing drawing layer is cleared beforehand,
      // but only if the import is successful.
      const success = await importDrawingKmz(olMap.value, kmzBuffer);

      if (!success) {
        throw new Error(t("toolbox.import.errorMessages.drawingImportFailed"));
      }

      // If the user decides to imports a Swissgeo drawing as an admin,
      // their previously existing drawings are cleared automatically before adding the imported ones.
      // In addition, the user is now using the drawing ID and admin ID of the imported drawing,
      // which makes them further editable
      if (swissGeoUrlValidation.value.adminId && asAdmin) {
        drawingAdminId.value = swissGeoUrlValidation.value.adminId;
        drawingId.value = swissGeoUrlValidation.value.drawingId;
      } else {
        importDrawingStore.resetDrawingImportInfo();
      }
    } finally {
      isLoading.value = false;
    }
  }

  return {
    url,
    isLoading,
    errorMessage,
    successMessage,
    importLegacyDrawing,
    importSwissgeoDrawing,
    swissGeoUrlValidation,
    isCheckingUrl,
    isUrlOnValidLegacyDomain,
    isConfirmModalOpen,
    noteVariant,
    resolveConfirm,
  };
}
