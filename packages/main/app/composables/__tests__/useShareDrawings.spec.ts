import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useShareDrawings } from "@/composables/useShareDrawings";
import { useDrawingImportStore } from "@/stores/drawingImport";

const { fetchMock, serializeAllFeaturesAsBlobMock } = vi.hoisted(() => ({
  fetchMock: vi.fn(),
  serializeAllFeaturesAsBlobMock: vi.fn(),
}));

let importDrawingStore: ReturnType<typeof useDrawingImportStore>;

const serviceResponse = {
  id: "drawing-123",
  admin_id: "admin-456",
  s3_url: "https://example.com/drawing-123.kmz",
};

mockNuxtImport("useRuntimeConfig", () => () => ({
  public: {
    drawingServiceEndpoint: "https://example.com/drawings",
  },
}));

vi.mock("@swissgeo/drawing", () => ({
  useDrawing: () => ({
    serializeAllFeaturesAsBlob: serializeAllFeaturesAsBlobMock,
  }),
}));

vi.stubGlobal("fetch", fetchMock);

describe("useShareDrawings", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    setActivePinia(createPinia());
    importDrawingStore = useDrawingImportStore();
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(serviceResponse),
    });
    serializeAllFeaturesAsBlobMock.mockResolvedValue(
      new Blob(["hello"], { type: "application/vnd.google-earth.kmz" }),
    );
  });

  it("uploads the KMZ and its SHA-256 digest as multipart form data", async () => {
    const { shareDrawings, isSharing } = useShareDrawings();

    await shareDrawings();

    expect(serializeAllFeaturesAsBlobMock).toHaveBeenCalledWith("kmz");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.com/drawings",
      expect.objectContaining({ method: "POST" }),
    );

    const request = fetchMock.mock.calls[0]![1] as RequestInit;
    const body = request.body as FormData;
    const file = body.get("file") as File;

    expect(body).toBeInstanceOf(FormData);
    expect(file.name).toBe("drawing.kmz");
    expect(file.type).toBe("application/vnd.google-earth.kmz");
    expect(await file.text()).toBe("hello");
    expect(body.get("sha256")).toBe(
      "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
    );
    expect(body.has("admin_id")).toBe(false);
    expect(importDrawingStore.drawingId).toBe(serviceResponse.id);
    expect(importDrawingStore.drawingAdminId).toBe(serviceResponse.admin_id);
    expect(isSharing.value).toBe(false);
  });

  it("updates an uploaded drawing from another composable using the stored IDs", async () => {
    const first = useShareDrawings();
    const second = useShareDrawings();

    await first.shareDrawings();
    await second.shareDrawings();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      `https://example.com/drawings/${serviceResponse.id}`,
      expect.objectContaining({ method: "PUT" }),
    );
    const request = fetchMock.mock.calls[1]![1] as RequestInit;
    const body = request.body as FormData;
    expect((request.headers as Headers).get("Authorization")).toBe(
      `Bearer ${serviceResponse.admin_id}`,
    );
    expect(body.has("admin_id")).toBe(false);
    expect(body.get("file")).toBeInstanceOf(File);
    expect(body.get("sha256")).toBe(
      "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
    );
    expect(importDrawingStore.drawingId).toBe(serviceResponse.id);
    expect(importDrawingStore.drawingAdminId).toBe(serviceResponse.admin_id);
  });

  it("does not send a request when there is no drawing blob", async () => {
    serializeAllFeaturesAsBlobMock.mockResolvedValueOnce(null);
    const { isSharing, shareDrawings } = useShareDrawings();

    await shareDrawings();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(isSharing.value).toBe(false);
  });
  it.each(["create", "update"])(
    "resets sharing after a failed %s response",
    async (operation) => {
      if (operation === "update") {
        importDrawingStore.drawingId = "existing";
        importDrawingStore.drawingAdminId = "admin";
      }
      fetchMock.mockResolvedValueOnce({ ok: false, statusText: "Forbidden" });
      const { shareDrawings, isSharing } = useShareDrawings();

      await expect(shareDrawings()).rejects.toThrow(
        operation === "create"
          ? "Failed to share drawings: Forbidden"
          : "Failed to update drawing: Forbidden",
      );
      expect(isSharing.value).toBe(false);
      expect(importDrawingStore.drawingId).toBe(
        operation === "update" ? "existing" : "",
      );
      expect(importDrawingStore.drawingAdminId).toBe(
        operation === "update" ? "admin" : "",
      );
    },
  );

  it.each(["create", "update"])(
    "resets sharing after a %s network error",
    async (operation) => {
      if (operation === "update") {
        importDrawingStore.drawingId = "existing";
        importDrawingStore.drawingAdminId = "admin";
      }
      fetchMock.mockRejectedValueOnce(new Error("Offline"));
      const { shareDrawings, isSharing } = useShareDrawings();
      await expect(shareDrawings()).rejects.toThrow("Offline");
      expect(isSharing.value).toBe(false);
    },
  );

  it.each(["create", "update"])(
    "resets sharing after an invalid %s response body",
    async (operation) => {
      if (operation === "update") {
        importDrawingStore.drawingId = "existing";
        importDrawingStore.drawingAdminId = "admin";
      }
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error("Invalid JSON")),
      });
      const { shareDrawings, isSharing } = useShareDrawings();
      await expect(shareDrawings()).rejects.toThrow("Invalid JSON");
      expect(isSharing.value).toBe(false);
      expect(importDrawingStore.drawingId).toBe(
        operation === "update" ? "existing" : "",
      );
      expect(importDrawingStore.drawingAdminId).toBe(
        operation === "update" ? "admin" : "",
      );
    },
  );

  it("keeps sharing active until the response is received", async () => {
    let resolveResponse!: (_value: unknown) => void;
    fetchMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveResponse = resolve;
      }),
    );
    const { shareDrawings, isSharing } = useShareDrawings();
    const pending = shareDrawings();
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(isSharing.value).toBe(true);
    resolveResponse({ ok: true, json: () => Promise.resolve(serviceResponse) });
    await pending;
    expect(isSharing.value).toBe(false);
  });

  it.each(["id", "admin"])(
    "creates a drawing when only the %s is available",
    async (available) => {
      importDrawingStore.drawingId = available === "id" ? "existing" : "";
      importDrawingStore.drawingAdminId = available === "admin" ? "admin" : "";
      const { shareDrawings } = useShareDrawings();
      await shareDrawings();
      expect(fetchMock).toHaveBeenCalledWith(
        "https://example.com/drawings",
        expect.objectContaining({ method: "POST" }),
      );
    },
  );
});
