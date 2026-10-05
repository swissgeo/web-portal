import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { flushPromises } from "@vue/test-utils";
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
      drawingServiceEndpoint: "https://drawings.test/api/drawings",
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

vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

mockNuxtImport("$fetch", () => resolveUrlMock);
mockNuxtImport("useRuntimeConfig", () => () => runtimeConfigMock);

vi.stubGlobal("fetch", fetchMock);

const importKmzSpy = vi.fn();
const clearDrawingLayerSpy = vi.fn();
const drawingId = { value: null as string | null };
const drawingAdminId = { value: null as string | null };
const drawingS3Url = { value: null as string | null };
const importKmlSpy = vi.fn();
const mountDrawingLayerSpy = vi.fn();
vi.mock("@swissgeo/drawing", () => ({
  useDrawing: vi.fn(() => ({
    importKml: importKmlSpy,
    importKmz: importKmzSpy,
    clearDrawingLayer: clearDrawingLayerSpy,
    drawingId,
    drawingAdminId,
    drawingS3Url,
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
    vi.resetAllMocks();
    drawingId.value = null;
    drawingAdminId.value = null;
    drawingS3Url.value = null;
    fetchMock.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve("<kml></kml>"),
    });
    resolveUrlMock.mockResolvedValue({
      redirectUrl:
        "https://sys-map.dev.bgdi.ch/#/map?layers=KML%7Chttps://sys-public.dev.bgdi.ch/api/kml/files/abc123",
    });
  });

  it("returns reactive state and importLegacyDrawing function", () => {
    const {
      url,
      isLoading,
      errorMessage,
      successMessage,
      importLegacyDrawing,
    } = useImportDrawing();

    expect(url.value).toBe("");
    expect(isLoading.value).toBe(false);
    expect(errorMessage.value).toBe("");
    expect(successMessage.value).toBe("");
    expect(typeof importLegacyDrawing).toBe("function");
  });

  it("sets error when URL is empty", async () => {
    const { errorMessage, importLegacyDrawing } = useImportDrawing();

    await flushPromises();
    await importLegacyDrawing();

    expect(errorMessage.value).toBe(
      "toolbox.import.errorMessages.noUrlEntered",
    );
  });

  it("resolves short URL, extracts KML, and imports", async () => {
    const { url, importLegacyDrawing, successMessage } = useImportDrawing();
    url.value = "https://s.geo.admin.ch/test123";

    await flushPromises();
    await importLegacyDrawing();

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
    const { url, importLegacyDrawing } = useImportDrawing();
    url.value =
      "https://map.geo.admin.ch/#/map?layers=KML%7Chttps://public.geo.admin.ch/api/kml/files/test123";

    await flushPromises();
    await importLegacyDrawing();

    expect(resolveUrlMock).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith(
      "https://public.geo.admin.ch/api/kml/files/test123",
    );
    expect(importKmlSpy).toHaveBeenCalled();
  });

  it("handles direct KML URL without server redirect", async () => {
    const { url, importLegacyDrawing } = useImportDrawing();
    url.value = "https://public.geo.admin.ch/api/kml/files/test123";

    await flushPromises();
    await importLegacyDrawing();

    expect(resolveUrlMock).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith(
      "https://public.geo.admin.ch/api/kml/files/test123",
    );
    expect(importKmlSpy).toHaveBeenCalled();
  });

  it("imports multiple KML drawings from viewer URL", async () => {
    const { url, importLegacyDrawing } = useImportDrawing();
    url.value =
      "https://map.geo.admin.ch/#/map?layers=KML%7Chttps://public.geo.admin.ch/api/kml/files/abc;KML%7Chttps://public.geo.admin.ch/api/kml/files/def";

    await flushPromises();
    await importLegacyDrawing();

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
    const { url, importLegacyDrawing, errorMessage } = useImportDrawing();
    url.value = "https://map.geo.admin.ch/#/map?layers=ch.test";

    await flushPromises();
    await importLegacyDrawing();

    expect(errorMessage.value).toBe("toolbox.import.errorMessages.noKmlFound");
  });

  it("sets error when domain is not allowed (server-side)", async () => {
    resolveUrlMock.mockRejectedValueOnce(
      new Error("Fetching from this domain is not allowed"),
    );

    const { url, importLegacyDrawing, errorMessage } = useImportDrawing();
    url.value = "https://evil.com/malicious.kml";

    await flushPromises();
    await importLegacyDrawing();

    expect(errorMessage.value).toBe("Fetching from this domain is not allowed");
  });

  it("sets error when KML URL domain is not allowed (client-side)", async () => {
    const { url, importLegacyDrawing, errorMessage } = useImportDrawing();
    url.value =
      "https://map.geo.admin.ch/#/map?layers=KML%7Chttps://evil.com/malicious.kml";

    await flushPromises();
    await importLegacyDrawing();

    expect(errorMessage.value).toContain("domainNotAllowed");
  });

  it("clears URL on success", async () => {
    const { url, importLegacyDrawing } = useImportDrawing();
    url.value = "https://s.geo.admin.ch/test123";

    await flushPromises();
    await importLegacyDrawing();

    expect(url.value).toBe("");
  });

  it("sets error when resolve fails", async () => {
    resolveUrlMock.mockRejectedValueOnce(new Error("Resolve failed"));

    const { url, importLegacyDrawing, errorMessage } = useImportDrawing();
    url.value = "https://s.geo.admin.ch/test123";

    await flushPromises();
    await importLegacyDrawing();

    expect(errorMessage.value).toBe("Resolve failed");
  });

  it("sets error when KML fetch fails", async () => {
    fetchMock.mockRejectedValueOnce(new Error("Network error"));

    const { url, importLegacyDrawing, errorMessage } = useImportDrawing();
    url.value = "https://s.geo.admin.ch/test123";

    await flushPromises();
    await importLegacyDrawing();

    expect(errorMessage.value).toBe("Network error");
  });

  it("sets error when KML response is not ok", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      statusText: "Not Found",
    });

    const { url, importLegacyDrawing, errorMessage } = useImportDrawing();
    url.value = "https://s.geo.admin.ch/test123";

    await flushPromises();
    await importLegacyDrawing();

    expect(errorMessage.value).toBe(
      "toolbox.import.errorMessages.kmlFetchFailed",
    );
  });

  it("sets isLoading during import and resets after", async () => {
    const { url, isLoading, importLegacyDrawing } = useImportDrawing();
    url.value = "https://s.geo.admin.ch/test123";

    await flushPromises();
    const promise = importLegacyDrawing();
    expect(isLoading.value).toBe(true);

    await promise;
    expect(isLoading.value).toBe(false);
  });

  it("clean up the @adminId part of the URL before fetching", async () => {
    const { url, importLegacyDrawing } = useImportDrawing();
    url.value =
      "https://map.geo.admin.ch/#/map?layers=KML%7Chttps://public.geo.admin.ch/api/kml/files/test123@adminId=987";

    await flushPromises();
    await importLegacyDrawing();

    expect(fetchMock).toHaveBeenCalledWith(
      "https://public.geo.admin.ch/api/kml/files/test123",
    );
  });
  describe("Swissgeo service drawings", () => {
    const id = "12345678-1234-1234-1234-123456789abc";
    const admin = "abcdef12-1234-1234-1234-123456789abc";
    const endpoint = runtimeConfigMock.public.drawingServiceEndpoint;

    function mockValidation(status = 204) {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id }),
      });
      fetchMock.mockResolvedValueOnce({ status });
    }

    it.each([
      "",
      "not a URL",
      "https://other.test/drawings",
      `${endpoint}/invalid#admin`,
    ])("rejects an invalid URL: %s", async (input) => {
      const drawing = useImportDrawing();
      drawing.url.value = input;
      await flushPromises();
      expect(drawing.swissGeoUrlValidation.value.isValid).toBe(false);
      expect(drawing.isCheckingUrl.value).toBe(false);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("validates metadata and authenticates the admin with a Bearer header", async () => {
      mockValidation();
      const drawing = useImportDrawing();
      drawing.url.value = `  ${endpoint}/${id}#${admin}  `;
      await flushPromises();
      expect(drawing.swissGeoUrlValidation.value).toEqual({
        isValid: true,
        drawingId: id,
        adminId: admin,
        adminIdProvided: true,
      });
      expect(fetchMock).toHaveBeenNthCalledWith(
        1,
        `${endpoint}/${id}/metadata`,
      );
      const [authUrl, options] = fetchMock.mock.calls[1]!;
      expect(authUrl).toBe(`${endpoint}/${id}/check-auth`);
      expect(options.headers.get("Authorization")).toBe(`Bearer ${admin}`);
    });

    it.each(["", "#invalid", `#${admin}`])(
      "allows a read-only import when admin auth is rejected (%s)",
      async (hash) => {
        mockValidation(401);
        const drawing = useImportDrawing();
        drawing.url.value = `${endpoint}/${id}${hash}`;
        await flushPromises();
        expect(drawing.swissGeoUrlValidation.value).toEqual({
          isValid: true,
          drawingId: id,
          adminId: "",
          adminIdProvided: !!hash,
        });
        if (hash !== `#${admin}`) {
          expect(fetchMock.mock.calls[1]![1].headers).toBeUndefined();
        }
      },
    );

    it.each(["http", "network", "auth"])(
      "rejects unavailable drawings after a %s failure",
      async (failure) => {
        if (failure === "http") {
          fetchMock.mockResolvedValueOnce({ ok: false, status: 404 });
        } else if (failure === "network") {
          fetchMock.mockRejectedValueOnce(new Error("Offline"));
        } else {
          fetchMock.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ id }),
          });
          fetchMock.mockRejectedValueOnce(new Error("Offline"));
        }
        const drawing = useImportDrawing();
        drawing.url.value = `${endpoint}/${id}`;
        await flushPromises();
        expect(drawing.swissGeoUrlValidation.value.isValid).toBe(false);
        expect(drawing.isCheckingUrl.value).toBe(false);
      },
    );

    it("ignores validation results for a URL that has since changed", async () => {
      let resolveMetadata!: (_value: unknown) => void;
      fetchMock.mockReturnValueOnce(
        new Promise((resolve) => {
          resolveMetadata = resolve;
        }),
      );
      const drawing = useImportDrawing();
      drawing.url.value = `${endpoint}/${id}`;
      await flushPromises();
      expect(drawing.isCheckingUrl.value).toBe(true);
      drawing.url.value = "https://other.test/";
      await flushPromises();
      resolveMetadata({ ok: true, json: () => Promise.resolve({ id }) });
      await flushPromises();
      expect(drawing.swissGeoUrlValidation.value.isValid).toBe(false);
      expect(drawing.isCheckingUrl.value).toBe(false);
    });

    it("rejects an import before validation succeeds", async () => {
      const drawing = useImportDrawing();
      await expect(drawing.importSwissgeoDrawing(false)).rejects.toThrow(
        "toolbox.import.errorMessages.generalError",
      );
      expect(clearDrawingLayerSpy).not.toHaveBeenCalled();
    });

    it("requires a validated admin ID for admin imports", async () => {
      mockValidation(401);
      const drawing = useImportDrawing();
      drawing.url.value = `${endpoint}/${id}`;
      await flushPromises();
      await expect(drawing.importSwissgeoDrawing(true)).rejects.toThrow(
        "toolbox.import.errorMessages.adminRequired",
      );
      expect(clearDrawingLayerSpy).not.toHaveBeenCalled();
    });

    it.each([false, true])(
      "imports KMZ with admin mode %s",
      async (asAdmin) => {
        mockValidation();
        const drawing = useImportDrawing();
        drawing.url.value = `${endpoint}/${id}?download=true#${admin}`;
        await flushPromises();
        const buffer = new ArrayBuffer(8);
        fetchMock.mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(buffer),
        });
        await drawing.importSwissgeoDrawing(asAdmin);
        expect(fetchMock).toHaveBeenLastCalledWith(
          `${endpoint}/${id}#${admin}`,
        );
        expect(clearDrawingLayerSpy).toHaveBeenCalledOnce();
        expect(mountDrawingLayerSpy).toHaveBeenCalledOnce();
        expect(importKmzSpy).toHaveBeenCalledWith(buffer);
        expect(drawingId.value).toBe(asAdmin ? id : "");
        expect(drawingAdminId.value).toBe(asAdmin ? admin : "");
        expect(drawingS3Url.value).toBe(
          asAdmin ? `${endpoint}/${id}#${admin}` : "",
        );
        expect(drawing.isLoading.value).toBe(false);
      },
    );

    it.each(["http", "network", "kmz"])(
      "resets loading after a %s import failure",
      async (failure) => {
        mockValidation();
        const drawing = useImportDrawing();
        drawing.url.value = `${endpoint}/${id}`;
        await flushPromises();
        if (failure === "http") {
          fetchMock.mockResolvedValueOnce({
            ok: false,
            statusText: "Not Found",
          });
        } else if (failure === "network") {
          fetchMock.mockRejectedValueOnce(new Error("Offline"));
        } else {
          fetchMock.mockResolvedValueOnce({
            ok: true,
            arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
          });
          importKmzSpy.mockRejectedValueOnce(new Error("Invalid KMZ"));
        }
        await expect(drawing.importSwissgeoDrawing(false)).rejects.toThrow();
        expect(drawing.isLoading.value).toBe(false);
        if (failure !== "kmz") {
          expect(clearDrawingLayerSpy).not.toHaveBeenCalled();
        }
      },
    );
  });
});
