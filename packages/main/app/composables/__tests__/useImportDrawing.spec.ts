import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { setActivePinia, createPinia } from "pinia";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { useImportDrawing } from "@/composables/useImportDrawing";

const { fetchMock } = vi.hoisted(() => ({
  fetchMock: vi.fn().mockResolvedValue({
    ok: true,
    text: () => Promise.resolve("<kml></kml>"),
  }),
}));

const { resolveUrlMock } = vi.hoisted(() => ({
  resolveUrlMock: vi.fn().mockResolvedValue({
    redirectUrl:
      "https://sys-map.dev.bgdi.ch/#/map?layers=KML%7Chttps://sys-public.dev.bgdi.ch/api/kml/files/abc123",
  }),
}));

const { runtimeConfigMock } = vi.hoisted(() => ({
  runtimeConfigMock: {
    public: {
      drawingAllowedDomains: [
        "s.geo.admin.ch",
        "public.geo.admin.ch",
        "map.geo.admin.ch",
        "sys-s.dev.bgdi.ch",
        "sys-public.dev.bgdi.ch",
      ],
    },
  },
}));

mockNuxtImport("useI18n", () => () => ({
  t: (key: string) => key,
  te: () => true,
}));

mockNuxtImport("$fetch", () => resolveUrlMock);
mockNuxtImport("useRuntimeConfig", () => () => runtimeConfigMock);

vi.stubGlobal("fetch", fetchMock);

const importKmlSpy = vi.fn();
const mountDrawingLayerSpy = vi.fn();
vi.mock("@swissgeo/drawing", () => ({
  useDrawing: vi.fn(() => ({
    importKml: importKmlSpy,
    mountDrawingLayer: mountDrawingLayerSpy,
  })),
}));

vi.mock("@swissgeo/map", () => ({
  useMap: vi.fn(() => ({
    olMap: { value: {} },
  })),
}));

describe("useImportDrawing", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    resolveUrlMock.mockResolvedValue({
      redirectUrl:
        "https://sys-map.dev.bgdi.ch/#/map?layers=KML%7Chttps://sys-public.dev.bgdi.ch/api/kml/files/abc123",
    });
  });

  it("returns reactive state and importDrawing function", () => {
    const { url, isLoading, errorMessage, successMessage, importDrawing } =
      useImportDrawing();

    expect(url.value).toBe("");
    expect(isLoading.value).toBe(false);
    expect(errorMessage.value).toBe("");
    expect(successMessage.value).toBe("");
    expect(typeof importDrawing).toBe("function");
  });

  it("sets error when URL is empty", async () => {
    const { errorMessage, importDrawing } = useImportDrawing();

    await importDrawing();

    expect(errorMessage.value).toBe(
      "toolbox.import.errorMessages.noUrlEntered",
    );
  });

  it("resolves short URL, extracts KML, and imports", async () => {
    const { url, importDrawing, successMessage } = useImportDrawing();
    url.value = "https://s.geo.admin.ch/test123";

    await importDrawing();

    expect(resolveUrlMock).toHaveBeenCalledWith(
      "/api/wpa/v1/drawing/resolve-url",
      { params: { url: "https://s.geo.admin.ch/test123" } },
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "https://sys-public.dev.bgdi.ch/api/kml/files/abc123",
    );
    expect(mountDrawingLayerSpy).toHaveBeenCalled();
    expect(importKmlSpy).toHaveBeenCalled();
    expect(successMessage.value).toBe("toolbox.import.drawingSuccessMessage");
  });

  it("handles viewer URL directly without server redirect", async () => {
    const { url, importDrawing } = useImportDrawing();
    url.value =
      "https://map.geo.admin.ch/#/map?layers=KML%7Chttps://public.geo.admin.ch/api/kml/files/test123";

    await importDrawing();

    expect(resolveUrlMock).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith(
      "https://public.geo.admin.ch/api/kml/files/test123",
    );
    expect(importKmlSpy).toHaveBeenCalled();
  });

  it("handles direct KML URL without server redirect", async () => {
    const { url, importDrawing } = useImportDrawing();
    url.value = "https://public.geo.admin.ch/api/kml/files/test123";

    await importDrawing();

    expect(resolveUrlMock).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith(
      "https://public.geo.admin.ch/api/kml/files/test123",
    );
    expect(importKmlSpy).toHaveBeenCalled();
  });

  it("imports multiple KML drawings from viewer URL", async () => {
    const { url, importDrawing } = useImportDrawing();
    url.value =
      "https://map.geo.admin.ch/#/map?layers=KML%7Chttps://public.geo.admin.ch/api/kml/files/abc;KML%7Chttps://public.geo.admin.ch/api/kml/files/def";

    await importDrawing();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://public.geo.admin.ch/api/kml/files/abc",
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "https://public.geo.admin.ch/api/kml/files/def",
    );
    expect(importKmlSpy).toHaveBeenCalledTimes(2);
  });

  it("sets error when no KML URL found in viewer URL", async () => {
    const { url, importDrawing, errorMessage } = useImportDrawing();
    url.value = "https://map.geo.admin.ch/#/map?layers=ch.test";

    await importDrawing();

    expect(errorMessage.value).toBe("toolbox.import.errorMessages.noKmlFound");
  });

  it("sets error when domain is not allowed (server-side)", async () => {
    resolveUrlMock.mockRejectedValueOnce(
      new Error("Fetching from this domain is not allowed"),
    );

    const { url, importDrawing, errorMessage } = useImportDrawing();
    url.value = "https://evil.com/malicious.kml";

    await importDrawing();

    expect(errorMessage.value).toBe("Fetching from this domain is not allowed");
  });

  it("sets error when KML URL domain is not allowed (client-side)", async () => {
    const { url, importDrawing, errorMessage } = useImportDrawing();
    url.value =
      "https://map.geo.admin.ch/#/map?layers=KML%7Chttps://evil.com/malicious.kml";

    await importDrawing();

    expect(errorMessage.value).toContain("domainNotAllowed");
  });

  it("clears URL on success", async () => {
    const { url, importDrawing } = useImportDrawing();
    url.value = "https://s.geo.admin.ch/test123";

    await importDrawing();

    expect(url.value).toBe("");
  });

  it("sets error when resolve fails", async () => {
    resolveUrlMock.mockRejectedValueOnce(new Error("Resolve failed"));

    const { url, importDrawing, errorMessage } = useImportDrawing();
    url.value = "https://s.geo.admin.ch/test123";

    await importDrawing();

    expect(errorMessage.value).toBe("Resolve failed");
  });

  it("sets error when KML fetch fails", async () => {
    fetchMock.mockRejectedValueOnce(new Error("Network error"));

    const { url, importDrawing, errorMessage } = useImportDrawing();
    url.value = "https://s.geo.admin.ch/test123";

    await importDrawing();

    expect(errorMessage.value).toBe("Network error");
  });

  it("sets error when KML response is not ok", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      statusText: "Not Found",
    });

    const { url, importDrawing, errorMessage } = useImportDrawing();
    url.value = "https://s.geo.admin.ch/test123";

    await importDrawing();

    expect(errorMessage.value).toBe(
      "toolbox.import.errorMessages.kmlFetchFailed",
    );
  });

  it("sets isLoading during import and resets after", async () => {
    const { url, isLoading, importDrawing } = useImportDrawing();
    url.value = "https://s.geo.admin.ch/test123";

    const promise = importDrawing();
    expect(isLoading.value).toBe(true);

    await promise;
    expect(isLoading.value).toBe(false);
  });
});
