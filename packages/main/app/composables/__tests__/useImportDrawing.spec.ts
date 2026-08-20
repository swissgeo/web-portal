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
    redirectUrl: "https://example.com/kml/test.kml",
  }),
}));

mockNuxtImport("useI18n", () => () => ({
  t: (key: string) => key,
  te: () => true,
}));

mockNuxtImport("$fetch", () => resolveUrlMock);

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

    expect(errorMessage.value).toBe("Please enter a URL");
  });

  it("resolves redirect, fetches KML, and imports", async () => {
    const { url, importDrawing, successMessage } = useImportDrawing();
    url.value = "https://s.geo.admin.ch/test123";

    await importDrawing();

    expect(resolveUrlMock).toHaveBeenCalledWith(
      "/api/wpa/v1/drawing/resolve-url",
      { params: { url: "https://s.geo.admin.ch/test123" } },
    );
    expect(fetchMock).toHaveBeenCalledWith("https://example.com/kml/test.kml");
    expect(mountDrawingLayerSpy).toHaveBeenCalled();
    expect(importKmlSpy).toHaveBeenCalled();
    expect(successMessage.value).toBe("Drawing imported successfully");
  });

  it("parses KML URL from viewer URL with KML in layers", async () => {
    resolveUrlMock.mockResolvedValueOnce({
      redirectUrl:
        "https://sys-map.dev.bgdi.ch/#/map?layers=ch.test;KML%7Chttps://sys-public.dev.bgdi.ch/api/kml/files/abc123",
    });

    const { url, importDrawing } = useImportDrawing();
    url.value = "https://s.geo.admin.ch/test123";

    await importDrawing();

    expect(fetchMock).toHaveBeenCalledWith(
      "https://sys-public.dev.bgdi.ch/api/kml/files/abc123",
    );
    expect(importKmlSpy).toHaveBeenCalled();
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

    expect(errorMessage.value).toBe("Failed to fetch KML: Not Found");
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
