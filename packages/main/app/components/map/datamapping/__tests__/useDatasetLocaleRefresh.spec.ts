import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { flushPromises } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import useDatasetLocaleRefresh from "../useDatasetLocaleRefresh";

const { locale, newDataset } = await vi.hoisted(async () => {
  const { ref } = await import("vue");

  return {
    locale: ref("de"),
    newDataset: ref("new data"),
  };
});

mockNuxtImport("useI18n", () => {
  return () => ({
    locale,
  });
});

mockNuxtImport("useFetch", () => {
  return () => ({
    data: newDataset,
  });
});

mockNuxtImport("useRequestURL", () => {
  return () => new URL("http://localhost:3000/de/map");
});

describe("useDatasetRefresh", () => {
  const layerWithoutSelfLink = {
    uuid: "uuid",
    humanId: "external-layer",
    data: {
      links: [
        {
          rel: "distributions",
          href: "http://swissgeo.ch/distributions",
        },
      ],
      id: "external-layer",
      properties: {
        type: "Dataset" as const,
        title: "External Layer",
      },
    },
  };

  const partialLayer = {
    uuid: "uuid",
    humanId: "keusches-nonnenkraut",
    data: {
      links: [
        {
          rel: "self",
          href: "http://swissgeo.ch?language=de",
        },
      ],
      id: "keusches-nonnenkraut",
      properties: {
        type: "Dataset" as const,
        title: "Keusches Nonnenkraut",
      },
    },
  };

  it("throws when the dataset has no self link", () => {
    const updateCallback = vi.fn();
    const updateInfoCallback = vi.fn();

    expect(() =>
      useDatasetLocaleRefresh(
        layerWithoutSelfLink,
        updateCallback,
        updateInfoCallback,
      ),
    ).toThrow(/no "self" link/);
    expect(updateCallback).not.toHaveBeenCalled();
    expect(updateInfoCallback).not.toHaveBeenCalled();
  });

  it("updates the URL when the locale changes", async () => {
    const updateCallback = vi.fn();
    const updateInfoCallback = vi.fn();
    const { newUrlString } = useDatasetLocaleRefresh(
      partialLayer,
      updateCallback,
      updateInfoCallback,
    );

    locale.value = "fr";
    await flushPromises();
    expect(newUrlString.value).toEqual("http://swissgeo.ch/?language=fr");
  });

  it("updates the URL when the locale changes without previously having the query param", async () => {
    const updateCallback = vi.fn();
    const updateInfoCallback = vi.fn();
    const { newUrlString } = useDatasetLocaleRefresh(
      partialLayer,
      updateCallback,
      updateInfoCallback,
    );
    locale.value = "fr";
    await flushPromises();
    expect(newUrlString.value).toEqual("http://swissgeo.ch/?language=fr");
  });

  it("resolves a relative self link against the current request URL", async () => {
    const layerWithRelativeSelf = {
      uuid: "uuid",
      humanId: "imported-layer",
      data: {
        links: [
          {
            rel: "self",
            href: "/api/wpa/v1/layers/external/dataset/abc/my-layer",
          },
        ],
        id: "imported-layer",
        properties: {
          type: "Dataset" as const,
          title: "Imported",
        },
      },
    };
    const { newUrlString } = useDatasetLocaleRefresh(
      layerWithRelativeSelf,
      vi.fn(),
      vi.fn(),
    );
    locale.value = "fr";
    await flushPromises();
    expect(newUrlString.value).toEqual(
      "http://localhost:3000/api/wpa/v1/layers/external/dataset/abc/my-layer?language=fr",
    );
  });

  it("Triggers a refresh when the locale changes", async () => {
    const updateCallback = vi.fn();
    const updateInfoCallback = vi.fn();
    useDatasetLocaleRefresh(partialLayer, updateCallback, updateInfoCallback);

    locale.value = "fr";
    // mocking the behaviour that a new dataset is returned from useFetch
    newDataset.value = "dataset was reloaded";
    await flushPromises();
    expect(updateCallback).toHaveBeenCalled();
    expect(updateInfoCallback).toHaveBeenCalled();
  });
});
