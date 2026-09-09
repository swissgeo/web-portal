import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useShareDrawings } from "@/composables/useShareDrawings";

const { fetchMock, serializeAllFeaturesAsBlobMock } = vi.hoisted(() => ({
  fetchMock: vi.fn().mockResolvedValue({ ok: true }),
  serializeAllFeaturesAsBlobMock: vi.fn(),
}));

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
    vi.clearAllMocks();
    serializeAllFeaturesAsBlobMock.mockResolvedValue(
      new Blob(["hello"], { type: "application/vnd.google-earth.kmz" }),
    );
  });

  it("uploads the KMZ and its SHA-256 digest as multipart form data", async () => {
    const { shareDrawings } = useShareDrawings();

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
  });

  it("does not send a request when there is no drawing blob", async () => {
    serializeAllFeaturesAsBlobMock.mockResolvedValueOnce(null);
    const { isSharing, shareDrawings } = useShareDrawings();

    await shareDrawings();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(isSharing.value).toBe(false);
  });
});
