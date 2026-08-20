import type { ComponentPublicInstance } from "vue";

import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { shallowMount } from "@vue/test-utils";
import ImportDrawingPanel from "~/components/debug/ImportDrawingPanel.vue";
import { describe, it, expect, vi, beforeEach } from "vitest";

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

vi.mock("@swissgeo/skeleton", () => ({
  IconButton: { template: "<button><slot /></button>" },
}));

describe("ImportDrawingPanel.vue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders correctly", () => {
    const wrapper = shallowMount(ImportDrawingPanel);
    expect(wrapper.exists()).toBe(true);
  });

  it("shows error message when URL is empty", async () => {
    const wrapper = shallowMount(ImportDrawingPanel);

    await (
      wrapper.vm as ComponentPublicInstance & {
        handleImport: () => Promise<void>;
      }
    ).handleImport();

    expect(wrapper.text()).toContain("Please enter a URL");
  });

  it("resolves redirect and fetches KML", async () => {
    const wrapper = shallowMount(ImportDrawingPanel);
    const input = wrapper.find('[data-testid="drawing-url-input"]');
    await input.setValue("https://s.geo.admin.ch/test123");

    await (
      wrapper.vm as ComponentPublicInstance & {
        handleImport: () => Promise<void>;
      }
    ).handleImport();

    expect(resolveUrlMock).toHaveBeenCalledWith(
      "/api/wpa/v1/drawing/resolve-url",
      { params: { url: "https://s.geo.admin.ch/test123" } },
    );
    expect(fetchMock).toHaveBeenCalledWith("https://example.com/kml/test.kml");
    expect(mountDrawingLayerSpy).toHaveBeenCalled();
    expect(importKmlSpy).toHaveBeenCalled();
  });

  it("parses KML URL from viewer URL with KML in layers", async () => {
    resolveUrlMock.mockResolvedValueOnce({
      redirectUrl:
        "https://sys-map.dev.bgdi.ch/#/map?layers=ch.test;KML%7Chttps://sys-public.dev.bgdi.ch/api/kml/files/abc123",
    });

    const wrapper = shallowMount(ImportDrawingPanel);
    const input = wrapper.find('[data-testid="drawing-url-input"]');
    await input.setValue("https://s.geo.admin.ch/test123");

    await (
      wrapper.vm as ComponentPublicInstance & {
        handleImport: () => Promise<void>;
      }
    ).handleImport();

    expect(fetchMock).toHaveBeenCalledWith(
      "https://sys-public.dev.bgdi.ch/api/kml/files/abc123",
    );
    expect(importKmlSpy).toHaveBeenCalled();
  });

  it("shows success message after import", async () => {
    const wrapper = shallowMount(ImportDrawingPanel);
    const input = wrapper.find('[data-testid="drawing-url-input"]');
    await input.setValue("https://s.geo.admin.ch/test123");

    await (
      wrapper.vm as ComponentPublicInstance & {
        handleImport: () => Promise<void>;
      }
    ).handleImport();

    expect(wrapper.text()).toContain("Drawing imported successfully");
  });

  it("shows error when resolve fails", async () => {
    resolveUrlMock.mockRejectedValueOnce(new Error("Resolve failed"));

    const wrapper = shallowMount(ImportDrawingPanel);
    const input = wrapper.find('[data-testid="drawing-url-input"]');
    await input.setValue("https://s.geo.admin.ch/test123");

    await (
      wrapper.vm as ComponentPublicInstance & {
        handleImport: () => Promise<void>;
      }
    ).handleImport();

    expect(wrapper.text()).toContain("Resolve failed");
  });

  it("shows error when KML fetch fails", async () => {
    fetchMock.mockRejectedValueOnce(new Error("Network error"));

    const wrapper = shallowMount(ImportDrawingPanel);
    const input = wrapper.find('[data-testid="drawing-url-input"]');
    await input.setValue("https://s.geo.admin.ch/test123");

    await (
      wrapper.vm as ComponentPublicInstance & {
        handleImport: () => Promise<void>;
      }
    ).handleImport();

    expect(wrapper.text()).toContain("Network error");
  });

  it("shows error when KML response is not ok", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      statusText: "Not Found",
    });

    const wrapper = shallowMount(ImportDrawingPanel);
    const input = wrapper.find('[data-testid="drawing-url-input"]');
    await input.setValue("https://s.geo.admin.ch/test123");

    await (
      wrapper.vm as ComponentPublicInstance & {
        handleImport: () => Promise<void>;
      }
    ).handleImport();

    expect(wrapper.text()).toContain("Failed to fetch KML: Not Found");
  });
});
